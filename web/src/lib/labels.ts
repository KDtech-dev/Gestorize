import { apiFetch, unwrap } from '@/lib/api';

export type LabelOperationType = 'pendentes' | 'todos' | 'selecionados' | 'reimpressao';
export type LabelProduct = {
  id: string;
  nome: string;
  codigo_barras?: string | null;
  etiqueta_status?: 'pendente' | 'impresso';
  etiqueta_impressa_em?: string | null;
  categoria_titulo?: string | null;
  fornecedor_razao_social?: string | null;
  unidade_medida_sigla?: string | null;
  preco_venda?: number | string | null;
};
export type LabelOperationItem = {
  produto_id: string | null;
  produto_nome: string;
  codigo_barras: string | null;
  categoria_nome?: string | null;
  fornecedor_nome?: string | null;
  unidade_sigla?: string | null;
  preco_venda?: number | string | null;
  quantidade: number;
};
export type LabelOperation = {
  id: string;
  tipo: LabelOperationType;
  status: 'aguardando_confirmacao' | 'concluida' | 'cancelada' | 'falhou';
  total_produtos: number;
  total_etiquetas: number;
  usuario_nome?: string | null;
  erro?: string | null;
  created_at: string;
  updated_at?: string;
  itens: LabelOperationItem[];
};

export const LABEL_PRINT_FORMATS = [
  { id: 'avery-l7159', label: 'A4 · Avery L7159 · 24 por folha' },
  { id: 'brother-dk-11209', label: 'Brother QL-800 · DK-11209 · 29 × 62 mm' },
  { id: 'brother-dk-11201', label: 'Brother QL-800 · DK-11201 · 29 × 90 mm' },
  { id: 'brother-dk-11208', label: 'Brother QL-800 · DK-11208 · 38 × 90 mm' },
  { id: 'brother-dk-11202', label: 'Brother QL-800 · DK-11202 · 62 × 100 mm' },
  { id: 'brother-dk-22205', label: 'Brother QL-800 · DK-22205 contínuo · 62 × 50 mm' },
] as const;
export type LabelPrintFormat = typeof LABEL_PRINT_FORMATS[number]['id'];
export const isLabelPrintFormat = (value: string): value is LabelPrintFormat => LABEL_PRINT_FORMATS.some((format) => format.id === value);

export const unwrapList = <T,>(payload: unknown): T[] => {
  let current: unknown = payload;
  for (let index = 0; index < 5 && current && !Array.isArray(current); index += 1) {
    current = (current as { data?: unknown }).data;
  }
  return Array.isArray(current) ? current as T[] : [];
};

export const getLabelProducts = () => apiFetch<unknown>('/etiquetas/produtos').then(unwrapList<LabelProduct>);
export const getLabelHistory = () => apiFetch<unknown>('/etiquetas/historico').then(unwrapList<LabelOperation>);

const idempotencyKey = () => globalThis.crypto?.randomUUID?.()
  ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });

export async function createLabelOperation(tipo: LabelOperationType, itens: Array<{ produto_id: string; quantidade: number }> = []) {
  const payload = await apiFetch<unknown>('/etiquetas/operacoes', {
    method: 'POST',
    body: JSON.stringify({ tipo, itens, idempotency_key: idempotencyKey() }),
  });
  return unwrap<LabelOperation>(payload as never);
}

export const completeLabelOperation = (id: string) => apiFetch(`/etiquetas/operacoes/${id}/concluir`, { method: 'POST' });
export const cancelLabelOperation = (id: string) => apiFetch(`/etiquetas/operacoes/${id}/cancelar`, { method: 'POST' });

const CODE39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn', F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
  K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn', P: 'nnwnwnnwn', Q: 'nnnnnnwwn', R: 'wnnnnnwnw', S: 'nnwnnnwnw', T: 'nnnnwnwnw',
  U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn', Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnwnnn', ' ': 'nwwnnwnnn', '$': 'nwnwnwnnn', '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn',
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

function barcodeSvg(code: string) {
  const value = `*${code.toUpperCase().replace(/[^A-Z0-9 .$/+%-]/g, '')}*`;
  const narrow = 2;
  // Code 39 readers need a clear quiet zone on both sides of the bars.
  let x = narrow * 10;
  const bars: string[] = [];
  [...value].forEach((char, index) => {
    const pattern = CODE39[char];
    if (!pattern) return;
    [...pattern].forEach((width, element) => {
      const size = width === 'w' ? 5 : narrow;
      if (element % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${size}" height="48"/>`);
      x += size;
    });
    if (index < value.length - 1) x += 2;
  });
  x += narrow * 10;
  return `<svg class="barcode" xmlns="http://www.w3.org/2000/svg" width="100%" height="12mm" viewBox="0 0 ${x} 48" preserveAspectRatio="none" shape-rendering="crispEdges" role="img" aria-label="Código de barras ${escapeHtml(code)}"><rect width="100%" height="100%" fill="#fff"/><g fill="#111">${bars.join('')}</g></svg>`;
}

export function labelsPrintHtml(items: LabelOperationItem[], format: LabelPrintFormat = 'avery-l7159') {
  const labels = items.flatMap((item) => Array.from({ length: Number(item.quantidade) }, () => {
    // UUID completo fica denso demais para Code 39 em etiquetas de 76 mm.
    // O prefixo de 12 caracteres identifica o produto e é resolvido pela API.
    const code = item.produto_id?.replace(/-/g, '').slice(0, 12).toUpperCase() || item.codigo_barras || '';
    const price = Number(item.preco_venda ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const details = [item.categoria_nome, item.unidade_sigla].filter(Boolean).join(' · ');
    return `<article class="label-content"><p class="name">${escapeHtml(item.produto_nome)}</p>
      ${details ? `<p class="detail">${escapeHtml(details)}</p>` : ''}
      <p class="price">${escapeHtml(price)}</p>${barcodeSvg(code)}<p class="number">ID ${escapeHtml(code)}</p></article>`;
  }));
  const isA4 = format === 'avery-l7159';
  const rollSizes: Record<Exclude<LabelPrintFormat, 'avery-l7159'>, { width: number; length: number }> = {
    'brother-dk-11209': { width: 29, length: 62 },
    'brother-dk-11201': { width: 29, length: 90 },
    'brother-dk-11208': { width: 38, length: 90 },
    'brother-dk-11202': { width: 62, length: 100 },
    'brother-dk-22205': { width: 62, length: 50 },
  };
  const pages = isA4
    ? Array.from({ length: Math.ceil(labels.length / 24) }, (_, index) => `<section class="sheet${index === Math.ceil(labels.length / 24) - 1 ? ' last' : ''}">${labels.slice(index * 24, (index + 1) * 24).map((label) => label.replace('class="label-content"', 'class="label-content a4-label"')).join('')}</section>`)
    : labels.map((label) => `<section class="roll-sheet"><div class="roll-content">${label}</div></section>`);
  const pageStyle = isA4
    ? '@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0}body{font-family:Arial,sans-serif;color:#111}.sheet{width:210mm;height:297mm;padding:12.9mm 7.25mm;display:grid;grid-template-columns:repeat(3,63.5mm);grid-template-rows:repeat(8,33.9mm);column-gap:2.5mm;row-gap:0;overflow:hidden;break-after:page;page-break-after:always;background:#fff}.sheet.last{break-after:auto;page-break-after:auto}.a4-label{width:63.5mm;height:33.9mm;padding:1.4mm 1.8mm}'
    : (() => {
      const { width, length } = rollSizes[format as Exclude<LabelPrintFormat, 'avery-l7159'>];
      return `@page{size:${width}mm ${length}mm;margin:0}html,body{width:${width}mm;margin:0;padding:0}body{font-family:Arial,sans-serif;color:#111}.roll-sheet{position:relative;width:${width}mm;height:${length}mm;overflow:hidden;break-after:page;page-break-after:always;background:#fff}.roll-content{position:absolute;top:50%;left:50%;width:${length}mm;height:${width}mm;padding:2mm;display:flex;flex-direction:column;justify-content:center;overflow:hidden;transform:translate(-50%,-50%) rotate(90deg);transform-origin:center;background:#fff}`;
    })();
  const previewAndPrintStyle = `*{box-sizing:border-box}.label-content{display:flex;flex-direction:column;align-items:stretch;overflow:hidden}.name{max-height:7mm;overflow:hidden;font-size:9pt;font-weight:700;line-height:1.1;margin:0;overflow-wrap:anywhere}.detail{height:2.3mm;flex:none;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:5.5pt;line-height:2.3mm;margin:0;color:#444}.price{font-size:10pt;font-weight:700;line-height:4mm;margin:0}.barcode{display:block;width:100%;height:10mm;margin-top:.5mm}.number{text-align:center;font:6pt monospace;margin:.3mm 0 0;letter-spacing:.7px}.roll-content .name{max-height:6mm;font-size:8pt}.roll-content .detail{height:2mm;line-height:2mm}.roll-content .price{font-size:9pt;line-height:3.5mm}.roll-content .barcode{height:8mm}.roll-content .number{font-size:5.5pt;margin:.2mm 0 0}@media screen{html,body{width:auto;min-height:100%;background:#e8edf3}body{padding:18px}.sheet,.roll-sheet{margin:0 auto 18px;box-shadow:0 4px 16px #0002}}@media print{html,body{height:auto;background:#fff}body{padding:0}.sheet,.roll-sheet{margin:0;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Etiquetas de produtos · Gestorize</title><style>
    ${pageStyle}${previewAndPrintStyle}
  </style></head><body>${pages.join('')}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300));</script></body></html>`;
}
