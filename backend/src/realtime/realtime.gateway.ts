import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import { allowedOrigins } from '../config/cors.js';

const roomFor = (userId: string) => `user:${userId}`;

@WebSocketGateway({
  // cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' },
  cors: { origin: allowedOrigins },
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    const userId: unknown = client.handshake.auth?.userId;

    if (typeof userId !== 'string') {
      client.disconnect();
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      client.disconnect();
      return;
    }

    await client.join(roomFor(userId));
    this.logger.log(`${userId} conectado (${client.id})`);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(roomFor(userId)).emit(event, payload);
  }
}