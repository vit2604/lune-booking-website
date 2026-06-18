import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAdminLoggedIn, login } from '../services/adminAuthService.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAdminLoggedIn()) return <Navigate to="/admin/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    const result = await login(form.username.trim(), form.password);
    if (!result.ok) {
      setLoading(false);
      setError(result.message);
      return;
    }
    navigate('/admin/dashboard', { replace: true });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-lune-cream px-4 py-10">
      <form className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-soft" onSubmit={handleSubmit}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-lune-ink text-white">
          <LockKeyhole className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="mt-5 text-center">
          <h1 className="font-display text-4xl font-bold text-lune-ink">Lune Admin</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">Hotel website management for rooms, bookings, payments, and content.</p>
        </div>

        <div className="mt-8 grid gap-4">
          <label>
            <span className="label">Username</span>
            <input
              className="input-field"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              placeholder="admin"
            />
          </label>
          <label>
            <span className="label">Password</span>
            <input
              className="input-field"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Enter admin password"
            />
          </label>
        </div>

        {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}

        <button className="btn-gold mt-6 w-full" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="mt-5 text-xs leading-5 text-stone-500">
          Production login uses backend JWT authentication. Mock fallback only works when explicitly enabled for demos.
        </p>
      </form>
    </main>
  );
}
