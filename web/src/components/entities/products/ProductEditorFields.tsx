'use client';

import { Icon } from '@iconify/react';
import type { ReactNode } from 'react';
import { ProductGallery, type ProductImage } from './ProductGallery';
import styles from './ProductEditorFields.module.css';

export type ProductForm = {
  nome: string;
  descricao: string;
  preco_custo: string;
  porcentagem_lucro: string;
  preco_venda: string;
  estoque: string;
  data_entrada: string;
  validade: string;
  categoria_id: string;
  fornecedor_id: string;
  unidade_medida_id: string;
};
export type ProductOption = { id: string; nome?: string; titulo?: string; sigla?: string };

type Props = {
  form: ProductForm;
  images: ProductImage[];
  categories: ProductOption[];
  suppliers: ProductOption[];
  units: ProductOption[];
  errors: Record<string, string>;
  validadeObrigatoria: boolean;
  canCreateCategory: boolean;
  categoryName: string;
  categoryEditorOpen: boolean;
  creatingCategory: boolean;
  onBlur: (name: string) => void;
  onChange: (name: keyof ProductForm, value: string) => void;
  onImagesChange: (images: ProductImage[]) => void;
  onGalleryError: (message: string) => void;
  onCategoryNameChange: (value: string) => void;
  onToggleCategoryEditor: () => void;
  onCreateCategory: () => void;
};

function Field({ label, name, value, onChange, onBlur, type = 'text', required, error, min, step, readOnly, hint }: {
  label: string; name: keyof ProductForm; value: string; onChange: Props['onChange']; onBlur: Props['onBlur']; type?: string; required?: boolean;
  error?: string; min?: string; step?: string; readOnly?: boolean; hint?: string;
}) {
  return <label className={styles.field}>
    <span>{label}{required && <i aria-hidden="true"> *</i>}</span>
    <input name={name} type={type} value={value} onChange={(event) => onChange(name, event.target.value)} onBlur={() => onBlur(name)} required={required} min={min} step={step} readOnly={readOnly} aria-invalid={!!error} />
    {error ? <small className={styles.error}>{error}</small> : hint ? <small className={styles.hint}>{hint}</small> : null}
  </label>;
}

function SelectField({ label, name, value, onChange, onBlur, options, required, emptyLabel, withSigla, error }: {
  label: string; name: keyof ProductForm; value: string; onChange: Props['onChange']; onBlur: Props['onBlur']; options: ProductOption[];
  required?: boolean; emptyLabel: string; withSigla?: boolean; error?: string;
}) {
  return <label className={styles.field}>
    <span>{label}{required && <i aria-hidden="true"> *</i>}</span>
    <select name={name} value={value} onChange={(event) => onChange(name, event.target.value)} onBlur={() => onBlur(name)} required={required} aria-invalid={!!error}>
      <option value="">{emptyLabel}</option>
      {options.map((option) => <option key={option.id} value={option.id}>{option.nome ?? option.titulo ?? ''}{withSigla && option.sigla ? ` (${option.sigla})` : ''}</option>)}
    </select>
    {error && <small className={styles.error}>{error}</small>}
  </label>;
}

function Section({ number, title, description, icon, children, className = '' }: { number: string; title: string; description: string; icon: string; children: ReactNode; className?: string }) {
  return <section className={`${styles.section} ${className}`}>
    <header className={styles.sectionHeading}><span className={styles.number}>{number}</span><div><h3><Icon icon={icon} width={21} height={21} />{title}</h3><p>{description}</p></div></header>
    {children}
  </section>;
}

export function ProductEditorFields({ form, images, categories, suppliers, units, errors, validadeObrigatoria, canCreateCategory, categoryName, categoryEditorOpen, creatingCategory, onChange, onBlur, onImagesChange, onGalleryError, onCategoryNameChange, onToggleCategoryEditor, onCreateCategory }: Props) {
  return <div className={styles.sections}>
    <ProductGallery name={form.nome} images={images} onChange={onImagesChange} onError={onGalleryError} />

    <Section number="02" title="Dados principais" description="Identifique o produto no catálogo." icon="mdi:package-variant-closed" className={styles.primarySection}>
      <div className={styles.fieldGrid}>
        <div className={styles.wide}><Field label="Nome do produto" name="nome" value={form.nome} onChange={onChange} onBlur={onBlur} required error={errors.nome} /></div>
        <label className={`${styles.field} ${styles.wide}`}><span>Descrição</span><textarea name="descricao" value={form.descricao} onChange={(event) => onChange('descricao', event.target.value)} onBlur={() => onBlur('descricao')} rows={3} maxLength={1000} /><small className={styles.hint}>Até 1.000 caracteres.</small></label>
      </div>
    </Section>

    <Section number="03" title="Valores e estoque" description="Defina custos, margem, preço de venda e quantidade disponível." icon="mdi:cash-multiple">
      <div className={`${styles.fieldGrid} ${styles.commercialGrid}`}>
        <Field label="Preço de custo (R$)" name="preco_custo" value={form.preco_custo} onChange={onChange} onBlur={onBlur} type="number" min="0" step="0.01" required error={errors.preco_custo} />
        <Field label="Margem de lucro (%)" name="porcentagem_lucro" value={form.porcentagem_lucro} onChange={onChange} onBlur={onBlur} type="number" min="0" step="0.01" required error={errors.porcentagem_lucro} />
        <Field label="Preço de venda (R$)" name="preco_venda" value={form.preco_venda} onChange={onChange} onBlur={onBlur} type="number" min="0" step="0.01" required readOnly error={errors.preco_venda} hint="Calculado pelo custo e pela margem de lucro." />
        <Field label="Quantidade em estoque" name="estoque" value={form.estoque} onChange={onChange} onBlur={onBlur} type="number" min="0" step="0.001" required error={errors.estoque} />
      </div>
    </Section>

    <Section number="04" title="Classificação" description="Organize a unidade, a categoria e o fornecedor." icon="mdi:clipboard-list-outline">
      <div className={styles.fieldGrid}>
        <SelectField label="Unidade de medida" name="unidade_medida_id" value={form.unidade_medida_id} onChange={onChange} onBlur={onBlur} options={units} emptyLabel="Selecione a unidade" required withSigla error={errors.unidade_medida_id} />
        <div className={styles.categoryField}>
          <SelectField label="Categoria" name="categoria_id" value={form.categoria_id} onChange={onChange} onBlur={onBlur} options={categories} emptyLabel="Sem categoria" error={errors.categoria_id} />
          {canCreateCategory && <>
            <button type="button" className={styles.categoryToggle} onClick={onToggleCategoryEditor}><Icon icon={categoryEditorOpen ? 'mdi:close' : 'mdi:plus-circle-outline'} width={17} height={17} />{categoryEditorOpen ? 'Fechar cadastro de categoria' : 'Cadastrar nova categoria'}</button>
            {categoryEditorOpen && <div className={styles.categoryCreate}><input value={categoryName} onChange={(event) => onCategoryNameChange(event.target.value)} maxLength={255} placeholder="Nome da categoria" aria-label="Nome da nova categoria" /><button type="button" onClick={onCreateCategory} disabled={creatingCategory || !categoryName.trim()}>{creatingCategory ? 'Salvando…' : 'Adicionar'}</button></div>}
          </>}
        </div>
        <SelectField label="Fornecedor" name="fornecedor_id" value={form.fornecedor_id} onChange={onChange} onBlur={onBlur} options={suppliers} emptyLabel="Sem fornecedor" error={errors.fornecedor_id} />
      </div>
    </Section>

    <Section number="05" title="Datas" description="Registre a entrada no estoque e, quando houver, a validade." icon="mdi:calendar-range">
      <div className={styles.fieldGrid}>
        <Field label="Data de entrada" name="data_entrada" value={form.data_entrada} onChange={onChange} onBlur={onBlur} type="date" required error={errors.data_entrada} />
        <Field label={validadeObrigatoria ? 'Validade' : 'Validade (opcional)'} name="validade" value={form.validade} onChange={onChange} onBlur={onBlur} type="date" required={validadeObrigatoria} error={errors.validade} />
      </div>
    </Section>
  </div>;
}
