import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminFormInput from '../components/AdminFormInput.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import {
  createRoom,
  deleteRoom,
  generateRoomSlug,
  getRoomById,
  updateRoom,
} from '../services/adminRoomService.js';
import { canUseMockFallback } from '../../config/apiConfig.js';
import {
  adminCreateRoom,
  adminDeleteRoom,
  adminGetRoom,
  adminUpdateRoom,
} from '../../services/adminApiService.js';

const amenities = [
  'Free Wi-Fi',
  'Air conditioning',
  'Private bathroom',
  'Balcony',
  'Kitchen',
  'Washing machine',
  'Work desk',
  'Elevator',
  'Sofa',
  'Near beach',
  'Long stay friendly',
];

const placeholderImage =
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=85';

const emptyRoom = {
  name: '',
  slug: '',
  type: 'Apartment',
  shortDescription: '',
  description: '',
  size: '',
  maxGuests: 2,
  bed: '',
  numberOfBeds: 1,
  price: '',
  discountPrice: '',
  longStayPrice: '',
  status: 'active',
  priceVisible: true,
  priceNote: '',
  amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
  image: '',
  gallery: [],
  roomPolicies: {
    checkInTime: '14:00',
    checkOutTime: '12:00',
    smokingPolicy: 'No smoking inside the room',
    petPolicy: 'Pets are not allowed',
    cancellationNote: '',
    extraNote: '',
  },
};

function normalizeAdminRoom(room) {
  if (!room) return null;
  const mainImage = room.image || room.mainImage || room.images?.find((image) => image.isMain)?.url || room.images?.[0]?.url || '';
  const gallery = room.gallery?.length ? room.gallery : room.images?.map((image) => image.url) || (mainImage ? [mainImage] : []);
  return {
    ...emptyRoom,
    ...room,
    name: room.name || room.translations?.find?.((item) => item.languageCode === 'en')?.name || '',
    shortDescription: room.shortDescription || '',
    description: room.description || room.fullDescription || '',
    price: Number(room.price || room.basePrice || 0),
    bed: room.bed || room.bedType || '',
    status: room.status === 'ACTIVE' ? 'active' : String(room.status || 'active').toLowerCase(),
    image: mainImage,
    gallery,
    amenities: room.amenities?.map?.((item) => item.amenity?.key || item).filter(Boolean) || emptyRoom.amenities,
    priceNote: room.priceNote || room.translations?.find?.((item) => item.languageCode === 'en')?.priceNote || '',
  };
}

function toApiStatus(status) {
  if (status === 'hidden') return 'HIDDEN';
  if (status === 'unavailable') return 'UNAVAILABLE';
  return 'ACTIVE';
}

function toRoomApiPayload(room) {
  const gallery = room.gallery?.length ? room.gallery : [room.image || placeholderImage];
  return {
    slug: room.slug || generateRoomSlug(room.name),
    name: room.name.trim(),
    shortDescription: room.shortDescription || '',
    fullDescription: room.description || room.fullDescription || room.shortDescription || '',
    priceNote: room.priceNote || '',
    basePrice: Number(room.price),
    weekendPrice: null,
    holidayPrice: null,
    size: room.size || '32m2',
    maxGuests: Number(room.maxGuests),
    bedType: room.bed || room.bedType || 'Queen bed',
    numberOfBeds: Number(room.numberOfBeds || 1),
    status: toApiStatus(room.status),
    isFeatured: Boolean(room.isFeatured),
    sortOrder: Number(room.sortOrder || 0),
    image: room.image || gallery[0] || placeholderImage,
    gallery,
    amenities: room.amenities || [],
  };
}

export default function AdminRoomForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [room, setRoom] = useState(emptyRoom);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [source, setSource] = useState('api');
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadRoom() {
      if (!isEdit) return;
      setLoading(true);
      try {
        const data = await adminGetRoom(id);
        if (!ignore) {
          setRoom(normalizeAdminRoom(data));
          setSource('api');
        }
      } catch (error) {
        if (!canUseMockFallback()) {
          if (!ignore) setErrors((current) => ({ ...current, load: error.message || 'Could not load room from backend.' }));
          return;
        }
        const localRoom = getRoomById(id);
        if (!ignore) {
          setRoom(localRoom ? normalizeAdminRoom(localRoom) : emptyRoom);
          setSource('local');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadRoom();
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  const updateField = (field, value) => {
    setRoom((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updatePolicy = (field, value) => {
    setRoom((current) => ({
      ...current,
      roomPolicies: { ...current.roomPolicies, [field]: value },
    }));
  };

  const toggleAmenity = (amenity) => {
    setRoom((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!room.name.trim()) nextErrors.name = 'Room name is required.';
    if (Number(room.price) <= 0 || Number.isNaN(Number(room.price))) {
      nextErrors.price = 'Price must be a number greater than 0.';
    }
    if (Number(room.maxGuests) <= 0 || Number.isNaN(Number(room.maxGuests))) {
      nextErrors.maxGuests = 'Max guests must be greater than 0.';
    }
    if (Number(room.discountPrice) < 0 || Number(room.longStayPrice) < 0) {
      nextErrors.price = 'Prices cannot be negative.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const gallery = room.gallery?.length ? room.gallery : [room.image || placeholderImage];
    const payload = {
      ...room,
      slug: room.slug || generateRoomSlug(room.name),
      price: Number(room.price),
      discountPrice: Number(room.discountPrice || 0),
      longStayPrice: Number(room.longStayPrice || 0),
      maxGuests: Number(room.maxGuests),
      numberOfBeds: Number(room.numberOfBeds || 1),
      image: room.image || gallery[0] || placeholderImage,
      gallery,
    };

    try {
      if (source === 'api') {
        const apiPayload = toRoomApiPayload(payload);
        if (isEdit) await adminUpdateRoom(id, apiPayload);
        else await adminCreateRoom(apiPayload);
      } else if (isEdit) updateRoom(id, payload);
      else createRoom(payload);

      window.dispatchEvent(new Event('lune:rooms-updated'));
      setToast(source === 'api'
        ? 'Room saved to database. Guest website will use the updated room data.'
        : 'Room saved to local demo data.');
      setTimeout(() => navigate('/admin/rooms'), 450);
    } catch (error) {
      if (canUseMockFallback()) {
        if (isEdit) updateRoom(id, payload);
        else createRoom(payload);
        setSource('local');
        setToast('Backend unavailable. Room saved to local demo data only.');
        setTimeout(() => navigate('/admin/rooms'), 450);
        return;
      }
      setErrors((current) => ({ ...current, submit: error.message || 'Could not save room.' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (source === 'api') await adminDeleteRoom(id);
    else deleteRoom(id);
    navigate('/admin/rooms');
  };

  if (loading) {
    return <div className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-600">Loading room...</div>;
  }

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link to="/admin/rooms" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-lune-goldDark">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to rooms
          </Link>
          <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">
            {isEdit ? 'Edit room' : 'Add new room'}
          </h2>
          <p className="mt-2 text-sm text-stone-600">Keep prices, photos, room details, and policies clear for guests.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {isEdit ? (
            <button className="btn-secondary text-red-700" type="button" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete room
            </button>
          ) : null}
          <button className="btn-gold" type="submit" disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving room...' : 'Save room'}
          </button>
        </div>
      </div>

      {toast ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{toast}</div> : null}
      {errors.load || errors.submit ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errors.load || errors.submit}
        </div>
      ) : null}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Basic information</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <AdminFormInput label="Room name" value={room.name} onChange={(e) => updateField('name', e.target.value)} error={errors.name} />
          <AdminFormInput label="Slug" value={room.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="Auto generated if blank" />
          <AdminFormInput label="Room type" value={room.type} onChange={(e) => updateField('type', e.target.value)} />
          <AdminFormInput label="Room size" value={room.size} onChange={(e) => updateField('size', e.target.value)} placeholder="40m²" />
          <AdminFormInput label="Max guests" type="number" min="1" value={room.maxGuests} onChange={(e) => updateField('maxGuests', e.target.value)} error={errors.maxGuests} />
          <AdminFormInput label="Bed type" value={room.bed} onChange={(e) => updateField('bed', e.target.value)} placeholder="1 queen bed" />
          <AdminFormInput label="Number of beds" type="number" min="1" value={room.numberOfBeds} onChange={(e) => updateField('numberOfBeds', e.target.value)} />
          <AdminFormInput label="Status">
            <select className="input-field" value={room.status} onChange={(e) => updateField('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </AdminFormInput>
          <AdminFormInput label="Short description" className="lg:col-span-2" as="textarea" value={room.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} />
          <AdminFormInput label="Full description" className="lg:col-span-2" as="textarea" value={room.description} onChange={(e) => updateField('description', e.target.value)} />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Pricing</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <AdminFormInput label="Price per night (VND)" type="number" min="0" value={room.price} onChange={(e) => updateField('price', e.target.value)} error={errors.price} />
          <AdminFormInput label="Discount price optional" type="number" min="0" value={room.discountPrice} onChange={(e) => updateField('discountPrice', e.target.value)} />
          <AdminFormInput label="Long stay price optional" type="number" min="0" value={room.longStayPrice} onChange={(e) => updateField('longStayPrice', e.target.value)} />
          <AdminFormInput label="Price note" className="lg:col-span-2" value={room.priceNote} onChange={(e) => updateField('priceNote', e.target.value)} />
          <label className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 text-sm font-semibold text-lune-ink">
            <input type="checkbox" checked={room.priceVisible} onChange={(e) => updateField('priceVisible', e.target.checked)} />
            Show price on guest website
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Amenities</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {amenities.map((amenity) => (
            <label key={amenity} className="flex min-h-12 items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 text-sm font-semibold">
              <input type="checkbox" checked={room.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />
              {amenity}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Images</h3>
        <div className="mt-5 grid gap-5">
          <ImageUploader
            label="Gallery images"
            images={room.gallery?.length ? room.gallery : room.image ? [room.image] : []}
            onChange={(images) => setRoom((current) => ({ ...current, gallery: images, image: images[0] || '' }))}
          />
          <AdminFormInput label="Main image URL" value={room.image} onChange={(e) => updateField('image', e.target.value)} />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Room policy</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <AdminFormInput label="Check-in time" value={room.roomPolicies.checkInTime} onChange={(e) => updatePolicy('checkInTime', e.target.value)} />
          <AdminFormInput label="Check-out time" value={room.roomPolicies.checkOutTime} onChange={(e) => updatePolicy('checkOutTime', e.target.value)} />
          <AdminFormInput label="Smoking policy" value={room.roomPolicies.smokingPolicy} onChange={(e) => updatePolicy('smokingPolicy', e.target.value)} />
          <AdminFormInput label="Pet policy" value={room.roomPolicies.petPolicy} onChange={(e) => updatePolicy('petPolicy', e.target.value)} />
          <AdminFormInput label="Cancellation note" as="textarea" value={room.roomPolicies.cancellationNote} onChange={(e) => updatePolicy('cancellationNote', e.target.value)} />
          <AdminFormInput label="Extra note" as="textarea" value={room.roomPolicies.extraNote} onChange={(e) => updatePolicy('extraNote', e.target.value)} />
        </div>
      </section>

      <ConfirmModal
        open={deleteOpen}
        title="Delete room?"
        message={`This will remove ${room.name || 'this room'} from the mock inventory.`}
        confirmText="Delete room"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </form>
  );
}
