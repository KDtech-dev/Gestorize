'use client';

import { Icon } from '@iconify/react';
import { UserAvatar } from '@/components/UserAvatar';
import styles from './ProductGallery.module.css';

export type ProductImage = { id: string; url: string; principal: boolean; file?: File };

type Props = {
  name: string;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  onError: (message: string) => void;
};

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

export function ProductGallery({ name, images, onChange, onError }: Props) {
  function chooseFiles(files: FileList | null) {
    if (!files?.length) return;
    onError('');
    const room = MAX_IMAGES - images.length;
    const selected = Array.from(files).slice(0, room);
    const invalid = selected.find((file) => !acceptedTypes.includes(file.type) || file.size > MAX_FILE_SIZE);
    if (invalid) {
      onError(!acceptedTypes.includes(invalid.type) ? 'Use imagens JPG, PNG ou WEBP.' : 'Cada imagem pode ter até 10 MB.');
      return;
    }
    const added = selected.map((file) => ({
      id: `new-${crypto.randomUUID()}`,
      url: URL.createObjectURL(file),
      principal: false,
      file,
    }));
    const next = [...images, ...added];
    if (next.length && !next.some((image) => image.principal)) next[0].principal = true;
    onChange(next);
  }

  function setPrincipal(id: string) {
    onChange(images.map((image) => ({ ...image, principal: image.id === id })));
  }

  function remove(id: string) {
    const removed = images.find((image) => image.id === id);
    if (removed?.file) URL.revokeObjectURL(removed.url);
    const next = images.filter((image) => image.id !== id);
    if (removed?.principal && next.length) next[0].principal = true;
    onChange(next);
  }

  const principalImage = images.find((image) => image.principal);

  return <section className={styles.gallery} aria-labelledby="product-gallery-title">
    <header className={styles.heading}>
      <div><span className={styles.number}>01</span><div><h3 id="product-gallery-title">Fotos do produto</h3><p>Adicione até 10 imagens e escolha qual será exibida como avatar.</p></div></div>
      <label className={styles.addButton}>
        <Icon icon="mdi:image-plus-outline" width={20} height={20} />Adicionar fotos
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={images.length >= MAX_IMAGES} onChange={(event) => { chooseFiles(event.target.files); event.currentTarget.value = ''; }} />
      </label>
    </header>

    <div className={styles.mainPreview}>
      <UserAvatar name={name || 'Produto'} imageUrl={principalImage?.url} fallbackIcon="mdi:package-variant-closed" size={88} className={styles.avatar} />
      <div><strong>{principalImage ? 'Imagem principal' : 'Sem imagem principal'}</strong><span>{principalImage ? 'Esta foto será usada como avatar nas listagens.' : 'A primeira foto adicionada será definida como principal.'}</span></div>
    </div>

    {images.length ? <div className={styles.imageGrid}>
      {images.map((image, index) => <article key={image.id} className={`${styles.imageCard} ${image.principal ? styles.selected : ''}`}>
        <button type="button" className={styles.imageButton} onClick={() => setPrincipal(image.id)} aria-pressed={image.principal} aria-label={image.principal ? `Imagem ${index + 1}, principal` : `Definir imagem ${index + 1} como principal`}>
          <img src={image.url} alt={`Foto ${index + 1} de ${name || 'produto'}`} />
          {image.principal && <span className={styles.primaryBadge}><Icon icon="mdi:star" width={15} height={15} />Principal</span>}
        </button>
        <div className={styles.imageActions}>
          <span>Foto {index + 1}</span>
          <button type="button" onClick={() => remove(image.id)} aria-label={`Remover imagem ${index + 1}`} title="Remover imagem"><Icon icon="mdi:trash-can-outline" width={18} height={18} /></button>
        </div>
      </article>)}
    </div> : <div className={styles.empty}><Icon icon="mdi:image-multiple-outline" width={30} height={30} /><span>Nenhuma foto adicionada</span></div>}
    <p className={styles.hint}>{images.length}/{MAX_IMAGES} imagens · JPG, PNG ou WEBP · até 10 MB cada · clique em uma foto para defini-la como principal</p>
  </section>;
}
