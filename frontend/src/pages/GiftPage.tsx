import { useParams } from 'react-router';
import { SenderGiftView } from '../components/SenderGiftView';
import { useSession } from '../context/SessionContext';
import { useGift } from '../hooks/useGift';

export function GiftPage() {
  const { id } = useParams();
  const { currentUser } = useSession();
  const { gift, error } = useGift(id);

  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }
  if (!gift || !currentUser) {
    return <p className="text-center text-stone-500">Cargando cofre…</p>;
  }

  if (gift.senderId === currentUser.id) {
    return <SenderGiftView gift={gift} />;
  }

  return <p className="text-center text-stone-500">Vista de quien recibe: paso 10</p>;
}