import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { PrismaService } from '../../prisma/prisma.service';

interface PrivateMessagePayload {
  sender: string;
  receiver: string;
  text: string;
}

interface JoinRoomPayload {
  sender: string;
  receiver: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'https://real-time-chat-navy.vercel.app'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  // ✅ Join room
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    try {
      const room = await this.chatService.getOrCreateRoom(
        payload.sender,
        payload.receiver,
      );

      client.join(room.roomKey);

      // Get messages and normalize sender
      const messages = await this.chatService.getMessagesForRoom(room.id);
      const formattedMessages = await Promise.all(
        messages.map(async (m) => {
          const senderUser = await this.prisma.user.findUnique({
            where: { id: m.senderId },
          });
          return {
            sender: senderUser?.username || '',
            receiver: payload.receiver,
            text: m.text,
            createdAt: m.createdAt,
          };
        }),
      );

      client.emit('chatHistory', { messages: formattedMessages });
    } catch (error) {
      console.error('Join room error:', error.message);
      client.emit('error', { message: error.message });
    }
  }

  // ✅ Send private message
  @SubscribeMessage('privateMessage')
  async handlePrivateMessage(@MessageBody() data: PrivateMessagePayload) {
    try {
      // 1️⃣ Get or create room
      const room = await this.chatService.getOrCreateRoom(
        data.sender,
        data.receiver,
      );

      // 2️⃣ Find sender user
      const senderUser = await this.prisma.user.findUnique({
        where: { username: data.sender.trim() },
      });

      if (!senderUser) throw new Error('Sender user not found');

      // 3️⃣ Save message
      const savedMessage = await this.prisma.message.create({
        data: {
          roomId: room.id,
          senderId: senderUser.id,
          text: data.text.trim(),
        },
      });

      // 4️⃣ Emit message to room
      this.server.to(room.roomKey).emit('privateMessage', {
        sender: data.sender,
        receiver: data.receiver,
        text: data.text,
        createdAt: savedMessage.createdAt,
      });
    } catch (error) {
      console.error('Send message error:', error.message);
    }
  }
}
