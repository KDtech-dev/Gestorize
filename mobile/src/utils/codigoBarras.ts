const CODE39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', A: 'wnnnnwnnw', B: 'nnwnnwnnw',
  C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn', F: 'nnwnwwnnn',
  G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
  K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww',
  O: 'wnnnwnnwn', P: 'nnwnwnnwn', Q: 'nnnnnnwwn', R: 'wnnnnnwnw',
  S: 'nnwnnnwnw', T: 'nnnnwnwnw', U: 'wwnnnnnnw', V: 'nwwnnnnnw',
  W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn', Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnwnnn', ' ': 'nwwnnwnnn', '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn',
};

const escaparHtml = (texto: string) => texto.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export const codigo39Svg = (codigo: string, height = 64) => {
  const valor = `*${codigo.toUpperCase().replace(/[^A-Z0-9 .$/+%-]/g, '')}*`;
  const narrow = 2;
  const wide = 5;
  const gap = 2;
  // Code 39 requires a clear quiet zone before and after the start/stop bars.
  let x = narrow * 10;
  const bars: string[] = [];
  [...valor].forEach((char, index) => {
    const pattern = CODE39[char];
    if (!pattern) return;
    [...pattern].forEach((width, element) => {
      const size = width === 'w' ? wide : narrow;
      if (element % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${size}" height="${height}"/>`);
      x += size;
    });
    if (index < valor.length - 1) x += gap;
  });
  x += narrow * 10;
  return `<svg class="codigo" xmlns="http://www.w3.org/2000/svg" width="100%" height="14mm" viewBox="0 0 ${x} ${height}" preserveAspectRatio="none" shape-rendering="crispEdges" role="img" aria-label="Código de barras ${escaparHtml(codigo)}"><rect width="100%" height="100%" fill="#fff"/><g fill="#111">${bars.join('')}</g></svg>`;
};

export type ProdutoEtiqueta = {
  nome: string;
  produto_id?: string | null;
  codigo_barras?: string | null;
  categoria_titulo?: string | null;
  fornecedor_razao_social?: string | null;
  unidade_medida_sigla?: string | null;
  preco_venda?: number | string | null;
};

export const LARGURA_ETIQUETA_PONTOS = 216;
export const ALTURA_ETIQUETA_PONTOS = 142;

export const FORMATOS_ETIQUETA = [
  { id: 'avery-l7159', label: 'A4 · Avery L7159 · 24 por folha', detail: 'Folha A4, 3 colunas × 8 linhas', width: 210, length: 297, a4: true },
  { id: 'brother-dk-11209', label: 'Brother QL-800 · DK-11209 · 29 × 62 mm', detail: 'Rolo de etiquetas pequenas', width: 29, length: 62, a4: false },
  { id: 'brother-dk-11201', label: 'Brother QL-800 · DK-11201 · 29 × 90 mm', detail: 'Rolo padrão de endereço', width: 29, length: 90, a4: false },
  { id: 'brother-dk-11208', label: 'Brother QL-800 · DK-11208 · 38 × 90 mm', detail: 'Rolo de etiquetas grandes', width: 38, length: 90, a4: false },
  { id: 'brother-dk-11202', label: 'Brother QL-800 · DK-11202 · 62 × 100 mm', detail: 'Rolo de expedição', width: 62, length: 100, a4: false },
  { id: 'brother-dk-22205', label: 'Brother QL-800 · DK-22205 contínuo · 62 × 50 mm', detail: 'Fita contínua, corte a cada 50 mm', width: 62, length: 50, a4: false },
] as const;
export type FormatoEtiquetaId = typeof FORMATOS_ETIQUETA[number]['id'];
export const isFormatoEtiquetaId = (value: string): value is FormatoEtiquetaId => FORMATOS_ETIQUETA.some((formato) => formato.id === value);
export const dimensoesImpressaoPontos = (formatoId: FormatoEtiquetaId) => {
  const formato = FORMATOS_ETIQUETA.find((item) => item.id === formatoId)!;
  return { width: Math.round(formato.width * 72 / 25.4), height: Math.round(formato.length * 72 / 25.4) };
};

const etiquetaMarkup = (produto: ProdutoEtiqueta) => {
  const preco = Number(produto.preco_venda ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const code = produto.produto_id?.replace(/-/g, '').slice(0, 12).toUpperCase() || produto.codigo_barras || '';
  const details = [produto.categoria_titulo, produto.unidade_medida_sigla].filter(Boolean).join(' · ');
  return `<article class="conteudo"><p class="nome">${escaparHtml(produto.nome)}</p>
    ${details ? `<p class="detalhe">${escaparHtml(details)}</p>` : ''}
    <p class="preco">${escaparHtml(preco)}</p>${codigo39Svg(code, 48)}<p class="numero">ID ${escaparHtml(code)}</p>
    </article>`;
};

const documentoEtiquetas = (etiquetas: string[], formatoId: FormatoEtiquetaId = 'avery-l7159') => {
  const formato = FORMATOS_ETIQUETA.find((item) => item.id === formatoId)!;
  const paginas = formato.a4
    ? Array.from({ length: Math.ceil(etiquetas.length / 24) }, (_, index) => `<section class="folha${index === Math.ceil(etiquetas.length / 24) - 1 ? ' ultima' : ''}">${etiquetas.slice(index * 24, (index + 1) * 24).map((item) => item.replace('class="conteudo"', 'class="conteudo etiqueta-a4"')).join('')}</section>`)
    : etiquetas.map((item) => `<section class="pagina-rolo"><div class="conteudo-rolo">${item}</div></section>`);
  const pageCss = formato.a4
    ? '@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0}body{font-family:Arial,sans-serif;color:#111}.folha{width:210mm;height:297mm;padding:12.9mm 7.25mm;display:grid;grid-template-columns:repeat(3,63.5mm);grid-template-rows:repeat(8,33.9mm);column-gap:2.5mm;row-gap:0;overflow:hidden;break-after:page;page-break-after:always;background:#fff}.folha.ultima{break-after:auto;page-break-after:auto}.etiqueta-a4{width:63.5mm;height:33.9mm;padding:1.4mm 1.8mm}'
    : `@page{size:${formato.width}mm ${formato.length}mm;margin:0}html,body{width:${formato.width}mm;margin:0;padding:0}body{font-family:Arial,sans-serif;color:#111}.pagina-rolo{position:relative;width:${formato.width}mm;height:${formato.length}mm;overflow:hidden;break-after:page;page-break-after:always;background:#fff}.conteudo-rolo{position:absolute;top:50%;left:50%;width:${formato.length}mm;height:${formato.width}mm;padding:2mm;display:flex;flex-direction:column;justify-content:center;overflow:hidden;transform:translate(-50%,-50%) rotate(90deg);transform-origin:center;background:#fff}`;
  const contentCss = `.conteudo{display:flex;flex-direction:column;align-items:stretch;overflow:hidden}.nome{max-height:7mm;overflow:hidden;font-size:9pt;font-weight:700;line-height:1.1;margin:0;overflow-wrap:anywhere}.detalhe{height:2.3mm;flex:none;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:5.5pt;line-height:2.3mm;margin:0;color:#444}.preco{font-size:10pt;font-weight:700;line-height:4mm;margin:0}.codigo{display:block;width:100%;height:10mm;margin-top:.5mm}.numero{text-align:center;font:6pt monospace;margin:.3mm 0 0;letter-spacing:.7px}.conteudo-rolo .nome{max-height:6mm;font-size:8pt}.conteudo-rolo .detalhe{height:2mm;line-height:2mm}.conteudo-rolo .preco{font-size:9pt;line-height:3.5mm}.conteudo-rolo .codigo{height:8mm}.conteudo-rolo .numero{font-size:5.5pt;margin:.2mm 0 0}@media screen{html,body{width:auto;min-height:100%;background:#e8edf3}body{padding:18px}.folha,.pagina-rolo{margin:0 auto 18px;box-shadow:0 4px 16px #0002}}@media print{html,body{height:auto;background:#fff}body{padding:0}.folha,.pagina-rolo{margin:0;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${pageCss}${contentCss}</style></head><body>${paginas.join('')}</body></html>`;
};

export const etiquetaProdutoHtml = (produto: ProdutoEtiqueta) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
  @page{size:76mm 50mm;margin:0}*{box-sizing:border-box}html,body{width:76mm;min-height:50mm;margin:0;padding:0;overflow:visible}body{font-family:Arial,sans-serif;color:#111}.conteudo{width:76mm;height:50mm;padding:3mm}.nome{max-height:9mm;font-size:13pt;margin:0 0 1.5mm}.detalhe{max-height:3.5mm;font-size:7pt;line-height:1.1;margin:0 0 .5mm}.preco{font-size:11pt;line-height:1.1;margin:1mm 0 0}.codigo{height:12mm;margin-top:1mm}.numero{text-align:center;font:7pt monospace;margin:.5mm 0 0;letter-spacing:1px}
  </style></head><body>${etiquetaMarkup(produto)}</body></html>`;

export const etiquetasProdutosHtml = (produtos: Array<{ produto: ProdutoEtiqueta; quantidade: number }>, formatoId: FormatoEtiquetaId = 'avery-l7159') => {
  const markup: string[] = [];
  produtos.forEach(({ produto, quantidade }) => {
    for (let index = 0; index < quantidade; index += 1) markup.push(etiquetaMarkup(produto));
  });
  return documentoEtiquetas(markup, formatoId);
};
