import { Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { ChooseUserPage } from './pages/ChooseUserPage';
import { CreateGiftPage } from './pages/CreateGiftPage';

function ComingSoon({ title }: { title: string }) {
  return <p className="text-center text-stone-500">{title}: próximamente</p>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChooseUserPage />} />
      <Route element={<AppLayout />}>
        <Route path="/new" element={<CreateGiftPage />} />
        <Route path="/sent" element={<ComingSoon title="Enviados" />} />
        <Route path="/inbox" element={<ComingSoon title="Recibidos" />} />
        <Route path="/gifts/:id/checkout" element={<ComingSoon title="Checkout" />} />
      </Route>
    </Routes>
  );
}