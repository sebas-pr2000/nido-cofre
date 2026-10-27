import { Navigate, NavLink, Outlet } from 'react-router';
import { useSession } from '../context/SessionContext';
import { RealtimeProvider, useRealtime } from '../realtime/RealtimeProvider';
import { formatCOP } from '../lib/format';

const tabs = [
  { to: '/new', label: 'Regalar' },
  { to: '/sent', label: 'Enviados' },
  { to: '/inbox', label: 'Recibidos' },
];

function LiveIndicator() {
  const { connected } = useRealtime();
  return (
    <span className="flex items-center gap-1 text-xs text-stone-500">
      <span
        className={`size-2 rounded-full ${connected ? 'animate-pulse bg-emerald-500' : 'bg-stone-300'}`}
      />
      {connected ? 'En vivo' : 'Conectando…'}
    </span>
  );
}

export function AppLayout() {
  const { currentUser, loading, logout } = useSession();

  if (loading) {
    return <p className="p-8 text-center text-stone-500">Cargando…</p>;
  }
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
<RealtimeProvider userId={currentUser.id}>
    <div className="min-h-dvh bg-rose-50/40">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-rose-600">Nido · Cofre</span>
            <LiveIndicator />
          </div>

          <div className="flex items-center gap-2">
            {currentUser.creditBalance > 0 && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {formatCOP(currentUser.creditBalance)}
                </span>
            )}
            <img
                src={currentUser.avatarUrl}
                alt=""
                className="size-8 rounded-full bg-rose-100"
            />
            <span className="hidden text-sm font-medium text-stone-700 sm:inline">
                {currentUser.name}
            </span>
            <button
                onClick={logout}
                className="text-xs text-stone-500 underline underline-offset-2"
            >
                Cambiar
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-2xl gap-1 px-4 pb-2">
          {tabs.map((tab) => (
              <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    isActive ? 'bg-rose-600 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`
            }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <Outlet />
      </main>
    </div>
</RealtimeProvider>
  );
}