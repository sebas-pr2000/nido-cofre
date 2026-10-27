import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getUsers } from '../api/endpoints';
import type { User } from '../api/types';

const STORAGE_KEY = 'nido:userId';

interface SessionValue {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  login: (userId: string) => void;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

function readStoredUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(readStoredUserId);
  const [loading, setLoading] = useState(true);

  const refreshUsers = useCallback(async () => {
    setUsers(await getUsers());
  }, []);

  useEffect(() => {
    refreshUsers()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshUsers]);

  const login = useCallback((userId: string) => {
    setCurrentUserId(userId);
    try {
      localStorage.setItem(STORAGE_KEY, userId);
    } catch {
      // ? Sin almacenamiento disponible: la sesion dura hasta recargar
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ? Ignorar
    }
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) ?? null;

  return (
    <SessionContext.Provider
      value={{ users, currentUser, loading, login, logout, refreshUsers }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession debe usarse dentro de <SessionProvider>');
  }
  return ctx;
}