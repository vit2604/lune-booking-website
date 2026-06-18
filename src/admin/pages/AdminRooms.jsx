import { Edit, Eye, EyeOff, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminTable from '../components/AdminTable.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { deleteRoom, getRooms, toggleRoomStatus } from '../services/adminRoomService.js';
import { canUseMockFallback } from '../../config/apiConfig.js';
import { adminDeleteRoom, adminListRooms, adminUpdateRoomStatus } from '../../services/adminApiService.js';
import { formatCurrency } from '../../utils/booking.js';

function normalizeRoom(room) {
  return {
    ...room,
    type: room.type || 'Apartment',
    price: Number(room.price || room.basePrice || 0),
    image: room.image || room.mainImage || room.images?.find((image) => image.isMain)?.url || room.images?.[0]?.url || '',
    gallery: room.gallery || room.images?.map((image) => image.url) || [],
    status: room.status === 'ACTIVE' ? 'active' : String(room.status || 'active').toLowerCase(),
  };
}

const toApiRoomStatus = (status) => (status === 'hidden' ? 'HIDDEN' : 'ACTIVE');

export default function AdminRooms() {
  const [rooms, setRooms] = useState(getRooms());
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [toast, setToast] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [source, setSource] = useState(canUseMockFallback() ? 'local' : 'api');
  const [loading, setLoading] = useState(false);

  const loadRooms = async (message = '') => {
    setLoading(true);
    try {
      const data = await adminListRooms();
      setRooms((Array.isArray(data) ? data : []).map(normalizeRoom));
      setSource('api');
      if (message) setToast(message);
    } catch (error) {
      if (!canUseMockFallback()) {
        setToast(error.message || 'Could not load rooms from backend.');
      } else {
        setRooms(getRooms());
        setSource('local');
        if (message) setToast(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const roomTypes = [...new Set(rooms.map((room) => room.type).filter(Boolean))];
  const filteredRooms = useMemo(
    () =>
      rooms
        .filter((room) => room.name.toLowerCase().includes(query.toLowerCase()))
        .filter((room) => type === 'all' || room.type === type)
        .filter((room) => status === 'all' || room.status === status),
    [rooms, query, type, status],
  );

  const refresh = (message) => {
    setRooms(getRooms());
    setToast(message);
  };

  const handleToggle = async (id) => {
    if (source === 'api') {
      const room = rooms.find((item) => item.id === id);
      await adminUpdateRoomStatus(id, toApiRoomStatus(room?.status === 'hidden' ? 'active' : 'hidden'));
      await loadRooms('Room visibility updated.');
    } else {
      toggleRoomStatus(id);
      refresh('Room visibility updated.');
    }
  };

  const handleDelete = async () => {
    if (source === 'api') await adminDeleteRoom(deleteTarget.id);
    else deleteRoom(deleteTarget.id);
    setDeleteTarget(null);
    if (source === 'api') await loadRooms('Room hidden or deleted.');
    else refresh('Room deleted.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Room inventory</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Manage rooms</h2>
          <p className="mt-2 text-sm text-stone-600">Edit prices, photos, amenities, and visibility.</p>
        </div>
        <Link to="/admin/rooms/new" className="btn-gold">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add room
        </Link>
      </div>

      {toast ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{toast}</div> : null}
      {loading ? <div className="rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-600">Loading rooms...</div> : null}

      <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_180px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" aria-hidden="true" />
          <input
            className="input-field pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search room name"
          />
        </label>
        <select className="input-field" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">All types</option>
          {roomTypes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select className="input-field" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <AdminTable empty="No rooms found. Please adjust your search.">
        {filteredRooms.length ? (
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-lune-cream text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Room name</th>
                <th className="px-4 py-3">Price/night</th>
                <th className="px-4 py-3">Guests</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-4 py-4">
                    <img src={room.image || room.gallery?.[0]} alt={room.name} className="h-14 w-20 rounded-md object-cover" />
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-lune-ink">{room.name}</p>
                    <p className="text-xs text-stone-500">{room.type}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold">{formatCurrency(room.price)}</td>
                  <td className="px-4 py-4">{room.maxGuests}</td>
                  <td className="px-4 py-4">{room.size}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold uppercase ${room.status === 'hidden' ? 'bg-stone-100 text-stone-500' : 'bg-green-50 text-green-700'}`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Link className="btn-secondary min-h-10 px-3 py-2" to={`/admin/rooms/edit/${room.id}`}>
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Link>
                      <button className="btn-secondary min-h-10 px-3 py-2" type="button" onClick={() => handleToggle(room.id)}>
                        {room.status === 'hidden' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {room.status === 'hidden' ? 'Show' : 'Hide'}
                      </button>
                      <button className="btn-secondary min-h-10 px-3 py-2 text-red-700" type="button" onClick={() => setDeleteTarget(room)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </AdminTable>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete room?"
        message={`This will remove ${deleteTarget?.name || 'this room'} from the mock inventory.`}
        confirmText="Delete room"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
