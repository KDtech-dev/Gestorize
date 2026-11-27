import { codigo39Svg } from './codigoBarras';

export type FuncionarioCracha = {
  codigo_cracha: string;
  nome: string | null;
  avatar_url: string | null;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

const nomeCracha = (nome: string | null) => {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : partes[0] || 'Funcionário';
};

export function crachasFuncionariosHtml(funcionarios: FuncionarioCracha[]) {
  const crachas = funcionarios.map((funcionario) => {
    const nome = nomeCracha(funcionario.nome);
    const codigo = funcionario.codigo_cracha.toUpperCase();
    const iniciais = nome.split(/\s+/).map((parte) => parte[0]).join('').slice(0, 2).toUpperCase();
    const foto = funcionario.avatar_url
      ? `<img class="avatar" src="${escapeHtml(funcionario.avatar_url)}" alt="">`
      : `<div class="avatar iniciais">${escapeHtml(iniciais)}</div>`;
    return `<article class="cracha">${foto}<h2>${escapeHtml(nome)}</h2>${codigo39Svg(codigo, 48)}<p>${escapeHtml(codigo)}</p></article>`;
  });
  const paginas = Array.from({ length: Math.ceil(crachas.length / 9) }, (_, index) =>
    `<section class="folha${index === Math.ceil(crachas.length / 9) - 1 ? ' ultima' : ''}">${crachas.slice(index * 9, (index + 1) * 9).join('')}</section>`,
  );
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0;font-family:Arial,sans-serif;color:#111}.folha{width:210mm;height:297mm;padding:10mm;display:grid;grid-template-columns:repeat(3,54mm);grid-template-rows:repeat(3,86mm);gap:5mm 7mm;justify-content:center;align-content:center;break-after:page;page-break-after:always}.folha.ultima{break-after:auto;page-break-after:auto}.cracha{width:54mm;height:86mm;border:.25mm solid #aab3c2;border-radius:3mm;padding:5mm 3mm 3mm;display:flex;flex-direction:column;align-items:center;overflow:hidden;text-align:center}.avatar{width:25mm;height:25mm;border-radius:50%;object-fit:cover;flex:none;background:#e8edf5}.iniciais{display:flex;align-items:center;justify-content:center;font-size:20pt;font-weight:700;color:#17365f}h2{width:100%;height:10mm;margin:3mm 0 2mm;display:flex;align-items:center;justify-content:center;font-size:12pt;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.codigo{display:block;width:100%;height:15mm;flex:none}p{margin:2mm 0 0;font:6.5pt monospace;letter-spacing:.3px;overflow-wrap:anywhere}@media screen{body{background:#e8edf3}.folha{margin:16px auto;background:#fff;box-shadow:0 4px 16px #0002}}@media print{.folha{margin:0;box-shadow:none}}
  </style></head><body>${paginas.join('')}</body></html>`;
}
