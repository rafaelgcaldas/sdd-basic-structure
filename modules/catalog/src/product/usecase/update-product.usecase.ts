import { UseCase } from "@sdd/shared";
import { Product } from "../model";
import { ProductRepository } from "../provider";

export interface UpdateProductIn {
  entity: Product;
}

export class UpdateProduct
  implements UseCase<UpdateProductIn, Product>
{
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: UpdateProductIn): Promise<Product> {
    return this.productRepository.update(input.entity);
  }
}
