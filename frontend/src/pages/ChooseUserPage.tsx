import { useNavigate } from 'react-router';
import { useSession } from '../context/SessionContext';

export function ChooseUserPage() {
  const { users, loading, login } = useSession();
  const navigate = useNavigate();

  function choose(userId: string) {
    login(userId);
    navigate('/new');
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-rose-50/40 px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-rose-600">Nido · Cofre</h1>
        <p className="mt-2 text-stone-600">
          Regala la emoción de abrir un cofre y la tranquilidad de acertar.
        </p>
        <p className="mt-8 text-sm font-medium text-stone-500">¿Quién eres?</p>

        {loading && <p className="mt-4 text-stone-500">Cargando…</p>}
        {!loading && users.length === 0 && (
          <p className="mt-4 text-sm text-red-600">
            No pudimos conectar con el servidor. Intenta de nuevo en un momento.
          </p>
        )}

        <div className="mt-4 grid gap-3">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => choose(user.id)}
              className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-rose-300 hover:shadow"
            >
              <img src={user.avatarUrl} alt="" className="size-12 rounded-full bg-rose-100" />
              <span className="text-lg font-semibold text-stone-800">{user.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}