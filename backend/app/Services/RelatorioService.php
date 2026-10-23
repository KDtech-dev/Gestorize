<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Orcamento;
use App\Models\Produto;
use Carbon\CarbonImmutable;

class RelatorioService
{
    public function gerar(string $periodo, string $tipo): array
    {
        [$inicio, $fim, $inicioAnterior, $fimAnterior] = $this->intervalo($periodo);

        $orcamentos = Orcamento::query()
            ->whereBetween('created_at', [$inicio, $fim])
            ->get(['created_at', 'valor_total', 'status']);
        $clientes = Cliente::query()
            ->whereBetween('created_at', [$inicio, $fim])
            ->get(['created_at']);
        $produtos = Produto::query()
            ->with('categoria:id,nome')
            ->whereBetween('created_at', [$inicio, $fim])
            ->get(['id', 'categoria_id', 'created_at']);

        $orcamentosAnteriores = Orcamento::query()
            ->whereBetween('created_at', [$inicioAnterior, $fimAnterior]);
        $clientesAnteriores = Cliente::query()
            ->whereBetween('created_at', [$inicioAnterior, $fimAnterior]);
        $aprovacoes = Orcamento::query()
            ->whereBetween('aprovado_em', [$inicio, $fim]);

        $valorOrcado = (float) $orcamentos->sum(fn ($item) => (float) $item->valor_total);
        $totalOrcamentos = $orcamentos->count();
        $totalClientes = $clientes->count();

        return [
            'periodo' => $periodo,
            'tipo' => $tipo,
            'intervalo' => [
                'inicio' => $inicio->toDateString(),
                'fim' => $fim->toDateString(),
            ],
            'nota' => 'Este relatório resume orçamentos. Consulte vendas registradas e baixas de estoque no histórico de vendas.',
            'metricas' => [
                'valor_orcado' => [
                    'valor' => round($valorOrcado, 2),
                    'variacao' => $this->variacao($valorOrcado, (float) (clone $orcamentosAnteriores)->sum('valor_total')),
                ],
                'orcamentos' => [
                    'valor' => $totalOrcamentos,
                    'variacao' => $this->variacao($totalOrcamentos, (clone $orcamentosAnteriores)->count()),
                ],
                'clientes' => [
                    'valor' => $totalClientes,
                    'variacao' => $this->variacao($totalClientes, (clone $clientesAnteriores)->count()),
                ],
            ],
            'totais' => [
                'valor_orcado' => round($valorOrcado, 2),
                'orcamentos' => $totalOrcamentos,
                'aprovacoes' => (clone $aprovacoes)->count(),
                'pendentes' => $orcamentos->where('status', 'pendente')->count(),
                'clientes' => $totalClientes,
                'produtos' => $produtos->count(),
            ],
            'serie' => $this->serie($periodo, $tipo, $orcamentos, $clientes, $produtos),
        ];
    }

    private function intervalo(string $periodo): array
    {
        $agora = CarbonImmutable::now();

        return match ($periodo) {
            'semana' => $this->intervaloMovel($agora, $agora->subDays(6)->startOfDay(), 7, 'days'),
            'mes' => $this->intervaloMovel($agora, $agora->subMonthNoOverflow()->startOfDay(), 1, 'months'),
            'ano' => $this->intervaloMovel($agora, $agora->subYearNoOverflow()->startOfDay(), 1, 'years'),
            default => [$agora->startOfDay(), $agora, $agora->subDay()->startOfDay(), $agora->subDay()],
        };
    }

    private function intervaloMovel(CarbonImmutable $fim, CarbonImmutable $inicio, int $quantidade, string $unidade): array
    {
        $inicioAnterior = match ($unidade) {
            'days' => $inicio->subDays($quantidade),
            'months' => $inicio->subMonthNoOverflow(),
            'years' => $inicio->subYearNoOverflow(),
        };

        return [$inicio, $fim, $inicioAnterior, $inicio->subSecond()];
    }

    private function serie(string $periodo, string $tipo, $orcamentos, $clientes, $produtos): array
    {
        if ($tipo === 'produtos') {
            $categorias = $produtos
                ->groupBy(fn ($produto) => $produto->categoria?->nome ?? 'Sem categoria')
                ->map(fn ($itens, $nome) => ['nome' => $nome, 'quantidade' => $itens->count()])
                ->sortByDesc('quantidade')
                ->values();

            return ['rotulos' => [], 'valores' => [], 'categorias' => $categorias];
        }

        [$buckets, $labels] = $this->buckets($periodo, CarbonImmutable::now());
        $valores = array_fill(0, count($buckets), 0);
        $eventos = match ($tipo) {
            'orcamentos' => $orcamentos,
            'clientes' => $clientes,
            default => $orcamentos,
        };

        foreach ($eventos as $evento) {
            $data = CarbonImmutable::parse($evento->created_at);
            $chave = match ($periodo) {
                'hoje' => sprintf('%02d', intdiv((int) $data->format('G'), 4) * 4),
                'ano' => $data->format('m-Y'),
                default => $data->format('Y-m-d'),
            };
            $indice = array_search($chave, $buckets, true);
            if ($indice === false) continue;

            $valores[$indice] += $tipo === 'movimentacao'
                ? (float) $evento->valor_total
                : 1;
        }

        return ['rotulos' => $labels, 'valores' => $valores, 'categorias' => []];
    }

    private function buckets(string $periodo, CarbonImmutable $agora): array
    {
        if ($periodo === 'hoje') {
            $chaves = $labels = [];
            $ultimaFaixa = intdiv((int) $agora->format('G'), 4) * 4;
            for ($hora = 0; $hora <= $ultimaFaixa; $hora += 4) {
                $chaves[] = sprintf('%02d', $hora);
                $labels[] = sprintf('%02dh', $hora);
            }
            return [$chaves, $labels];
        }

        if ($periodo === 'semana') {
            $inicio = $agora->subDays(6)->startOfDay();
            $datas = collect(range(0, 6))->map(fn ($dia) => $inicio->addDays($dia));
            return [$datas->map(fn ($data) => $data->format('Y-m-d'))->all(), $datas->map(fn ($data) => $data->format('d/m'))->all()];
        }

        if ($periodo === 'mes') {
            $inicio = $agora->subMonthNoOverflow()->startOfDay();
            $fim = $agora->startOfDay();
            $datas = [];
            for ($data = $inicio; $data <= $fim; $data = $data->addDay()) {
                $datas[] = $data;
            }
            return [
                collect($datas)->map(fn ($data) => $data->format('Y-m-d'))->all(),
                collect($datas)->map(fn ($data) => $data->format('d/m'))->all(),
            ];
        }

        $meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        $inicio = $agora->subYearNoOverflow()->startOfMonth();
        $fim = $agora->startOfMonth();
        $datas = [];
        for ($data = $inicio; $data <= $fim; $data = $data->addMonth()) {
            $datas[] = $data;
        }
        return [
            collect($datas)->map(fn ($data) => $data->format('m-Y'))->all(),
            collect($datas)->map(fn ($data) => $meses[(int) $data->format('n') - 1] . '/' . $data->format('y'))->all(),
        ];
    }

    private function variacao(float|int $atual, float|int $anterior): ?float
    {
        if ($anterior == 0) return $atual == 0 ? 0 : null;

        return round((($atual - $anterior) / $anterior) * 100, 1);
    }
}
