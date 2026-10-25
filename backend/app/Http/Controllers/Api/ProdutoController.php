<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProdutoImagemRequest;
use App\Http\Requests\StoreProdutoRequest;
use App\Http\Requests\UpdateProdutoRequest;
use App\Http\Resources\ProdutoImagemResource;
use App\Http\Resources\ProdutoResource;
use App\Models\Produto;
use App\Services\ProdutoImagemService;
use App\Services\ProdutoService;
use App\Services\ResponseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProdutoController extends Controller
{
    public function __construct(
        private ProdutoService $service,
        private ProdutoImagemService $imagemService
    ) {}

    public function index(): JsonResponse
    {
        return ResponseService::success(
            ProdutoResource::collection(
                $this->service->listar()
            )
        );
    }

    public function show(string $id): JsonResponse
    {
        return ResponseService::success(
            new ProdutoResource(
                $this->service->buscar($id)
            )
        );
    }

    public function buscarPorCodigo(string $codigo): JsonResponse
    {
        $codigo = trim($codigo);
        $produtoQuery = Produto::with(['categoria', 'fornecedor', 'unidadeMedida', 'imagens', 'codigosBarras']);
        $produto = (clone $produtoQuery)
            ->where('codigo_barras', $codigo)
            ->first();

        if (!$produto && $codigo !== strtoupper($codigo)) {
            $produto = (clone $produtoQuery)->where('codigo_barras', strtoupper($codigo))->first();
        }

        if (!$produto) {
            $codigoComercial = \App\Models\ProdutoCodigoBarras::query()
                ->where('codigo', $codigo)
                ->first();
            $produto = $codigoComercial?->produto?->load(['categoria', 'fornecedor', 'unidadeMedida', 'imagens', 'codigosBarras']);
        }

        if (!$produto) {
            $idPrefix = strtolower(str_replace('-', '', $codigo));
            if (strlen($idPrefix) >= 8 && strlen($idPrefix) <= 32 && ctype_xdigit($idPrefix)) {
                $groups = [];
                $offset = 0;
                foreach ([8, 4, 4, 4, 12] as $length) {
                    if ($offset >= strlen($idPrefix)) break;
                    $groups[] = substr($idPrefix, $offset, $length);
                    $offset += $length;
                }
                $matches = (clone $produtoQuery)
                    ->where('id', 'like', implode('-', $groups) . '%')
                    ->limit(2)
                    ->get();
                $produto = $matches->count() === 1 ? $matches->first() : null;
            }
        }

        abort_if(!$produto, 404, 'Produto não encontrado pelo código de barras.');

        return ResponseService::success(new ProdutoResource($produto));
    }

    public function store(
        StoreProdutoRequest $request
    ): JsonResponse {
        $dados = $request->validated();
        $imagens = $dados['imagens'] ?? [];
        $indiceImagemPrincipal = (int) ($dados['imagem_principal'] ?? 0);
        unset($dados['imagens'], $dados['imagem_principal']);

        $produto = $this->service->criar($dados);

        foreach ($imagens as $indice => $imagem) {
            $this->imagemService->adicionar(
                $produto,
                $imagem,
                $indice === $indiceImagemPrincipal
            );
        }

        $produto = $this->service->buscar($produto->id);

        return ResponseService::success(
            new ProdutoResource($produto),
            'Produto criado com sucesso.',
            201
        );
    }

    public function update(
        UpdateProdutoRequest $request,
        Produto $produto
    ): JsonResponse {
        $produto = $this->service->atualizar(
            $produto,
            $request->validated()
        );

        return ResponseService::success(
            new ProdutoResource($produto),
            'Produto atualizado com sucesso.'
        );
    }

    public function destroy(
        Produto $produto
    ): JsonResponse {
        $this->service->excluir($produto);

        return ResponseService::success(
            null,
            'Produto excluído com sucesso.'
        );
    }

    public function adicionarImagem(
        ProdutoImagemRequest $request,
        Produto $produto
    ): JsonResponse {
        $imagem = $this->imagemService->adicionar(
            $produto,
            $request->file('imagem'),
            $request->boolean('principal')
        );

        return ResponseService::success(
            new ProdutoImagemResource($imagem),
            'Imagem adicionada com sucesso.',
            201
        );
    }

    public function substituirImagemPrincipal(
        ProdutoImagemRequest $request,
        Produto $produto
    ): JsonResponse {
        $imagem = $this->imagemService->substituirPrincipal(
            $produto,
            $request->file('imagem')
        );

        return ResponseService::success(
            new ProdutoImagemResource($imagem),
            'Imagem principal substituída com sucesso.'
        );
    }

    public function definirImagemPrincipal(
        Request $request,
        string $id
    ): JsonResponse {
        $dados = $request->validate([
            'imagem_id' => ['required', 'uuid'],
        ]);

        $produto = Produto::findOrFail($id);

        $imagem = $produto->imagens()
            ->where('id', $dados['imagem_id'])
            ->firstOrFail();

        $imagem = $this->imagemService->definirPrincipal(
            $imagem
        );

        return ResponseService::success(
            new ProdutoImagemResource($imagem),
            'Imagem principal definida com sucesso.'
        );
    }

    public function removerImagem(
        Request $request,
        string $id
    ): JsonResponse {
        $dados = $request->validate([
            'imagem_id' => ['required', 'uuid'],
        ]);

        $produto = Produto::findOrFail($id);

        $imagem = $produto->imagens()
            ->where('id', $dados['imagem_id'])
            ->firstOrFail();

        $this->imagemService->remover($imagem);

        return ResponseService::success(
            null,
            'Imagem removida com sucesso.'
        );
    }
}
