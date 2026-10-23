<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProdutoResource;
use App\Models\Produto;
use App\Services\ResponseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EtiquetaController extends Controller
{
    public function produtos(): JsonResponse
    {
        $produtos = Produto::with(['categoria', 'fornecedor', 'unidadeMedida', 'imagens'])
            ->latest()->get();

        $produtos->each(function (Produto $produto): void {
            $produto->setAttribute(
                'etiqueta_status',
                $produto->etiqueta_assinatura_impressa === $this->assinatura($produto) ? 'impresso' : 'pendente'
            );
        });

        return ResponseService::success(ProdutoResource::collection($produtos));
    }

    public function historico(Request $request): JsonResponse
    {
        $organizationId = $request->user()->organization_id;
        $operacoes = DB::table('etiqueta_operacoes')
            ->leftJoin('users', 'users.id', '=', 'etiqueta_operacoes.user_id')
            ->where('etiqueta_operacoes.organization_id', $organizationId)
            ->orderByDesc('etiqueta_operacoes.created_at')
            ->limit(100)
            ->get([
                'etiqueta_operacoes.id', 'etiqueta_operacoes.tipo', 'etiqueta_operacoes.status',
                'etiqueta_operacoes.total_produtos', 'etiqueta_operacoes.total_etiquetas',
                'etiqueta_operacoes.erro', 'etiqueta_operacoes.created_at', 'etiqueta_operacoes.updated_at',
                'users.name as usuario_nome',
            ]);

        $operacoes->each(function ($operacao) use ($organizationId): void {
            $operacao->itens = DB::table('etiqueta_operacao_itens')
                ->where('organization_id', $organizationId)
                ->where('operacao_id', $operacao->id)
                ->orderBy('produto_nome')
                ->get(['produto_id', 'produto_nome', 'codigo_barras', 'categoria_nome', 'fornecedor_nome', 'unidade_sigla', 'preco_venda', 'quantidade']);
        });

        return ResponseService::success($operacoes);
    }

    public function criarOperacao(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'tipo' => ['required', 'in:pendentes,todos,selecionados,reimpressao'],
            'idempotency_key' => ['required', 'uuid'],
            'itens' => ['required_if:tipo,selecionados,reimpressao', 'array', 'min:1', 'max:5000'],
            'itens.*.produto_id' => ['required', 'uuid', 'distinct'],
            'itens.*.quantidade' => ['required', 'integer', 'min:1', 'max:50'],
        ]);
        $user = $request->user();
        $organizationId = $user->organization_id;

        $existente = DB::table('etiqueta_operacoes')
            ->where('organization_id', $organizationId)
            ->where('idempotency_key', $dados['idempotency_key'])
            ->first();
        if ($existente) {
            return ResponseService::success($this->detalheOperacao($existente->id, $organizationId));
        }

        $itensSolicitados = collect($dados['itens'] ?? [])->keyBy('produto_id');
        $query = Produto::with(['categoria', 'fornecedor', 'unidadeMedida']);
        if (in_array($dados['tipo'], ['selecionados', 'reimpressao'], true)) {
            $produtos = $query->whereIn('id', $itensSolicitados->keys())->get();
            if ($produtos->count() !== $itensSolicitados->count()) {
                throw ValidationException::withMessages(['itens' => 'Um ou mais produtos não pertencem à sua organização.']);
            }
        } else {
            $produtos = $query->latest()->get();
            if ($dados['tipo'] === 'pendentes') {
                $produtos = $produtos->filter(fn (Produto $produto) =>
                    $produto->etiqueta_assinatura_impressa !== $this->assinatura($produto)
                )->values();
            }
        }

        if ($produtos->isEmpty()) {
            throw ValidationException::withMessages(['itens' => 'Não há produtos para gerar etiquetas nesta operação.']);
        }
        $quantidades = $produtos->mapWithKeys(fn (Produto $produto) => [
            $produto->id => in_array($dados['tipo'], ['selecionados', 'reimpressao'], true)
                ? (int) $itensSolicitados[$produto->id]['quantidade']
                : 1,
        ]);
        $totalEtiquetas = $quantidades->sum();
        if ($totalEtiquetas > 5000) {
            throw ValidationException::withMessages(['itens' => 'A operação não pode exceder 5.000 etiquetas. Divida a solicitação em operações menores.']);
        }

        $operationId = (string) Str::uuid();
        DB::transaction(function () use ($operationId, $dados, $user, $organizationId, $produtos, $quantidades, $totalEtiquetas): void {
            foreach ($produtos as $produto) {
                $this->garantirCodigoBarras($produto, $organizationId);
            }

            DB::table('etiqueta_operacoes')->insert([
                'id' => $operationId,
                'organization_id' => $organizationId,
                'user_id' => $user->id,
                'tipo' => $dados['tipo'],
                'status' => 'aguardando_confirmacao',
                'idempotency_key' => $dados['idempotency_key'],
                'total_produtos' => $produtos->count(),
                'total_etiquetas' => $totalEtiquetas,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            foreach ($produtos as $produto) {
                DB::table('etiqueta_operacao_itens')->insert([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $organizationId,
                    'operacao_id' => $operationId,
                    'produto_id' => $produto->id,
                    'produto_nome' => $produto->nome,
                    'codigo_barras' => $produto->codigo_barras,
                    'categoria_nome' => $produto->categoria?->nome,
                    'fornecedor_nome' => $produto->fornecedor?->nome,
                    'unidade_sigla' => $produto->unidadeMedida?->sigla,
                    'preco_venda' => $produto->preco_venda,
                    'assinatura' => $this->assinatura($produto),
                    'quantidade' => $quantidades[$produto->id],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        return ResponseService::success($this->detalheOperacao($operationId, $organizationId), 'Operação aguardando confirmação da impressão.', 201);
    }

    public function concluir(Request $request, string $id): JsonResponse
    {
        $organizationId = $request->user()->organization_id;
        DB::transaction(function () use ($id, $organizationId): void {
            $operation = DB::table('etiqueta_operacoes')->where('organization_id', $organizationId)->where('id', $id)->lockForUpdate()->first();
            abort_unless($operation, 404);
            if ($operation->status === 'concluida') return;
            if ($operation->status !== 'aguardando_confirmacao') {
                throw ValidationException::withMessages(['operacao' => 'Esta operação não pode ser concluída.']);
            }
            DB::table('etiqueta_operacoes')->where('id', $id)->update(['status' => 'concluida', 'updated_at' => now()]);
            $items = DB::table('etiqueta_operacao_itens')->where('organization_id', $organizationId)->where('operacao_id', $id)->get();
            foreach ($items as $item) {
                if (! $item->produto_id) continue;
                Produto::whereKey($item->produto_id)->update([
                    'etiqueta_assinatura_impressa' => $item->assinatura,
                    'etiqueta_impressa_em' => now(),
                ]);
            }
        });

        return ResponseService::success($this->detalheOperacao($id, $organizationId), 'Impressão registrada conforme confirmação do usuário.');
    }

    public function cancelar(Request $request, string $id): JsonResponse
    {
        $organizationId = $request->user()->organization_id;
        $updated = DB::table('etiqueta_operacoes')
            ->where('organization_id', $organizationId)->where('id', $id)
            ->where('status', 'aguardando_confirmacao')
            ->update(['status' => 'cancelada', 'updated_at' => now()]);
        abort_unless($updated || DB::table('etiqueta_operacoes')->where('organization_id', $organizationId)->where('id', $id)->exists(), 404);

        return ResponseService::success($this->detalheOperacao($id, $organizationId), 'Operação cancelada.');
    }

    private function detalheOperacao(string $id, string $organizationId): object
    {
        $operacao = DB::table('etiqueta_operacoes')->where('organization_id', $organizationId)->where('id', $id)->first();
        abort_unless($operacao, 404);
        return (object) [
            'id' => $operacao->id,
            'tipo' => $operacao->tipo,
            'status' => $operacao->status,
            'total_produtos' => $operacao->total_produtos,
            'total_etiquetas' => $operacao->total_etiquetas,
            'erro' => $operacao->erro,
            'created_at' => $operacao->created_at,
            'updated_at' => $operacao->updated_at,
            'itens' => DB::table('etiqueta_operacao_itens')
                ->where('organization_id', $organizationId)->where('operacao_id', $id)
                ->get(['produto_id', 'produto_nome', 'codigo_barras', 'categoria_nome', 'fornecedor_nome', 'unidade_sigla', 'preco_venda', 'quantidade']),
        ];
    }

    private function assinatura(Produto $produto): string
    {
        return hash('sha256', json_encode([
            'nome' => $produto->nome,
            'codigo_barras' => $produto->codigo_barras,
            'categoria' => $produto->categoria?->nome,
            'fornecedor' => $produto->fornecedor?->nome,
            'unidade' => $produto->unidadeMedida?->sigla,
            'preco' => number_format((float) $produto->preco_venda, 2, '.', ''),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function garantirCodigoBarras(Produto $produto, string $organizationId): void
    {
        if (filled($produto->codigo_barras)) {
            return;
        }

        do {
            $codigo = 'PRD' . strtoupper(Str::random(9));
        } while (DB::table('produtos')
            ->where('organization_id', $organizationId)
            ->where('codigo_barras', $codigo)
            ->exists());

        $produto->codigo_barras = $codigo;
        $produto->save();
    }
}
