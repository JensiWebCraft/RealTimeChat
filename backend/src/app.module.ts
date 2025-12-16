import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module'; // Add this
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [AuthModule, ChatModule, UsersModule], // AuthModule must be here
  providers: [PrismaService],
})
export class AppModule {}
