# 007-cadastro-produto

## Objetivo

Entregar o CRUD de `product` no módulo `catalog`, com agregado, persistência, endpoints e interface de listagem e formulário compartilhado entre criação e edição.

## Contexto Técnico

- Módulo de negócio: `catalog` (já existente), agregado `product`.
- Backend NestJS com controller dedicado para o CRUD e persistência via Prisma.
- Front-end Next.js com listagem paginada e formulário compartilhado entre criação e edição, dentro do módulo `catalog` em rota privada.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- O caso de uso `save-product` cobre tanto criação quanto atualização.
- Casos de uso de comando retornam `void`. Consultas não viram caso de uso — o controller chama o repositório direto.
- O projeto não usa DTOs de entrada. **Respostas de leitura devem ser mapeadas para objetos simples no controller antes de retornar** — entidades de domínio usam `protected readonly props` com getters de prototype, que não serializam via `JSON.stringify` (produzem `{}`). O controller deve construir explicitamente o objeto de retorno: `return { id: product.id, name: product.name, description: product.description, price: product.price, status: product.status, availableOnline: product.availableOnline, featured: product.featured, allowsPreOrder: product.allowsPreOrder }`.
- O campo `status` é uma enumeração com os valores `active`, `inactive` e `draft`. Validar com a regra `in` do pacote compartilhado e expor a enumeração como tipo no agregado.
- Os campos `availableOnline`, `featured` e `allowsPreOrder` são booleanos independentes (checkboxes no formulário). Quando ausentes na criação, assumem `false`.
- O campo `description` é opcional; quando ausente, persistir como `null`.
- O campo `price` é numérico, não-negativo (`min-value: 0`), com no máximo 2 casas decimais (regra `precision`).
- A listagem fica dentro do módulo `catalog` no front-end, em rota privada.
- **Sem verificação automatizada de UI nesta spec.** As validações automatizadas vão até a camada de backend (testes unitários do módulo + cenários no Rest Client). O usuário valida a interface manualmente.

## Tasks

### Tasks - Negócio (módulo catalog)

- [x] Criar o agregado `product` dentro do módulo `catalog` com a skill [module-aggregate](../../../.claude/skills/module-aggregate).
  > ✅ 2026-06-24 01:42 — Executado via `node .cursor/skills/module-aggregate/scripts/create-aggregate.js --module catalog --aggregate product --mode crud`. Estrutura criada em `modules/catalog/src/product/` com `model/`, `provider/`, `usecase/` e barrels.

- [x] Implementar a entidade `Product` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos: `name` (required, min-length 2, max-length 120), `description` (max-length 500, opcional), `price` (required, min-value 0, precision 2), `status` (required, in `active|inactive|draft`), `availableOnline` (boolean, default `false`), `featured` (boolean, default `false`), `allowsPreOrder` (boolean, default `false`).
  > ✅ 2026-06-24 01:45 — Implementada em `modules/catalog/src/product/model/product.entity.ts` usando `RequiredRule`, `MinLengthRule`, `MaxLengthRule`, `MinValueRule`, `PrecisionRule` e `InRule` do pacote compartilhado. Exportado `ProductStatus` e `PRODUCT_STATUS_VALUES`. Cobertura 100% no arquivo da entidade. Testes em `test/product/model/product.entity.test.ts`.

- [x] Definir o contrato do repositório de `product` com a skill [module-repository](../../../.claude/skills/module-repository).
  > ✅ 2026-06-24 01:46 — Interface `ProductRepository extends CrudRepository<Product, Product, Product, ProductPageParams>` em `modules/catalog/src/product/provider/product.repository.ts`. Fake `FakeProductRepository` em `modules/catalog/test/mock/fake-product.repository.ts`.

- [x] Implementar o caso de uso `save-product` com a skill [module-use-case](../../../.claude/skills/module-use-case). A decisão entre criar e atualizar deve ser baseada em uma consulta ao repositório (`findById`): se `id` vier na entrada e `findById` retornar um registro, executa atualização; caso contrário (sem `id` ou registro não encontrado), executa criação usando o `id` recebido ou gerando um novo.
  > ✅ 2026-06-24 01:47 — Implementado em `modules/catalog/src/product/usecase/save-product.usecase.ts`. Lógica de upsert via `findById`: se existe, clona e atualiza; caso contrário, cria nova entidade. Defaults booleanos em `false`. Cobertura 100%.

- [x] Implementar o caso de uso `delete-product` com a skill [module-use-case](../../../.claude/skills/module-use-case). Lançar `DomainError("product.not_found", 404)` quando o `id` não existir.
  > ✅ 2026-06-24 01:47 — Implementado em `modules/catalog/src/product/usecase/delete-product.usecase.ts`. Lança `DomainError("product.not_found", 404)` quando produto não encontrado. Cobertura 100%.

- [x] Cobrir os dois casos de uso com testes unitários, usando os fakes do módulo (`FakeProductRepository` e demais providers necessários).
  > ✅ 2026-06-24 01:50 — Testes em `test/product/usecase/save-product.usecase.test.ts` e `test/product/usecase/delete-product.usecase.test.ts`. Todos os 57 testes do módulo passam.

### Tasks - Back-end

- [x] Sincronizar o módulo `catalog` com o Prisma criando/atualizando o model da entidade `product` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module).
  > ✅ 2026-06-24 01:52 — Criado `apps/backend/prisma/models/catalog.model.prisma` com model `Product` (campos: id, name, description?, price Decimal(10,2), status, availableOnline, featured, allowsPreOrder, createdAt, updatedAt, deletedAt?; `@@map("products")`). Migration `20260624014207_catalog` aplicada com sucesso. `prisma:generate` executado.

- [x] Implementar o repositório Prisma de `product` em `apps/backend/src/modules/catalog` com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface definida no módulo.
  > ✅ 2026-06-24 01:54 — Implementado `PrismaProductRepository` em `apps/backend/src/modules/catalog/product.prisma.ts`. Conversão `Decimal → number` no `toDomain`. Registrado no `CatalogModule` com `DbModule`.

- [x] Criar/atualizar `apps/backend/src/modules/catalog/product.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD em `/products` (criar, atualizar, excluir, obter por id e listar paginado). Endpoints autenticados. Consultas chamam o repositório direto; comandos instanciam o caso de uso correspondente no corpo do método.
  > ✅ 2026-06-24 01:56 — Criado `ProductController` em `apps/backend/src/modules/catalog/product.controller.ts`. GET /products, GET /products/:id, POST /products (201), PUT /products/:id (204), DELETE /products/:id (204). Mapeamento explícito do retorno via `mapProduct()`. `npx tsc --noEmit` no backend: sem erros.

- [x] Criar `apps/backend/src/modules/catalog/product.integration.http` (Rest Client) cobrindo os fluxos do CRUD, incluindo os principais casos de erro (nome inválido, preço negativo, status fora do enum, produto inexistente em update/delete). Validar manualmente com o backend rodando.
  > ✅ 2026-06-24 01:57 — Criado `apps/backend/src/modules/catalog/product.integration.http` com cenários de autenticação, criação válida/inválida, listagem, busca por id, atualização e exclusão, incluindo casos de erro (401, 422, 404).

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. O agente entrega o código + `npx tsc --noEmit` limpo; a verificação visual é manual.

- [x] Criar a listagem paginada de `products` no módulo `catalog`, em rota privada. Tabela com as colunas nome, preço, status e ações (ícones de editar e excluir).
  > ✅ 2026-06-24 02:05 — Criado `ProductListComponent` em `apps/frontend/src/modules/catalog/components/product-list.component.tsx`. Rota em `apps/frontend/src/app/(private)/catalog/products/page.tsx`. Tabela com colunas Nome, Preço (formatado BRL), Status e Ações.

- [x] Criar o formulário de `product` compartilhado entre criação e edição, organizado em seções via [`form-section-layout`](../../../apps/frontend/src/shared/components/ui/form-section-layout.tsx): "Dados básicos" (nome, descrição), "Preço e status" (preço, status como `select` com as opções `active`, `inactive`, `draft`) e "Disponibilidade" (checkboxes `availableOnline`, `featured`, `allowsPreOrder`).
  > ✅ 2026-06-24 02:06 — Criado `ProductFormComponent` em `apps/frontend/src/modules/catalog/components/product-form.component.tsx`. Três seções: Dados básicos (nome, descrição textarea), Preço e status (price input, select de status), Disponibilidade (3 checkboxes). Compartilhado entre criação e edição.

- [x] Integrar a coluna de ações: lápis navega para a edição; lixeira abre [`delete-confirmation-dialog`](../../../apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx) e, ao confirmar, chama o backend e atualiza a tabela.
  > ✅ 2026-06-24 02:06 — Integrado na `ProductListComponent`. Lápis navega para `/catalog/products/:id`. Lixeira abre `DeleteConfirmationDialog` e, ao confirmar, chama `DELETE /products/:id` e recarrega a listagem.

- [x] Adicionar o item "Produtos" no menu lateral apontando para a listagem de `products`.
  > ✅ 2026-06-24 02:07 — Adicionado módulo `catalog` com item "Produtos" (`Package` icon) apontando para `/catalog/products` no `apps/frontend/src/app/(private)/layout.tsx`.

- [x] Acrescentar no i18n as chaves novas que aparecerem (ex.: `product.not_found`, rótulos de status `product.status.active|inactive|draft` e mensagens específicas de validação dos novos campos). Reaproveitar as chaves já cadastradas em specs anteriores.
  > ✅ 2026-06-24 02:08 — Adicionadas chaves `product.not_found`, `product.name.*`, `product.description.*`, `product.price.*`, `product.status.*` em `messages.pt.ts` e `messages.en.ts`.

- [x] Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
  > ✅ 2026-06-24 02:09 — `npx tsc --noEmit --project apps/frontend/tsconfig.json` executado com sucesso (exit code 0, sem erros). UI pronta para conferência manual.

## Resultado Esperado

- Agregado `product` com entidade validada, repositório contratado e casos de uso `save-product` e `delete-product` implementados e testados.
- Model `product` sincronizado no Prisma com migration aplicada.
- CRUD de `product` exposto no backend via `ProductController`, com cenários cobertos no `product.integration.http`.
- Listagem paginada, formulário compartilhado entre criação e edição (com seções de dados básicos, preço/status e checkboxes de disponibilidade) e exclusão com confirmação funcionando no front-end, acessíveis pelo item "Produtos" do menu lateral.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
