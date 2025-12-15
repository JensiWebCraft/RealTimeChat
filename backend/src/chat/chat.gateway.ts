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
      const socketRoom = room.roomKey;

      client.join(socketRoom);
      console.log(`User ${payload.sender} joined room: ${socketRoom}`);

      const messages = await this.chatService.getMessagesForRoom(room.id);

      client.emit('chatHistory', { messages });
    } catch (error) {
      console.error('Join room error:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('privateMessage')
  async handlePrivateMessage(@MessageBody() data: PrivateMessagePayload) {
    try {
      const room = await this.chatService.getOrCreateRoom(
        data.sender,
        data.receiver,
      );
      const socketRoom = room.roomKey;

      const savedMessage = await this.prisma.message.create({
        data: {
          roomId: room.id,
          senderId: data.sender,
          text: data.text,
        },
      });

      const messageToSend = {
        sender: data.sender,
        receiver: data.receiver,
        text: data.text,
        createdAt: savedMessage.createdAt,
      };

      this.server.to(socketRoom).emit('privateMessage', messageToSend);
    } catch (error) {
      console.error('Send message error:', error);
    }
  }
}
