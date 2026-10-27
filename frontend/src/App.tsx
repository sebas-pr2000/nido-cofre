import { Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { ChooseUserPage } from './pages/ChooseUserPage';
import { CreateGiftPage } from './pages/CreateGiftPage';
import { SentPage } from './pages/SentPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { GiftPage } from './pages/GiftPage';
import { InboxPage } from './pages/InboxPage';

function ComingSoon({ title }: { title: string }) {
  return <p className="text-center text-stone-500">{title}: próximamente</p>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChooseUserPage />} />
      <Route element={<AppLayout />}>
        <Route path="/new" element={<CreateGiftPage />} />
        <Route path="/sent" element={<SentPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/gifts/:id/checkout" element={<CheckoutPage />} />
        <Route path="/gifts/:id" element={<GiftPage />} />
      </Route>
    </Routes>
  );
}