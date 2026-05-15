import { Copy, ImagePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import { addMedia, deleteMedia, getMedia } from '../services/adminMediaService.js';

export default function AdminMedia() {
  const [media, setMedia] = useState(getMedia());
  const [images, setImages] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState('');

  const refresh = (message) => {
    setMedia(getMedia());
    setToast(message);
  };

  const handleAdd = () => {
    images.forEach((url) => addMedia({ url }));
    setImages([]);
    refresh('Media added.');
  };

  const handleCopy = async (url) => {
    await navigator.clipboard?.writeText(url);
    setToast('Image URL copied.');
  };

  const handleDelete = () => {
    deleteMedia(deleteTarget.id);
    setDeleteTarget(null);
    refresh('Media removed.');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Media library</p>
        <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Manage images</h2>
        <p className="mt-2 text-sm text-stone-600">Add image URLs, mock upload previews, copy URLs, and reuse them in room forms.</p>
      </div>

      {toast ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{toast}</div> : null}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <ImageUploader images={images} onChange={setImages} />
        <button className="btn-gold mt-4" type="button" disabled={!images.length} onClick={handleAdd}>
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          Save to media
        </button>
      </section>

      {media.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {media.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
              <img src={item.url} alt={item.title} className="h-44 w-full object-cover" />
              <div className="space-y-3 p-4">
                <p className="truncate text-sm font-semibold text-lune-ink">{item.title || 'Lune image'}</p>
                <p className="truncate text-xs text-stone-500">{item.url}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button className="btn-secondary min-h-10 px-3 py-2" type="button" onClick={() => handleCopy(item.url)}>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copy URL
                  </button>
                  {item.source === 'custom' ? (
                    <button className="btn-secondary min-h-10 px-3 py-2 text-red-700" type="button" onClick={() => setDeleteTarget(item)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">No media yet.</div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete media?"
        message="This removes the custom media item from localStorage."
        confirmText="Delete media"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
