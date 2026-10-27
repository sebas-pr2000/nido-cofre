import { api } from './client';
import type { CheckoutInput, CreateGiftInput, Gift, Product, User } from './types';

export const getUsers = () => api<User[]>('/users');

export const getProducts = (filters: { category?: string; maxPrice?: number }) => {
  const params = new URLSearchParams();

  if (filters.category) params.set('category', filters.category);

  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));

  return api<Product[]>(`/products?${params}`);
};

export const createGift = (input: CreateGiftInput) => api<Gift>('/gifts', { method: 'POST', body: input });

export const getGift = (id: string, viewerId: string) => api<Gift>(`/gifts/${id}?viewerId=${encodeURIComponent(viewerId)}`);

export const getSentGifts = (userId: string) => api<Gift[]>(`/gifts/sent/${encodeURIComponent(userId)}`);

export const checkoutGift = (id: string, input: CheckoutInput) => api<Gift>(`/gifts/${id}/checkout`, { method: 'POST', body: input });