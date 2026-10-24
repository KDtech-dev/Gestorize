'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { Checkbox } from '@mui/material';
import styles from './EmployeePermissionsDialog.module.css';

export type EmployeePermission = { id: string; nome: string; grupo?: string; acao?: string };

type Props = {
  permissions: EmployeePermission[];
  selected: string[];
  inherited: string[];
  onChange: (selected: string[]) => void;
  onClose: () => void;
};

export function EmployeePermissionsDialog({ permissions, selected, inherited, onChange, onClose }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const groups = useMemo(() => permissions.reduce<Record<string, EmployeePermission[]>>((result, permission) => {
    const group = permission.grupo || 'Outras permissões';
    (result[group] ??= []).push(permission);
    return result;
  }, {}), [permissions]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  function togglePermission(id: string) {
    if (inherited.includes(id)) return;
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  function toggleGroup(values: EmployeePermission[]) {
    const editableIds = values.map(({ id }) => String(id)).filter((id) => !inherited.includes(id));
    if (!editableIds.length) return;
    const allSelected = editableIds.every((id) => selected.includes(id));
    onChange(allSelected ? selected.filter((id) => !editableIds.includes(id)) : [...new Set([...selected, ...editableIds])]);
  }

  function toggleExpanded(group: string) {
    setExpandedGroups((current) => current.includes(group) ? current.filter((item) => item !== group) : [...current, group]);
  }

  return <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="employee-permissions-dialog-title" aria-describedby="employee-permissions-dialog-description">
      <header className={styles.header}>
        <div><span className={styles.eyebrow}><Icon icon="mdi:shield-account-outline" width={17} height={17} />EQUIPE · ACESSOS</span><h2 id="employee-permissions-dialog-title">Permissões individuais</h2><p id="employee-permissions-dialog-description">Selecione os acessos adicionais. As permissões do perfil aparecem bloqueadas.</p></div>
        <button type="button" className={styles.closeButton} aria-label="Fechar permissões" onClick={onClose}><Icon icon="mdi:close" width={21} height={21} /></button>
      </header>
      <div className={styles.summary}><strong>{selected.length}</strong> permissões adicionais selecionadas</div>
      <div className={styles.groups}>
        {Object.entries(groups).map(([group, values], index) => {
          const inheritedIds = values.map(({ id }) => String(id)).filter((id) => inherited.includes(id));
          const editableIds = values.map(({ id }) => String(id)).filter((id) => !inheritedIds.includes(id));
          const selectedCount = values.filter(({ id }) => inheritedIds.includes(String(id)) || selected.includes(String(id))).length;
          const allSelected = editableIds.length > 0 && editableIds.every((id) => selected.includes(id));
          const expanded = expandedGroups.includes(group);
          const panelId = `employee-permission-group-panel-${index}`;
          return <section className={styles.group} role="group" aria-labelledby={`employee-permission-group-${index}`} key={group}>
            <header className={styles.groupHeader}>
              <button type="button" className={styles.accordionToggle} id={`employee-permission-group-${index}`} aria-expanded={expanded} aria-controls={panelId} onClick={() => toggleExpanded(group)}>
                <span className={styles.groupTitle}><strong>{group}</strong><small>{selectedCount} de {values.length} selecionadas</small></span>
                <Icon className={styles.accordionIcon} icon="mdi:chevron-down" width={20} height={20} />
              </button>
              <button type="button" disabled={!editableIds.length} onClick={() => toggleGroup(values)}>{editableIds.length ? allSelected ? 'Desmarcar grupo' : 'Selecionar grupo' : 'Herdadas do perfil'}</button>
            </header>
            {expanded && <div className={styles.options} id={panelId}>{values.map((permission) => {
              const id = String(permission.id);
              const isInherited = inheritedIds.includes(id);
              const isSelected = isInherited || selected.includes(id);
              return <label className={`${styles.option} ${isSelected ? styles.selectedOption : ''}`} key={id}>
                <Checkbox checked={isSelected} disabled={isInherited} onChange={() => togglePermission(id)} size="small" sx={{ gridColumn: 1, gridRow: 1, p: 0, mt: '1px', color: 'var(--muted)', '&.Mui-checked': { color: '#005ce4' }, '&.Mui-disabled': { color: 'var(--muted)' } }} inputProps={{ 'aria-label': permission.nome }} />
                <span className={styles.optionCopy}><strong>{permission.nome}</strong>{permission.acao && <small>{permission.acao}</small>}</span>
                {isInherited && <span className={styles.inheritedBadge}><Icon icon="mdi:lock-outline" width={13} height={13} />Do perfil</span>}
              </label>;
            })}</div>}
          </section>;
        })}
        {!permissions.length && <p className={styles.empty}>Nenhuma permissão disponível para seleção.</p>}
      </div>
      <footer className={styles.footer}><span>{inherited.length} permissões herdadas do perfil</span><button type="button" onClick={onClose}>Concluir</button></footer>
    </section>
  </div>;
}
