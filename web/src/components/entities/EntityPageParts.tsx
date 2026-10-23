'use client';

import type { CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import styles from './EntityPageParts.module.css';

type SummaryCardProps = { label: string; value: number | string; icon: string; color: string; compact?: boolean };

export function EntitySummaryCard({ label, value, icon, color, compact = false }: SummaryCardProps) {
  return (
    <article className={`${styles.summaryCard} ${compact ? styles.compactSummary : ''}`} style={{ '--summary-color': color } as CSSProperties}>
      <span className={styles.summaryIcon}><Icon icon={icon} width={22} height={22} /></span>
      <span className={styles.summaryLabel}>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

type EntityPageHeadingProps = {
  eyebrow: string;
  icon: string;
  title: string;
  description: string;
  createLabel: string;
  canCreate: boolean;
  onCreate: () => void;
};

export function EntityPageHeading({ eyebrow, icon, title, description, createLabel, canCreate, onCreate }: EntityPageHeadingProps) {
  return (
    <header className={styles.pageHeading}>
      <div className={styles.headingCopy}>
        <span className={styles.eyebrow}><Icon icon={icon} width={19} height={19} />{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {canCreate && <button type="button" className={styles.createButton} onClick={onCreate}>
        <Icon icon="mdi:plus" width={20} height={20} />{createLabel}
      </button>}
    </header>
  );
}

export function EntityDirectoryHeading({ eyebrow, title, description, count }: {
  eyebrow: string; title: string; description: string; count: number;
}) {
  return (
    <header className={styles.directoryHeading}>
      <div><span className={styles.directoryEyebrow}>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>
      <span className={styles.resultCount}>{count} resultado{count === 1 ? '' : 's'}</span>
    </header>
  );
}

export function EntityActionButton({ label, icon, onClick, danger = false }: {
  label: string; icon: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button type="button" className={`${styles.actionButton} ${danger ? styles.danger : ''}`}
      aria-label={label} data-tooltip={label}
      onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <Icon icon={icon} width={19} height={19} />
    </button>
  );
}

export function EntityPagination({ page, totalPages, total, from, to, noun, onChange }: {
  page: number; totalPages: number; total: number; from: number; to: number; noun: string; onChange: (page: number) => void;
}) {
  if (!total) return null;
  return (
    <nav className={styles.pagination} aria-label={`Paginação de ${noun}`}>
      <span>Exibindo <strong>{from}–{to}</strong> de <strong>{total}</strong> {noun}</span>
      <div>
        <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Página anterior" title="Página anterior"><Icon icon="mdi:chevron-left" width={20} height={20} /></button>
        <span>Página <strong>{page}</strong> de <strong>{totalPages}</strong></span>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Próxima página" title="Próxima página"><Icon icon="mdi:chevron-right" width={20} height={20} /></button>
      </div>
    </nav>
  );
}
