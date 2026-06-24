import { PageResult } from "@sdd/shared";
import { Product } from "../../src/product/model";
import { ProductPageParams, ProductRepository } from "../../src/product/provider";

export class FakeProductRepository implements ProductRepository {
  readonly products: Product[];

  constructor(initialProducts: Product[] = []) {
    this.products = [...initialProducts];
  }

  async create(product: Product): Promise<Product> {
    this.products.push(product);
    return product;
  }

  async update(product: Product): Promise<Product> {
    const index = this.products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      this.products[index] = product;
    }
    return product;
  }

  async delete(id: string): Promise<void> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
    }
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async findPage(params: ProductPageParams): Promise<PageResult<Product>> {
    const { page, perPage } = params;
    const start = (page - 1) * perPage;
    const items = this.products.slice(start, start + perPage);
    return {
      items,
      page,
      perPage,
      total: this.products.length,
    };
  }
}
