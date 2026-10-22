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
            'semana' => (function () use ($agora) {
                $inicio = $agora->startOfWeek(CarbonImmutable::MONDAY);
                return [$inicio, $agora, $inicio->subWeek(), $agora->subWeek()];
            })(),
            'mes' => (function () use ($agora) {
                $inicio = $agora->startOfMonth();
                $anteriorInicio = $inicio->subMonthNoOverflow()->startOfMonth();
                return [$inicio, $agora, $anteriorInicio, $agora->subMonthNoOverflow()];
            })(),
            'ano' => (function () use ($agora) {
                $inicio = $agora->startOfYear();
                return [$inicio, $agora, $inicio->subYearNoOverflow(), $agora->subYearNoOverflow()];
            })(),
            default => [$agora->startOfDay(), $agora, $agora->subDay()->startOfDay(), $agora->subDay()],
        };
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

        [$buckets, $labels] = $this->buckets($periodo);
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
                'ano' => $data->format('m'),
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

    private function buckets(string $periodo): array
    {
        if ($periodo === 'hoje') {
            $chaves = $labels = [];
            for ($hora = 0; $hora < 24; $hora += 4) {
                $chaves[] = sprintf('%02d', $hora);
                $labels[] = sprintf('%02dh', $hora);
            }
            return [$chaves, $labels];
        }

        if ($periodo === 'semana') {
            $inicio = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);
            $labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
            return [collect(range(0, 6))->map(fn ($dia) => $inicio->addDays($dia)->format('Y-m-d'))->all(), $labels];
        }

        if ($periodo === 'mes') {
            $inicio = CarbonImmutable::now()->startOfMonth();
            $dias = $inicio->daysInMonth;
            return [
                collect(range(0, $dias - 1))->map(fn ($dia) => $inicio->addDays($dia)->format('Y-m-d'))->all(),
                collect(range(1, $dias))->map(fn ($dia) => sprintf('%02d', $dia))->all(),
            ];
        }

        $meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return [collect(range(1, 12))->map(fn ($mes) => sprintf('%02d', $mes))->all(), $meses];
    }

    private function variacao(float|int $atual, float|int $anterior): ?float
    {
        if ($anterior == 0) return $atual == 0 ? 0 : null;

        return round((($atual - $anterior) / $anterior) * 100, 1);
    }
}
