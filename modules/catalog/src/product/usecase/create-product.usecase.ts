import { UseCase } from "@sdd/shared";
import { Product } from "../model";
import { ProductRepository } from "../provider";

export interface CreateProductIn {
  entity: Product;
}

export class CreateProduct
  implements UseCase<CreateProductIn, Product>
{
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: CreateProductIn): Promise<Product> {
    return this.productRepository.create(input.entity);
  }
}
