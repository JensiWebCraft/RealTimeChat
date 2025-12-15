import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatRoom } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateRoom(user1: string, user2: string): Promise<ChatRoom> {
    if (!user1 || !user2 || user1 === user2) {
      throw new Error('Invalid users for room creation');
    }

    const sorted = [user1, user2].sort();
    const roomKey = sorted.join('_');

    let room = await this.prisma.chatRoom.findUnique({
      where: { roomKey },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          roomKey,
          user1: sorted[0],
          user2: sorted[1],
        },
      });
    }

    return room;
  }

  async getMessagesForRoom(roomId: string) {
    return this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
