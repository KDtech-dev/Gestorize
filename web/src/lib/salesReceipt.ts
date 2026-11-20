import type { Sale } from '@/components/sales/types';
import { money, paymentLabels } from '@/components/sales/types';

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export function printSaleReceipt(sale: Sale, organizationName: string, logoUrl?: string | null) {
  const printWindow = window.open('', '_blank', 'width=420,height=720');
  if (!printWindow) return false;
  const logo = logoUrl && /^(https?:\/\/|data:image\/)/i.test(logoUrl)
    ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="Logo da organização">`
    : '';
  const items = (sale.itens ?? []).flatMap((item) => Array.from(
    { length: Math.max(1, Number(item.quantidade)) },
    () => `<section class="item"><span>${escapeHtml(item.produto_nome)}</span><strong>${escapeHtml(money(item.preco_unitario))}</strong></section>`,
  )).join('');
  const payment = sale.forma_pagamento ? paymentLabels[sale.forma_pagamento] : 'Não informado';
  const status = sale.status === 'estornada' ? '<p class="status">VENDA ESTORNADA</p>' : '';

  printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Comprovante de venda</title><style>@page{size:80mm auto;margin:2mm}*{box-sizing:border-box}body{width:74mm;margin:0 auto;color:#111;font:12px/1.3 Arial,sans-serif}h1,p{margin:0}header{padding:3mm 0;border-bottom:1px dashed #555;text-align:left}.logo{display:block;max-width:38mm;max-height:18mm;object-fit:contain;object-position:left center;margin-bottom:2mm}h1{font-size:15px}.row,.item{display:flex;justify-content:space-between;gap:4px;text-align:left}.item{padding:2mm 0;border-bottom:1px dotted #aaa;overflow-wrap:anywhere}.totals{padding:3mm 0;border-bottom:1px dashed #555}.grand{font-size:16px;font-weight:bold}.footer{padding:4mm 0;text-align:left}.status{font-weight:bold;color:#991b1b;margin-top:2mm}</style></head><body><header>${logo}<h1>COMPROVANTE DE VENDA</h1><p>${escapeHtml(organizationName || 'Loja')}</p><p>Venda ${escapeHtml(sale.id.slice(0, 8))} · ${escapeHtml(new Date(sale.vendido_em).toLocaleString('pt-BR'))}</p><p>Cliente: ${escapeHtml(sale.cliente_nome || 'Consumidor')}</p>${status}</header>${items}<section class="totals"><div class="row"><span>Desconto</span><span>${escapeHtml(money(sale.desconto))}</span></div><div class="row grand"><span>Total</span><span>${escapeHtml(money(sale.valor_total))}</span></div><p>Pagamento: ${escapeHtml(payment)}</p></section><p class="footer">Obrigado pela preferência!</p><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
  printWindow.document.close();
  return true;
}
