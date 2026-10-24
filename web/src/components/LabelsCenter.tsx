'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Alert, Button, Chip, CircularProgress, IconButton, InputAdornment, MenuItem, Paper, Tab, Tabs, TextField } from '@mui/material';
import { useToast } from '@/context/ToastContext';
import { cancelLabelOperation, completeLabelOperation, createLabelOperation, getLabelHistory, getLabelProducts, isLabelPrintFormat, LABEL_PRINT_FORMATS, labelsPrintHtml, type LabelOperation, type LabelOperationType, type LabelProduct, type LabelPrintFormat } from '@/lib/labels';
import styles from './LabelsCenter.module.css';

type StatusFilter = 'todos' | 'pendente' | 'impresso';

const operationTitle = (type: LabelOperationType) => ({ todos: 'Impressão global', pendentes: 'Impressão de pendentes', selecionados: 'Produtos selecionados', reimpressao: 'Reimpressão individual' })[type];
const operationStatus = (status: LabelOperation['status']) => ({ aguardando_confirmacao: 'Aguardando confirmação', concluida: 'Concluída', cancelada: 'Cancelada', falhou: 'Falhou' })[status];
const dateTime = (value: string) => new Date(value).toLocaleString('pt-BR');

export function LabelsCenter() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<LabelProduct[]>([]);
  const [history, setHistory] = useState<LabelOperation[]>([]);
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>('todos');
  const [printFormat, setPrintFormat] = useState<LabelPrintFormat>('avery-l7159');
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);

  async function reload() {
    try {
      const [nextProducts, nextHistory] = await Promise.all([getLabelProducts(), getLabelHistory()]);
      setProducts(nextProducts);
      setHistory(nextHistory);
      setError('');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Não foi possível carregar as etiquetas.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  useEffect(() => {
    const savedFormat = window.localStorage.getItem('gestorize-label-print-format');
    if (savedFormat && isLabelPrintFormat(savedFormat)) setPrintFormat(savedFormat);
  }, []);

  const pending = useMemo(() => products.filter((product) => product.etiqueta_status !== 'impresso'), [products]);
  const printed = useMemo(() => products.filter((product) => product.etiqueta_status === 'impresso'), [products]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const statusMatches = filter === 'todos' || (filter === 'pendente' ? product.etiqueta_status !== 'impresso' : product.etiqueta_status === 'impresso');
      const searchMatches = !term || `${product.nome} ${product.codigo_barras ?? ''} ${product.id}`.toLocaleLowerCase().includes(term);
      return statusMatches && searchMatches;
    });
  }, [products, filter, search]);
  const selectedProductCount = Object.keys(selection).length;
  const selectedLabelCount = Object.values(selection).reduce((sum, count) => sum + count, 0);
  const allVisibleSelected = filtered.length > 0 && filtered.every((product) => Boolean(selection[product.id]));

  function toggleProduct(product: LabelProduct) {
    if (busyRef.current) return;
    setSelection((current) => {
      const next = { ...current };
      if (next[product.id]) delete next[product.id];
      else next[product.id] = 1;
      return next;
    });
  }

  function adjustQuantity(id: string, amount: number) {
    if (busyRef.current) return;
    setSelection((current) => {
      const next = { ...current };
      const quantity = Math.min(50, (next[id] ?? 0) + amount);
      if (quantity <= 0) delete next[id];
      else next[id] = quantity;
      return next;
    });
  }

  function toggleVisible() {
    setSelection((current) => {
      const next = { ...current };
      if (allVisibleSelected) filtered.forEach(({ id }) => { delete next[id]; });
      else filtered.forEach(({ id }) => { next[id] ??= 1; });
      return next;
    });
  }

  async function startPrint(type: LabelOperationType, quantities: Record<string, number> = {}) {
    if (busyRef.current) return;
    if (type === 'pendentes' && pending.length === 0) {
      showToast('Não há etiquetas pendentes. Todos os produtos estão atualizados.', 'info');
      return;
    }
    const labelCount = type === 'selecionados' || type === 'reimpressao'
      ? Object.values(quantities).reduce((sum, count) => sum + count, 0)
      : type === 'pendentes' ? pending.length : products.length;
    if (labelCount === 0) return;
    if (labelCount > 5000) {
      showToast('Gere no máximo 5.000 etiquetas por operação.', 'error');
      return;
    }
    if (type === 'todos' && !window.confirm(`Imprimir todas as etiquetas? Serão geradas ${products.length} etiquetas. Confirme o resultado depois que a janela de impressão fechar.`)) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.', 'error');
      return;
    }
    printWindow.document.title = 'Preparando etiquetas…';
    printWindow.document.body.textContent = 'Preparando a impressão das etiquetas…';
    busyRef.current = true;
    setBusy(true);
    setError('');
    let operation: LabelOperation | null = null;
    try {
      const items = Object.entries(quantities).map(([produto_id, quantidade]) => ({ produto_id, quantidade }));
      operation = await createLabelOperation(type, items);
      printWindow.document.open();
      printWindow.document.write(labelsPrintHtml(operation.itens, printFormat));
      printWindow.document.close();
      setTab(1);
      await reload();
      showToast('A janela de impressão foi aberta. Confirme o resultado no histórico depois de imprimir.', 'info');
    } catch (reason) {
      printWindow.close();
      if (operation) {
        try { await cancelLabelOperation(operation.id); } catch { /* a operação poderá ser resolvida pelo histórico */ }
      }
      showToast(reason instanceof Error ? reason.message : 'Não foi possível gerar as etiquetas.', 'error');
      await reload();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function resolveOperation(operation: LabelOperation, complete: boolean) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (complete) {
        await completeLabelOperation(operation.id);
        showToast('Impressão confirmada e etiquetas atualizadas.', 'success');
      } else {
        await cancelLabelOperation(operation.id);
        showToast('Operação cancelada. Os produtos continuam pendentes quando aplicável.', 'info');
      }
      setSelection({});
      await reload();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'Não foi possível atualizar a operação.', 'error');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return <main className={styles.page}>
    <header className={styles.heading}>
      <div className={styles.headingToolbar}>
        <Button component="a" href="/produtos" startIcon={<Icon icon="mdi:arrow-left" width={20} height={20} />} sx={{ minHeight: { xs: 44, sm: 50 }, px: { xs: 1, sm: 2.5 }, border: '1px solid #005ce4', borderRadius: '10px', bgcolor: '#005ce4', color: '#fff', fontSize: { xs: 14, sm: 17 }, fontWeight: 700, textTransform: 'none', whiteSpace: 'nowrap', boxShadow: '0 5px 14px #005ce433', '&:hover': { bgcolor: '#0048b8', boxShadow: '0 7px 18px #005ce440' } }} variant="contained"><span className={styles.fullLabel}>Voltar para produtos</span><span className={styles.compactLabel}>Voltar</span></Button>
        {tab === 0 && <Button className={styles.printButton} variant="contained" disabled={busy || selectedProductCount === 0} onClick={() => void startPrint('selecionados', selection)} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <Icon icon="mdi:printer-outline" width={20} height={20} />} sx={{ minHeight: { xs: 44, sm: 50 }, px: { xs: 1, sm: 2.5 }, border: '1px solid #005ce4', borderRadius: '10px', bgcolor: '#005ce4', color: '#fff', fontSize: { xs: 14, sm: 17 }, fontWeight: 700, textTransform: 'none', whiteSpace: 'nowrap', boxShadow: '0 5px 14px #005ce433', '&:hover': { bgcolor: '#0048b8', boxShadow: '0 7px 18px #005ce440' }, '&.Mui-disabled': { opacity: 0.6, bgcolor: '#005ce4', color: '#fff' } }}>{busy ? <><span className={styles.fullLabel}>Preparando…</span><span className={styles.compactLabel}>Aguarde…</span></> : <><span className={styles.fullLabel}>Gerar impressão ({selectedLabelCount})</span><span className={styles.compactLabel}>Imprimir ({selectedLabelCount})</span></>}</Button>}
      </div>
      <div className={styles.headingCopy}>
        <span className={styles.eyebrow}><Icon icon="mdi:tag-multiple-outline" width={20} height={20} />CATÁLOGO · IMPRESSÃO</span>
        <h1>Central de etiquetas</h1>
        <p>Gere etiquetas de produtos e acompanhe o resultado das impressões.</p>
      </div>
    </header>

    <section className={styles.summary} aria-label="Resumo de etiquetas">
      <Paper className={styles.summaryCard}><span>Pendentes</span><strong className={styles.pendingValue}>{loading ? '—' : pending.length}</strong></Paper>
      <Paper className={styles.summaryCard}><span>Impressos</span><strong className={styles.printedValue}>{loading ? '—' : printed.length}</strong></Paper>
      <Paper className={styles.summaryCard}><span>Etiquetas selecionadas</span><strong>{selectedLabelCount}</strong></Paper>
    </section>

    <Paper className={styles.panel}>
      <Tabs value={tab} onChange={(_, value: number) => setTab(value)} aria-label="Seções da central de etiquetas" className={styles.tabs}>
        <Tab label="Produtos" />
        <Tab label={`Histórico${history.length ? ` (${history.length})` : ''}`} />
      </Tabs>
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}<Button size="small" onClick={() => { setLoading(true); void reload(); }}>Tentar novamente</Button></Alert>}

      {tab === 0 ? <>
        <div className={styles.toolbar}>
          <TextField fullWidth size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Produto, código de barras ou ID" aria-label="Buscar produtos para etiquetas" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Icon className={styles.searchIcon} icon="mdi:magnify" width={20} height={20} /></InputAdornment> } }} />
          <TextField select size="small" label="Modelo da folha / rolo" value={printFormat} disabled={busy} onChange={(event) => {
            const nextFormat = event.target.value;
            if (isLabelPrintFormat(nextFormat)) {
              setPrintFormat(nextFormat);
              window.localStorage.setItem('gestorize-label-print-format', nextFormat);
            }
          }} helperText={printFormat === 'avery-l7159' ? 'Folha A4 em escala de 100%.' : 'Na impressora, selecione o rolo DK escolhido.'} aria-label="Modelo da folha ou rolo de impressão">
            {LABEL_PRINT_FORMATS.map((format) => <MenuItem key={format.id} value={format.id}>{format.label}</MenuItem>)}
          </TextField>
          <div className={styles.filters} role="group" aria-label="Filtrar situação das etiquetas">
            {([{ id: 'todos', label: `Todos (${products.length})` }, { id: 'pendente', label: `Pendentes (${pending.length})` }, { id: 'impresso', label: `Impressos (${printed.length})` }] as const).map((item) => <Button key={item.id} variant={filter === item.id ? 'contained' : 'outlined'} onClick={() => setFilter(item.id)} sx={{ minHeight: 40, px: 1.5, borderRadius: '9px', fontSize: 14, fontWeight: 700, textTransform: 'none' }}>{item.label}</Button>)}
          </div>
        </div>
        <div className={styles.selectionBar}>
          <Button variant="outlined" onClick={toggleVisible} disabled={filtered.length === 0 || busy} startIcon={<Icon icon={allVisibleSelected ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline'} width={20} height={20} />} sx={{ minHeight: 42, borderColor: 'var(--line)', color: 'var(--ink)', borderRadius: '9px', fontSize: 14, fontWeight: 700, textTransform: 'none' }}>{allVisibleSelected ? 'Desmarcar produtos exibidos' : 'Selecionar produtos exibidos'} ({filtered.length})</Button>
          {selectedProductCount > 0 && <Button onClick={() => setSelection({})} disabled={busy} sx={{ minHeight: 42, fontSize: 14, fontWeight: 700, textTransform: 'none' }}>Limpar seleção</Button>}
          <span>{selectedProductCount} produto(s) · {selectedLabelCount} etiqueta(s)</span>
        </div>
        {loading ? <div className={styles.loading}><CircularProgress size={26} />Carregando produtos…</div> : filtered.length ? <div className={styles.productList}>
          {filtered.map((product) => {
            const quantity = selection[product.id] ?? 0;
            const isPrinted = product.etiqueta_status === 'impresso';
            return <article key={product.id} className={`${styles.productRow}${quantity ? ` ${styles.selected}` : ''}`}>
              <span className={styles.productIcon}><Icon icon="mdi:package-variant-closed" width={25} height={25} /></span>
              <div className={styles.productInfo}>
                {product.categoria_titulo && <span className={styles.category}>{product.categoria_titulo}</span>}
                <strong>{product.nome}</strong>
                <span className={styles.code}><Icon icon="mdi:barcode" width={16} height={16} />Leitura: ID {product.id.replace(/-/g, '').slice(0, 12).toUpperCase()}</span>
              </div>
              <Chip size="small" label={isPrinted ? 'Impresso' : 'Pendente'} color={isPrinted ? 'success' : 'warning'} variant="outlined" />
              <div className={styles.controls}>
                {quantity > 0 && <div className={styles.stepper}>
                  <IconButton size="small" aria-label={`Remover uma etiqueta de ${product.nome}`} disabled={busy} onClick={() => adjustQuantity(product.id, -1)}><Icon icon="mdi:minus" width={18} height={18} /></IconButton>
                  <strong>{quantity}</strong>
                  <IconButton size="small" aria-label={`Adicionar uma etiqueta de ${product.nome}`} disabled={busy || quantity >= 50} onClick={() => adjustQuantity(product.id, 1)}><Icon icon="mdi:plus" width={18} height={18} /></IconButton>
                </div>}
                <IconButton aria-label={quantity ? `Remover ${product.nome} da seleção` : `Selecionar ${product.nome}`} aria-pressed={quantity > 0} disabled={busy} onClick={() => toggleProduct(product)} color={quantity ? 'primary' : 'default'}><Icon icon={quantity ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'} width={24} height={24} /></IconButton>
              </div>
            </article>;
          })}
        </div> : <div className={styles.empty}><Icon icon="mdi:tag-off-outline" width={36} height={36} /><strong>{products.length ? 'Nenhum produto corresponde aos filtros.' : 'Nenhum produto cadastrado.'}</strong></div>}
        <footer className={styles.footer}>
          <div>
            <Button variant="outlined" disabled={busy || pending.length === 0} onClick={() => void startPrint('pendentes')} sx={{ minHeight: 44, borderRadius: '9px', fontSize: 14, fontWeight: 700, textTransform: 'none' }}>Imprimir pendentes ({pending.length})</Button>
            <Button variant="outlined" disabled={busy || products.length === 0} onClick={() => void startPrint('todos')} sx={{ minHeight: 44, borderRadius: '9px', fontSize: 14, fontWeight: 700, textTransform: 'none' }}>Imprimir todas ({products.length})</Button>
          </div>
        </footer>
      </> : loading ? <div className={styles.loading}><CircularProgress size={26} />Carregando histórico…</div> : history.length ? <div className={styles.historyList}>
        {history.map((operation) => <article key={operation.id} className={styles.historyCard}>
          <header><span className={styles.historyIcon}><Icon icon="mdi:printer-outline" width={22} height={22} /></span><div><strong>{operationTitle(operation.tipo)}</strong><span>{dateTime(operation.created_at)}</span></div><Chip size="small" label={operationStatus(operation.status)} color={operation.status === 'concluida' ? 'success' : operation.status === 'aguardando_confirmacao' ? 'warning' : 'default'} /></header>
          <p>{operation.usuario_nome || 'Usuário'} · {operation.total_produtos} produto(s) · {operation.total_etiquetas} etiqueta(s)</p>
          <div className={styles.historyItems}>{operation.itens.map((item, index) => <span key={`${item.produto_id ?? item.produto_nome}-${index}`}>{item.produto_nome} × {item.quantidade}</span>)}</div>
          {operation.erro && <Alert severity="error">{operation.erro}</Alert>}
          {operation.status === 'aguardando_confirmacao' && <footer><span>Confirme o resultado depois de verificar a impressão.</span><div><Button disabled={busy} onClick={() => void resolveOperation(operation, false)} sx={{ fontSize: 14, textTransform: 'none' }}>Não imprimiu</Button><Button disabled={busy} variant="contained" onClick={() => void resolveOperation(operation, true)} sx={{ bgcolor: '#005ce4', fontSize: 14, textTransform: 'none' }}>Confirmar impressão</Button></div></footer>}
        </article>)}
      </div> : <div className={styles.empty}><Icon icon="mdi:history" width={36} height={36} /><strong>Ainda não há operações de impressão.</strong></div>}
    </Paper>
  </main>;
}
