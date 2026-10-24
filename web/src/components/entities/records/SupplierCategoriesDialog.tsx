'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Checkbox, TextField } from '@mui/material';
import styles from './SupplierCategoriesDialog.module.css';

type Category = { id: string; nome?: string };
type Props = {
  categories: Category[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onClose: () => void;
};

export function SupplierCategoriesDialog({ categories, selected, onChange, onClose }: Props) {
  const [search, setSearch] = useState('');
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const filtered = categories.filter((category) => String(category.nome ?? '').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const visibleIds = filtered.map((category) => String(category.id));
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  function toggleVisible() {
    onChange(allVisibleSelected ? selected.filter((id) => !visibleIds.includes(id)) : [...new Set([...selected, ...visibleIds])]);
  }

  return <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="supplier-categories-title" aria-describedby="supplier-categories-description">
      <header className={styles.header}><div><span className={styles.eyebrow}><Icon icon="mdi:shape-outline" width={17} height={17} />FORNECEDOR · CLASSIFICAÇÃO</span><h2 id="supplier-categories-title">Ramos de atividade</h2><p id="supplier-categories-description">Selecione as categorias que descrevem os serviços ou produtos do fornecedor.</p></div><button type="button" className={styles.closeButton} aria-label="Fechar ramos de atividade" onClick={onClose}><Icon icon="mdi:close" width={21} height={21} /></button></header>
      <div className={styles.toolbar}><div className={styles.search}><Icon icon="mdi:magnify" width={19} height={19} /><TextField variant="standard" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ramo de atividade" aria-label="Buscar ramo de atividade" sx={{ flex: 1, '& .MuiInputBase-root': { color: 'var(--ink)', fontSize: 15 }, '& .MuiInputBase-input': { height: 42, boxSizing: 'border-box', padding: '0 4px' }, '& .MuiInput-root:before, & .MuiInput-root:after': { display: 'none' } }} /></div><button type="button" className={styles.toggleVisible} disabled={!visibleIds.length} onClick={toggleVisible}>{allVisibleSelected ? 'Desmarcar exibidos' : 'Selecionar exibidos'}</button></div>
      <div className={styles.list}>
        {filtered.map((category) => {
          const id = String(category.id);
          const checked = selected.includes(id);
          return <label className={`${styles.option} ${checked ? styles.selected : ''}`} key={id}><Checkbox checked={checked} onChange={() => toggle(id)} size="small" sx={{ p: 0, color: 'var(--muted)', '&.Mui-checked': { color: '#005ce4' } }} inputProps={{ 'aria-label': category.nome || 'Categoria sem nome' }} /><span>{category.nome || 'Categoria sem nome'}</span></label>;
        })}
        {!filtered.length && <p className={styles.empty}>{categories.length ? 'Nenhum ramo corresponde à busca.' : 'Nenhum ramo de atividade disponível.'}</p>}
      </div>
      <footer className={styles.footer}><span><strong>{selected.length}</strong> ramo(s) selecionado(s)</span><button type="button" onClick={onClose}>Concluir</button></footer>
    </section>
  </div>;
}
