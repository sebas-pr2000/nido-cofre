import { io } from 'socket.io-client';

const userId = process.argv[2] ?? 'laura';
const url = process.env.API_URL ?? 'http://localhost:3000';

const socket = io(url, { auth: { userId } });

socket.on('connect', () => console.log(`🟢 ${userId} conectado (${socket.id})`));
socket.on('disconnect', (reason) => console.log(`🔴 ${userId} desconectado: ${reason}`));

socket.on('gift:event', (e: { type: string; gift: { id: string; status: string } }) => {
  console.log(`📨 [${userId}] ${e.type} → cofre ${e.gift.id.slice(0, 8)} (${e.gift.status})`);
});