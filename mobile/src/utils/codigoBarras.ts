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

export const codigo39Svg = (codigo: string, height = 64) => {
  const valor = `*${codigo.toUpperCase().replace(/[^A-Z0-9 .$/+%-]/g, '')}*`;
  const narrow = 2;
  const wide = 5;
  const gap = 2;
  let x = 0;
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
  return `<svg class="codigo" xmlns="http://www.w3.org/2000/svg" width="100%" height="14mm" viewBox="0 0 ${x} ${height}" role="img" aria-label="Código de barras ${codigo}"><rect width="100%" height="100%" fill="#fff"/><g fill="#111">${bars.join('')}</g></svg>`;
};

const escaparHtml = (texto: string) => texto.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export const etiquetaProdutoHtml = (produto: {
  nome: string;
  codigo_barras?: string | null;
  categoria_titulo?: string | null;
  fornecedor_razao_social?: string | null;
  unidade_medida_sigla?: string | null;
  preco_venda?: number | string | null;
}) => {
  const preco = Number(produto.preco_venda ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 76mm 50mm; margin: 0; } * { box-sizing: border-box; }
    html, body { width: 76mm; height: 50mm; margin: 0; padding: 0; overflow: hidden; }
    body { font-family: Arial,sans-serif; color: #111; }
    .etiqueta { width: 76mm; height: 50mm; padding: 3mm; overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
    .nome { max-height: 9mm; overflow: hidden; font-size: 13pt; font-weight: 700; line-height: 1.1; margin: 0 0 1.5mm; overflow-wrap: anywhere; }
    .detalhe { max-height: 3.5mm; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 7pt; line-height: 1.1; margin: 0 0 .5mm; }
    .preco { font-size: 11pt; font-weight: 700; line-height: 1.1; margin: 1mm 0 0; }
    .codigo { display: block; width: 100%; height: 12mm; margin-top: 1mm; }
    .numero { text-align: center; font: 7pt monospace; margin: .5mm 0 0; letter-spacing: 1px; }
  </style></head><body><main class="etiqueta"><p class="nome">${escaparHtml(produto.nome)}</p>
    ${produto.categoria_titulo ? `<p class="detalhe">Categoria: ${escaparHtml(produto.categoria_titulo)}</p>` : ''}
    ${produto.fornecedor_razao_social ? `<p class="detalhe">Fornecedor: ${escaparHtml(produto.fornecedor_razao_social)}</p>` : ''}
    ${produto.unidade_medida_sigla ? `<p class="detalhe">Unidade: ${escaparHtml(produto.unidade_medida_sigla)}</p>` : ''}
    <p class="preco">${preco}</p>${codigo39Svg(produto.codigo_barras ?? '', 48)}<p class="numero">${escaparHtml(produto.codigo_barras ?? '')}</p>
    </main></body></html>`;
};
