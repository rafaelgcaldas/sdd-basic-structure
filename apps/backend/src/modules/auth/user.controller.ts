import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  DeleteUser,
  SaveUser,
  type SaveUserIn,
} from '@sdd/auth';
import { BcryptCryptoProvider } from './bcrypt.crypto';
import { PrismaUserRepository } from './user.prisma';

type UserPageQuery = {
  page?: string;
  perPage?: string;
};

@Controller('users')
export class UserController {
  constructor(
    private readonly userRepository: PrismaUserRepository,
    private readonly cryptoProvider: BcryptCryptoProvider,
  ) {}

  @Get()
  async list(@Query() query: UserPageQuery) {
    const page = Number(query.page ?? 1);
    const perPage = Number(query.perPage ?? 10);
    const result = await this.userRepository.findPage({ page, perPage });
    return {
      data: result.items.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      })),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('user.not_found');
    return { id: user.id, name: user.name, email: user.email };
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: Omit<SaveUserIn, 'id'>): Promise<void> {
    const useCase = new SaveUser(this.userRepository, this.cryptoProvider);
    await useCase.execute(body);
  }

  @Put(':id')
  @HttpCode(204)
  async update(
    @Param('id') id: string,
    @Body() body: Omit<SaveUserIn, 'id'>,
  ): Promise<void> {
    const useCase = new SaveUser(this.userRepository, this.cryptoProvider);
    await useCase.execute({ ...body, id });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteUser(this.userRepository);
    await useCase.execute({ id });
  }
}
