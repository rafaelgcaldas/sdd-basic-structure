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
import { DeleteProduct, SaveProduct, type SaveProductIn } from '@sdd/catalog';
import { PrismaProductRepository } from './product.prisma';

type ProductPageQuery = {
  page?: string;
  perPage?: string;
};

function mapProduct(product: {
  id: string;
  name: string;
  description: string | null | undefined;
  price: number;
  status: string;
  availableOnline: boolean;
  featured: boolean;
  allowsPreOrder: boolean;
}) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    status: product.status,
    availableOnline: product.availableOnline,
    featured: product.featured,
    allowsPreOrder: product.allowsPreOrder,
  };
}

@Controller('products')
export class ProductController {
  constructor(
    private readonly productRepository: PrismaProductRepository,
  ) {}

  @Get()
  async list(@Query() query: ProductPageQuery) {
    const page = Number(query.page ?? 1);
    const perPage = Number(query.perPage ?? 10);
    const result = await this.productRepository.findPage({ page, perPage });
    return {
      data: result.items.map(mapProduct),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('product.not_found');
    return mapProduct(product);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: Omit<SaveProductIn, 'id'>): Promise<void> {
    const useCase = new SaveProduct(this.productRepository);
    await useCase.execute(body);
  }

  @Put(':id')
  @HttpCode(204)
  async update(
    @Param('id') id: string,
    @Body() body: Omit<SaveProductIn, 'id'>,
  ): Promise<void> {
    const useCase = new SaveProduct(this.productRepository);
    await useCase.execute({ ...body, id });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteProduct(this.productRepository);
    await useCase.execute({ id });
  }
}
