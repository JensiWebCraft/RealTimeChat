import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        username: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return users;
  }
}
