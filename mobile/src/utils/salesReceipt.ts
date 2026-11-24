import { VendaType } from '@api/apiVendas';

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const currency = (value: unknown) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const payments: Record<string, string> = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito' };

export function createSaleReceiptHtml(sale: VendaType, organizationName: string, logoUrl?: string | null) {
  const safeLogo = typeof logoUrl === 'string' && /^(https?:\/\/|data:image\/)/i.test(logoUrl) ? logoUrl : null;
  const logo = safeLogo ? `<img class="logo" src="${escapeHtml(safeLogo)}" alt="Logo da organização">` : '';
  const itemsHtml = (sale.itens ?? []).flatMap((item) => Array.from(
    { length: Math.max(1, Number(item.quantidade)) },
    () => `<div class="item"><span>${escapeHtml(item.produto_nome)}</span><b>${currency(item.preco_unitario)}</b></div>`,
  )).join('');
  const voidLabel = sale.status === 'estornada' ? '<p class="status">VENDA ESTORNADA</p>' : '';
  const payment = sale.forma_pagamento ? payments[sale.forma_pagamento] : 'Não informado';

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>@page{size:A4 portrait;margin:15mm}*{box-sizing:border-box}html,body{margin:0;padding:0}body{width:100%;max-width:180mm;margin:0 auto;color:#111;font:12px/1.4 Arial,sans-serif}header{text-align:left;padding:3mm 0;border-bottom:1px dashed #555}.logo{display:block;max-width:50mm;max-height:24mm;object-fit:contain;object-position:left center;margin-bottom:2mm}h1{font-size:18px;margin:0}.linha,.item{display:flex;justify-content:space-between;gap:8px;text-align:left}.item{padding:3mm 0;border-bottom:1px dotted #aaa;overflow-wrap:anywhere}.totais{padding:4mm 0;border-bottom:1px dashed #555}.total{font-size:18px;font-weight:bold}.rodape{text-align:left;padding:5mm 0}.status{font-weight:bold;color:#991b1b}</style></head><body><header>${logo}<h1>COMPROVANTE DE VENDA</h1><p>${escapeHtml(organizationName || 'Loja')}</p><p>Venda ${escapeHtml(sale.id.slice(0, 8))} · ${escapeHtml(new Date(sale.vendido_em).toLocaleString('pt-BR'))}</p><p>Cliente: ${escapeHtml(sale.cliente_nome || 'Consumidor')}</p>${voidLabel}</header>${itemsHtml}<section class="totais"><div class="linha"><span>Desconto</span><span>${currency(sale.desconto)}</span></div><div class="linha total"><span>Total</span><span>${currency(sale.valor_total)}</span></div><p>Pagamento: ${escapeHtml(payment)}</p></section><p class="rodape">Obrigado pela preferência!</p></body></html>`;
}
