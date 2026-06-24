import { Product, PRODUCT_STATUS_VALUES } from "../src/index";

test("Deve exportar a entidade Product do módulo catalog", () => {
  expect(Product).toBeDefined();
});

test("Deve exportar os valores de status do produto", () => {
  expect(PRODUCT_STATUS_VALUES).toContain("active");
  expect(PRODUCT_STATUS_VALUES).toContain("inactive");
  expect(PRODUCT_STATUS_VALUES).toContain("draft");
});
