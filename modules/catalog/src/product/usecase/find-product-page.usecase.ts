import { PageResult, UseCase } from "@sdd/shared";
import { Product } from "../model";
import {
  ProductPageParams,
  ProductRepository,
} from "../provider";

export type FindProductPageIn = ProductPageParams;

export class FindProductPage
  implements UseCase<FindProductPageIn, PageResult<Product>>
{
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    input: FindProductPageIn,
  ): Promise<PageResult<Product>> {
    return this.productRepository.findPage(input);
  }
}
