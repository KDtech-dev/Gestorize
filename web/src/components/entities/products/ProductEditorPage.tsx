'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { cancelLabelOperation, createLabelOperation, labelsPrintHtml, type LabelOperation } from '@/lib/labels';
import { ProductEditorFields, type ProductForm, type ProductOption } from './ProductEditorFields';
import { type ProductImage } from './ProductGallery';
import styles from '../clients/ClientEditorPage.module.css';
import pageStyles from './ProductEditorPage.module.css';

type ProductData = Record<string, any>;
const emptyProduct = (): ProductForm => ({ nome: '', descricao: '', preco_custo: '', porcentagem_lucro: '', preco_venda: '', estoque: '', data_entrada: '', validade: '', categoria_id: '', fornecedor_id: '', unidade_medida_id: '' });
const todayLocal = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };

function unwrapData(payload: unknown): any {
  let current = payload as any;
  for (let index = 0; index < 5 && current?.data !== undefined; index++) current = current.data;
  return current;
}

function inputNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : '';
}

function normalizeProduct(product: ProductData): ProductForm {
  return {
    nome: String(product.nome ?? ''),
    descricao: String(product.descricao ?? ''),
    preco_custo: inputNumber(product.preco_custo),
    porcentagem_lucro: inputNumber(product.porcentagem_lucro),
    preco_venda: inputNumber(product.preco_venda),
    estoque: inputNumber(product.estoque),
    data_entrada: String(product.data_entrada ?? '').slice(0, 10),
    validade: String(product.validade ?? '').slice(0, 10),
    categoria_id: product.categoria_id ? String(product.categoria_id) : '',
    fornecedor_id: product.fornecedor_id ? String(product.fornecedor_id) : '',
    unidade_medida_id: product.unidade_medida_id ? String(product.unidade_medida_id) : '',
  };
}

function normalizeImages(product: ProductData): ProductImage[] {
  const images = Array.isArray(product.imagens) ? product.imagens : [];
  return images.map((image: ProductData) => ({ id: String(image.id), url: String(image.url), principal: Boolean(image.principal) }));
}

function unwrapOptions(payload: unknown): ProductOption[] {
  const data = unwrapData(payload);
  return Array.isArray(data) ? data.map((item) => ({ id: String(item.id), nome: item.nome ?? item.titulo, sigla: item.sigla })) : [];
}

function parseNumber(value: string) {
  if (!value.trim()) return Number.NaN;
  return Number(value.replace(',', '.'));
}

function productMultipart(payload: ProductData, images: ProductImage[]) {
  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) data.append(key, String(value));
  });
  images.forEach((image) => { if (image.file) data.append('imagens[]', image.file); });
  const principalIndex = images.findIndex((image) => image.principal);
  if (principalIndex >= 0) data.append('imagem_principal', String(principalIndex));
  return data;
}

export function ProductEditorPage({ productId }: { productId?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { can } = useAuth();
  const isEdit = !!productId;
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [originalForm, setOriginalForm] = useState<ProductForm>(emptyProduct);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [originalImages, setOriginalImages] = useState<ProductImage[]>([]);
  const [categories, setCategories] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<ProductOption[]>([]);
  const [units, setUnits] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [categoryName, setCategoryName] = useState('');
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [loadedProduct, setLoadedProduct] = useState<ProductData | null>(null);
  const [printingLabel, setPrintingLabel] = useState(false);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => () => {
    imagesRef.current.forEach((image) => { if (image.file) URL.revokeObjectURL(image.url); });
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [categoryPayload, supplierPayload, unitPayload, productPayload] = await Promise.all([
          apiFetch<unknown>('/categorias'),
          apiFetch<unknown>('/fornecedores').catch(() => []),
          apiFetch<unknown>('/unidades-medida'),
          productId ? apiFetch<unknown>(`/produtos/${productId}`) : Promise.resolve(null),
        ]);
        if (!active) return;
        setCategories(unwrapOptions(categoryPayload));
        setSuppliers(unwrapOptions(supplierPayload));
        setUnits(unwrapOptions(unitPayload));
        if (productPayload) {
          const product = unwrapData(productPayload) as ProductData;
          setLoadedProduct(product);
          const normalizedForm = normalizeProduct(product);
          const normalizedImages = normalizeImages(product);
          setForm(normalizedForm);
          setOriginalForm(normalizedForm);
          setImages(normalizedImages);
          setOriginalImages(normalizedImages);
        }
      } catch (reason) {
        if (active) showToast(reason instanceof Error ? reason.message : 'Não foi possível carregar os dados do produto.', 'error');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [productId, showToast]);

  const selectedCategory = categories.find((category) => category.id === form.categoria_id)?.nome?.normalize('NFC').toLocaleLowerCase('pt-BR') ?? '';
  const requiresExpiry = ['insumos', 'produtos médicos/hospitalares'].includes(selectedCategory);
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!form.nome.trim()) errors.nome = 'Informe o nome do produto.';
    else if (form.nome.trim().length > 255) errors.nome = 'Use até 255 caracteres.';
    if (form.descricao.length > 1000) errors.descricao = 'Use até 1.000 caracteres.';
    for (const [key, label] of [['preco_custo', 'Preço de custo'], ['porcentagem_lucro', 'Margem de lucro'], ['preco_venda', 'Preço de venda'], ['estoque', 'Estoque']]) {
      const value = parseNumber(form[key as keyof ProductForm]);
      if (!Number.isFinite(value)) errors[key] = `Informe ${label.toLocaleLowerCase('pt-BR')}.`;
      else if (value < 0) errors[key] = `${label} não pode ser negativo.`;
    }
    if (!form.data_entrada) errors.data_entrada = 'Informe a data de entrada.';
    if (!form.unidade_medida_id) errors.unidade_medida_id = 'Selecione a unidade de medida.';
    if (requiresExpiry && !form.validade) errors.validade = 'A validade é obrigatória para esta categoria.';
    if (form.validade && form.data_entrada && form.validade < form.data_entrada) errors.validade = 'A validade não pode ser anterior à data de entrada.';
    if (form.validade && form.validade < todayLocal()) errors.validade = 'Não é possível cadastrar um produto vencido.';
    return errors;
  }, [form, requiresExpiry]);

  const imagesChanged = JSON.stringify(images.map(({ id, principal }) => ({ id, principal }))) !== JSON.stringify(originalImages.map(({ id, principal }) => ({ id, principal })));
  const formChanged = JSON.stringify(form) !== JSON.stringify(originalForm);
  const isDirty = formChanged || imagesChanged || images.some((image) => !!image.file) || !!categoryName.trim();
  const canSave = !loading && !saving && !galleryError && Object.keys(validationErrors).length === 0 && (!isEdit || isDirty);
  const { requestNavigation, navigateWithoutConfirmation, dialog } = useUnsavedChangesGuard(isDirty);

  async function printProductLabel() {
    if (!productId || !loadedProduct?.codigo_barras || isDirty || printingLabel) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.', 'error');
      return;
    }
    printWindow.document.title = 'Preparando etiqueta…';
    printWindow.document.body.textContent = 'Preparando a impressão da etiqueta…';
    setPrintingLabel(true);
    let operation: LabelOperation | null = null;
    try {
      operation = await createLabelOperation('reimpressao', [{ produto_id: productId, quantidade: 1 }]);
      printWindow.document.open();
      printWindow.document.write(labelsPrintHtml(operation.itens));
      printWindow.document.close();
      showToast('A janela de impressão foi aberta. Confirme o resultado na Central de etiquetas.', 'info');
    } catch (reason) {
      printWindow.close();
      if (operation) {
        try { await cancelLabelOperation(operation.id); } catch { /* a operação poderá ser resolvida na central */ }
      }
      showToast(reason instanceof Error ? reason.message : 'Não foi possível imprimir a etiqueta.', 'error');
    } finally {
      setPrintingLabel(false);
    }
  }

  function change(name: keyof ProductForm, value: string) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'preco_custo' || name === 'porcentagem_lucro') {
        const cost = parseNumber(name === 'preco_custo' ? value : current.preco_custo);
        const margin = parseNumber(name === 'porcentagem_lucro' ? value : current.porcentagem_lucro);
        next.preco_venda = Number.isFinite(cost) && Number.isFinite(margin) ? (cost * (1 + margin / 100)).toFixed(2) : '';
      }
      return next;
    });
  }

  function changeImages(nextImages: ProductImage[]) {
    setGalleryError('');
    setImages(nextImages);
  }

  function blur(name: string) { setTouched((current) => ({ ...current, [name]: true })); }

  async function createCategory() {
    const name = categoryName.trim();
    if (!name || creatingCategory) return;
    setCreatingCategory(true);
    try {
      const result = unwrapData(await apiFetch<unknown>('/categorias', { method: 'POST', body: JSON.stringify({ nome: name }) })) as ProductOption;
      const option = { id: String(result.id), nome: String(result.nome ?? name) };
      setCategories((current) => current.some((item) => item.id === option.id) ? current : [...current, option]);
      change('categoria_id', option.id);
      setCategoryName('');
      setCategoryEditorOpen(false);
      showToast('Categoria cadastrada e selecionada.', 'success');
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'Não foi possível cadastrar a categoria.', 'error');
    } finally {
      setCreatingCategory(false);
    }
  }

  async function uploadImage(id: string, image: ProductImage, principal: boolean) {
    if (!image.file) return;
    const data = new FormData();
    data.append('imagem', image.file);
    data.append('principal', principal ? '1' : '0');
    await apiFetch(`/produtos/${id}/imagem`, { method: 'POST', body: data });
  }

  async function syncImages(id: string) {
    const currentIds = new Set(images.filter((image) => !image.file).map((image) => image.id));
    const removed = originalImages.filter((image) => !currentIds.has(image.id));
    for (const image of removed) {
      await apiFetch(`/produtos/${id}/imagem`, { method: 'DELETE', body: JSON.stringify({ imagem_id: image.id }) });
    }
    const newImages = images.filter((image) => !!image.file);
    for (const image of newImages.filter((item) => !item.principal)) await uploadImage(id, image, false);
    const principal = images.find((image) => image.principal);
    if (!principal) return;
    if (principal.file) await uploadImage(id, principal, true);
    else {
      const oldPrincipal = originalImages.find((image) => image.id === principal.id && image.principal);
      if (!oldPrincipal) await apiFetch(`/produtos/${id}/imagem/principal`, { method: 'PUT', body: JSON.stringify({ imagem_id: principal.id }) });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: ProductData = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        preco_custo: parseNumber(form.preco_custo),
        porcentagem_lucro: parseNumber(form.porcentagem_lucro),
        preco_venda: parseNumber(form.preco_venda),
        estoque: parseNumber(form.estoque),
        data_entrada: form.data_entrada,
        validade: form.validade || null,
        categoria_id: form.categoria_id || null,
        fornecedor_id: form.fornecedor_id || null,
        unidade_medida_id: form.unidade_medida_id,
      };
      if (isEdit) {
        await apiFetch(`/produtos/${productId}`, { method: 'PUT', body: JSON.stringify(payload) });
        await syncImages(productId!);
      } else {
        const body = images.length ? productMultipart(payload, images) : JSON.stringify(payload);
        await apiFetch('/produtos', { method: 'POST', body });
      }
      showToast(isEdit ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.', 'success');
      navigateWithoutConfirmation(() => router.push('/produtos'));
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'Não foi possível salvar o produto.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const visibleErrors = submitted ? validationErrors : Object.fromEntries(Object.entries(validationErrors).filter(([field]) => touched[field]));
  return <main className={`${styles.page} ${pageStyles.page}`}>
    <header className={styles.pageHeader}>
      <button type="button" className={styles.backButton} onClick={() => requestNavigation(() => router.push('/produtos'))}><Icon icon="mdi:arrow-left" width={23} height={23} />Voltar para produtos</button>
      <div className={styles.titleActions}>
        <div className={styles.titleCopy}>
          <span className={styles.eyebrow}><Icon icon="mdi:package-variant-closed" width={18} height={18} />CATÁLOGO · INVENTÁRIO</span>
          <h1>{isEdit ? 'Editar produto' : 'Novo produto'}</h1>
          <p>{isEdit ? 'Atualize os dados, estoque e fotos deste produto.' : 'Cadastre um produto, organize seus dados e adicione fotos ao catálogo.'}</p>
        </div>
        <div className={pageStyles.titleButtons}>
          {isEdit && loadedProduct?.codigo_barras && <button type="button" className={pageStyles.printButton} onClick={() => void printProductLabel()} disabled={loading || saving || printingLabel || isDirty}><Icon icon={printingLabel ? 'mdi:loading' : 'mdi:printer-outline'} width={20} height={20} />{printingLabel ? 'Preparando…' : 'Imprimir etiqueta'}</button>}
          <button type="submit" form="product-editor-form" className={styles.saveButton} disabled={!canSave}>{saving ? <><span className={styles.buttonSpinner} />Salvando…</> : <><Icon icon="mdi:content-save-outline" width={21} height={21} />Salvar produto</>}</button>
        </div>
      </div>
    </header>

    {loading ? <div className={styles.loading}><span className="spinner" />Carregando dados do produto…</div> : <form id="product-editor-form" className={`${styles.form} ${pageStyles.form}`} onSubmit={submit}>
      <ProductEditorFields form={form} images={images} categories={categories} suppliers={suppliers} units={units} errors={visibleErrors} validadeObrigatoria={requiresExpiry} canCreateCategory={can('produtos.criar')} categoryName={categoryName} categoryEditorOpen={categoryEditorOpen} creatingCategory={creatingCategory} onChange={change} onBlur={blur} onImagesChange={changeImages} onGalleryError={setGalleryError} onCategoryNameChange={setCategoryName} onToggleCategoryEditor={() => setCategoryEditorOpen((open) => !open)} onCreateCategory={() => void createCategory()} />
      {(galleryError || (submitted && Object.keys(validationErrors).length > 0)) && <div className={styles.error} role="alert"><Icon icon="mdi:alert-circle-outline" width={20} height={20} />{galleryError || 'Revise os campos destacados antes de salvar.'}</div>}
      <footer className={styles.actions}><span>{isEdit ? (isDirty ? 'Há alterações prontas para salvar.' : 'Altere um dado ou uma foto para habilitar o salvamento.') : 'Preencha os campos obrigatórios e válidos para salvar.'}</span></footer>
    </form>}
    {dialog}
  </main>;
}
