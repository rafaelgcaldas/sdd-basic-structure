import { UseCase } from "@sdd/shared";
import { Product } from "../model";
import { ProductRepository } from "../provider";

export interface FindProductByIdIn {
  id: string;
}

export class FindProductById
  implements UseCase<FindProductByIdIn, Product | null>
{
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    input: FindProductByIdIn,
  ): Promise<Product | null> {
    return this.productRepository.findById(input.id);
  }
}
