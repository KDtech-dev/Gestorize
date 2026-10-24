'use client';

import { useRef } from 'react';
import { Icon } from '@iconify/react';
import { MenuItem, TextField } from '@mui/material';
import { UserAvatar } from '@/components/UserAvatar';
import { entityFieldSx, entityMenuProps } from '../formFieldStyles';
import styles from './ClientEditorFields.module.css';

type ClientForm = Record<string, any>;
type Props = {
  form: ClientForm;
  onChange: (name: string, value: string) => void;
  errors?: Record<string, string>;
  onBlur?: (name: string) => void;
  cepStatus?: 'idle' | 'loading' | 'found' | 'not-found' | 'error';
  avatarUrl?: string | null;
  onAvatarChange?: (file: File | null) => void;
  onRemoveAvatar?: () => void;
  canRemoveAvatar?: boolean;
};

function ClientField({ label, name, value, onChange, type = 'text', required = false, wide = false, error, onBlur, placeholder, inputMode, hint, hintStatus }: {
  label: string; name: string; value: unknown; onChange: (name: string, value: string) => void;
  type?: string; required?: boolean; wide?: boolean; error?: string; onBlur?: (name: string) => void; placeholder?: string; inputMode?: 'text' | 'numeric' | 'email' | 'tel'; hint?: string; hintStatus?: 'loading' | 'success' | 'error';
}) {
  const helperText = error ?? hint;
  return <div className={`${styles.field} ${wide ? styles.wide : ''}`}>
    <TextField fullWidth variant="outlined" label={label} name={name} type={type} value={String(value ?? '')} onChange={(event) => onChange(name, event.target.value)} onBlur={() => onBlur?.(name)} required={required} placeholder={placeholder} error={!!error} helperText={!error && hintStatus === 'loading' ? <><span className={styles.hintSpinner} aria-hidden="true" />{helperText}</> : helperText} sx={entityFieldSx} slotProps={{ htmlInput: { inputMode, 'aria-describedby': helperText ? `${name.replace(/\./g, '-')}-helper` : undefined }, inputLabel: { shrink: !!placeholder || type === 'date' }, formHelperText: { id: `${name.replace(/\./g, '-')}-helper`, className: !error && hintStatus ? styles[`fieldHint_${hintStatus}`] : undefined } }} />
  </div>;
}

export function ClientEditorFields({ form, onChange, errors = {}, onBlur, cepStatus = 'idle', avatarUrl, onAvatarChange, onRemoveAvatar, canRemoveAvatar = false }: Props) {
  const avatarInput = useRef<HTMLInputElement>(null);
  return <div className={styles.sections}>
    <section className={styles.avatarSection} aria-label="Imagem do cliente">
      <UserAvatar name={String(form.nome || 'Cliente')} imageUrl={avatarUrl} fallbackIcon={form.tipo === 'pj' ? 'mdi:domain' : 'mdi:account-outline'} size={82} className={styles.avatar} />
      <div className={styles.avatarCopy}><strong>Foto do cliente</strong><span>JPG, PNG ou WEBP · até 2 MB</span><div className={styles.avatarActions}>
        <button type="button" className={styles.avatarButton} onClick={() => avatarInput.current?.click()}><Icon icon="mdi:upload-outline" width={17} height={17} />Escolher imagem</button>
        {canRemoveAvatar && <button type="button" className={styles.removeAvatarButton} onClick={onRemoveAvatar}><Icon icon="mdi:trash-can-outline" width={16} height={16} />Remover</button>}
      </div></div>
      <input ref={avatarInput} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Selecionar avatar do cliente" onChange={(event) => { onAvatarChange?.(event.target.files?.[0] ?? null); event.target.value = ''; }} />
    </section>
    <section className={`${styles.section} ${styles.identificationSection}`} aria-labelledby="client-identification-title">
      <header className={styles.sectionHeading}><span>01</span><div><h3 id="client-identification-title">Identificação e contato</h3><p>Informe como o cliente será identificado e contatado.</p></div></header>
      <div className={styles.fieldGrid}>
        <ClientField wide label="Nome completo ou nome de exibição" name="nome" value={form.nome} onChange={onChange} required error={errors.nome} onBlur={onBlur} placeholder="Ex.: Maria da Silva" />
        <div className={styles.field}><TextField fullWidth select label="Tipo de cliente" value={form.tipo ?? 'pf'} onChange={(event) => onChange('tipo', String(event.target.value))} sx={entityFieldSx} slotProps={{ select: { MenuProps: entityMenuProps } }}><MenuItem value="pf">Pessoa física</MenuItem><MenuItem value="pj">Pessoa jurídica</MenuItem></TextField></div>
        <ClientField label="E-mail" name="email" value={form.email} onChange={onChange} type="email" error={errors.email} onBlur={onBlur} placeholder="nome@exemplo.com" inputMode="email" />
        <ClientField label="Telefone" name="telefone" value={form.telefone} onChange={onChange} error={errors.telefone} onBlur={onBlur} placeholder="(11) 99999-9999" inputMode="tel" />
      </div>
    </section>

    {form.tipo === 'pf' ? <section className={`${styles.section} ${styles.detailSection}`} aria-labelledby="client-person-title">
      <header className={styles.sectionHeading}><span>02</span><div><h3 id="client-person-title">Dados da pessoa física</h3><p>Preencha os documentos e a data de nascimento.</p></div></header>
      <div className={styles.fieldGrid}>
        <ClientField label="CPF" name="pf.cpf" value={form.pf?.cpf} onChange={onChange} required error={errors['pf.cpf']} onBlur={onBlur} placeholder="000.000.000-00" inputMode="numeric" />
        <ClientField label="RG" name="pf.rg" value={form.pf?.rg} onChange={onChange} required error={errors['pf.rg']} onBlur={onBlur} placeholder="00.000.000-0" />
        <ClientField label="Data de nascimento" name="pf.data_nascimento" value={form.pf?.data_nascimento} onChange={onChange} type="date" required error={errors['pf.data_nascimento']} onBlur={onBlur} />
      </div>
    </section> : <section className={`${styles.section} ${styles.detailSection}`} aria-labelledby="client-business-title">
      <header className={styles.sectionHeading}><span>02</span><div><h3 id="client-business-title">Dados da pessoa jurídica</h3><p>Informe os dados da empresa e de seu responsável.</p></div></header>
      <div className={styles.fieldGrid}>
        <ClientField label="CNPJ" name="pj.cnpj" value={form.pj?.cnpj} onChange={onChange} required error={errors['pj.cnpj']} onBlur={onBlur} placeholder="00.000.000/0000-00" inputMode="numeric" />
        <ClientField label="Razão social" name="pj.razao_social" value={form.pj?.razao_social} onChange={onChange} required error={errors['pj.razao_social']} onBlur={onBlur} placeholder="Ex.: Comércio e Serviços Ltda." />
        <ClientField label="Nome fantasia" name="pj.nome_fantasia" value={form.pj?.nome_fantasia} onChange={onChange} error={errors['pj.nome_fantasia']} onBlur={onBlur} placeholder="Ex.: Loja Central" />
        <ClientField label="Responsável" name="pj.nome_responsavel" value={form.pj?.nome_responsavel} onChange={onChange} required error={errors['pj.nome_responsavel']} onBlur={onBlur} placeholder="Nome do responsável" />
        <ClientField label="CPF do responsável" name="pj.cpf_responsavel" value={form.pj?.cpf_responsavel} onChange={onChange} required error={errors['pj.cpf_responsavel']} onBlur={onBlur} placeholder="000.000.000-00" inputMode="numeric" />
      </div>
    </section>}

    <section className={`${styles.section} ${styles.addressSection}`} aria-labelledby="client-address-title">
      <header className={styles.sectionHeading}><span>03</span><div><h3 id="client-address-title">Endereço</h3><p>Localização do cliente para consulta e documentos.</p></div></header>
      <div className={styles.fieldGrid}>
        <ClientField label="CEP" name="endereco.cep" value={form.endereco?.cep} onChange={onChange} error={errors['endereco.cep']} onBlur={onBlur} placeholder="00000-000" inputMode="numeric" hint={cepStatus === 'loading' ? 'Consultando CEP…' : cepStatus === 'found' ? 'Endereço preenchido pelo CEP.' : cepStatus === 'not-found' ? 'CEP não localizado. Confira o número.' : cepStatus === 'error' ? 'Consulta indisponível; preencha o endereço manualmente.' : undefined} hintStatus={cepStatus === 'loading' ? 'loading' : cepStatus === 'found' ? 'success' : cepStatus === 'error' || cepStatus === 'not-found' ? 'error' : undefined} />
        <ClientField label="Logradouro" name="endereco.logradouro" value={form.endereco?.logradouro} onChange={onChange} error={errors['endereco.logradouro']} onBlur={onBlur} placeholder="Rua, avenida ou estrada" />
        <ClientField label="Número" name="endereco.numero" value={form.endereco?.numero} onChange={onChange} error={errors['endereco.numero']} onBlur={onBlur} placeholder="Nº" />
        <ClientField label="Complemento" name="endereco.complemento" value={form.endereco?.complemento} onChange={onChange} error={errors['endereco.complemento']} onBlur={onBlur} placeholder="Apto., sala, bloco..." />
        <ClientField label="Bairro" name="endereco.bairro" value={form.endereco?.bairro} onChange={onChange} error={errors['endereco.bairro']} onBlur={onBlur} placeholder="Nome do bairro" />
        <ClientField label="Cidade" name="endereco.cidade" value={form.endereco?.cidade} onChange={onChange} error={errors['endereco.cidade']} onBlur={onBlur} placeholder="Nome da cidade" />
        <ClientField label="UF" name="endereco.estado" value={form.endereco?.estado} onChange={onChange} error={errors['endereco.estado']} onBlur={onBlur} placeholder="SP" />
      </div>
    </section>
  </div>;
}
