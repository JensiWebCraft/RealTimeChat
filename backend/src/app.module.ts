import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { PrismaService } from 'prisma/prisma.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, ChatModule, UsersModule],
  providers: [PrismaService],
  exports: [PrismaService],
  controllers: [UsersController],
})
export class AppModule {}
