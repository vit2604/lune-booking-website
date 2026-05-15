import { ImagePlus, X } from 'lucide-react';
import { useState } from 'react';

export default function ImageUploader({ label = 'Images', images = [], onChange, multiple = true }) {
  const [url, setUrl] = useState('');

  const addUrl = () => {
    if (!url.trim()) return;
    onChange(multiple ? [...images, url.trim()] : [url.trim()]);
    setUrl('');
  };

  const handleFile = (event) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const next = multiple ? [...images, reader.result] : [reader.result];
        onChange(next);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (image) => {
    onChange(images.filter((item) => item !== image));
  };

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-lune-ink">{label}</span>
      <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            className="input-field"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Paste image URL"
          />
          <button className="btn-secondary" type="button" onClick={addUrl}>
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Add image
          </button>
        </div>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-stone-300 bg-lune-cream px-4 py-4 text-sm font-semibold text-lune-charcoal">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          Upload mock image preview
          <input className="sr-only" type="file" accept="image/*" multiple={multiple} onChange={handleFile} />
        </label>

        <p className="text-xs leading-5 text-stone-500">
          Mock upload stores preview data in localStorage. Production should use Cloudinary,
          Firebase Storage, S3, or a private server upload.
        </p>

        {images.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div key={image} className="relative overflow-hidden rounded-lg border border-stone-200">
                <img src={image} alt="Preview" className="h-32 w-full object-cover" />
                <button
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-white/90 text-lune-ink shadow"
                  type="button"
                  onClick={() => removeImage(image)}
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
