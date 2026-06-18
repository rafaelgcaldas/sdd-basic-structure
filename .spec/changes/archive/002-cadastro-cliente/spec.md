# 002-cadastro-cliente

## Objetivo

Entregar o cadastro de usuário no módulo `auth`, com entidade, caso de uso `register-user`, persistência via Prisma e endpoint HTTP protegido por criptografia de senha com bcrypt.

## Contexto Técnico

- Módulo de negócio novo: `auth`, com agregado `user`.
- Persistência via Prisma; criptografia de senha via biblioteca `bcrypt`.
- Endpoint de registro exposto no backend via controller simples que instancia o caso de uso no corpo do método.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- As interfaces definidas no módulo `auth` (repositório de `user` e `crypto.provider.ts`) não podem ser alteradas pelas implementações.
- As implementações técnicas (repositório Prisma e provider bcrypt) devem ficar diretamente em `apps/backend/src/modules/auth`, sem subpasta.
- No `auth.controller.ts`, o caso de uso `register-user` deve ser instanciado no corpo do método, recebendo as implementações injetadas no próprio controller como parâmetro.

## Tasks

### Tasks - Módulo auth

- [x] Criar o módulo `auth` com a skill [config-new-module](../../../.cursor/skills/config-new-module).
  > ✅ 2026-06-16 00:15 — Executado via `create-module.js --module auth --namespace @cadastro-base`. O placeholder `__package_name__` no `package.json` do workspace foi corrigido manualmente para `@sdd/auth` (namespace ajustado para seguir o padrão do projeto). `npm install`, `npm run build` e `npm run test` executados com sucesso (1 teste, 100% coverage).

- [x] Criar o agregado `user` dentro do módulo `auth` com a skill [module-aggregate](../../../.cursor/skills/module-aggregate), contendo apenas um caso de uso de exemplo.
  > ✅ 2026-06-16 00:15 — Executado via `create-aggregate.js --module auth --aggregate user --mode example`. Criadas as pastas `model/`, `provider/` e `usecase/` com arquivos-base do agregado.

- [x] Implementar a entidade `user` com a skill [module-entity](../../../.cursor/skills/module-entity), com os campos `id`, `name` (rule: person name), `email` (rule: email) e `password` (rule: hash pass).
  > ✅ 2026-06-16 00:17 — Entidade `User` implementada em `modules/auth/src/user/model/user.entity.ts` com campos `name`, `email`, `password` herdando `id` e timestamps de `EntityState`. Validações: `RequiredRule + MinLengthRule(3) + MaxLengthRule(80) + PersonNameRule` para nome; `RequiredRule + EmailRule` para email; `BcryptHashRule` para password. Teste criado em `test/user/model/user.entity.test.ts` com 25 casos e 100% de cobertura.

- [x] Criar a interface `crypto.provider.ts` em `modules/auth/.../user/provider` com os métodos de criptografar senha e comparar senhas.
  > ✅ 2026-06-16 00:18 — Interface `CryptoProvider` criada em `modules/auth/src/user/provider/crypto.provider.ts` com os métodos `hashPassword(password: string): Promise<string>` e `comparePassword(password: string, hash: string): Promise<boolean>`. Exportada via `provider/index.ts`.

- [x] Implementar o caso de uso `register-user` com a skill [module-use-case](../../../.cursor/skills/module-use-case), cobrindo o fluxo: validar dados de entrada (`name`, `email`, `password`), validar se o usuário já está cadastrado, criptografar a senha, criar a entidade `user` e persistir via repositório. O retorno do caso de uso deve ser `void`.
  > ✅ 2026-06-16 00:21 — Caso de uso `RegisterUser` implementado em `modules/auth/src/user/usecase/register-user.usecase.ts`. Fluxo: validação de entrada (`RequiredRule` + `StrongPasswordRule` + `NoCommonPasswordRule`), verificação de duplicidade via `findByEmail` (lança `DomainError 409`), hash via `CryptoProvider`, criação e validação da entidade `User`, persistência via `UserRepository`. Fakes `FakeUserRepository` e `FakeCryptoProvider` criados em `test/mock/`. 8 testes com 100% de cobertura.

### Tasks - Back-end

- [x] Sincronizar o módulo `auth` com o Prisma criando o model da entidade `user` com a skill [backend-prisma-sync-module](../../../.cursor/skills/backend-prisma-sync-module).
  > ✅ 2026-06-16 00:25 — Model `User` criado em `apps/backend/prisma/models/auth.model.prisma` com campos `id`, `name`, `email` (unique), `password`, `createdAt`, `updatedAt`, `deletedAt` mapeados para tabela `users`. Arquivo `bootstrap.model.prisma` removido. Migration `20260616022608_auth` criada e aplicada. `prisma:generate` executado com sucesso.

- [x] Implementar o repositório Prisma de `user` diretamente em `apps/backend/src/modules/auth` (sem subpasta) com a skill [backend-prisma-repository](../../../.cursor/skills/backend-prisma-repository), sem alterar a interface definida no módulo `auth`.
  > ✅ 2026-06-16 00:26 — Classe `PrismaUserRepository` implementada em `apps/backend/src/modules/auth/user.prisma.ts` com métodos `create`, `update`, `delete`, `findById`, `findByEmail` e `findPage`. Registrada e exportada em `auth.module.ts` com `DbModule` nos imports.

- [x] Instalar `bcrypt` no backend e implementar `crypto.provider.ts` diretamente em `apps/backend/src/modules/auth` (sem subpasta) usando bcrypt, sem alterar a interface definida no módulo `auth`.
  > ✅ 2026-06-16 00:27 — `bcrypt` e `@types/bcrypt` instalados no workspace `apps/backend`. Classe `BcryptCryptoProvider` implementada em `apps/backend/src/modules/auth/bcrypt.crypto.ts` implementando `CryptoProvider` com `hashPassword` (bcrypt.hash, 10 rounds) e `comparePassword` (bcrypt.compare). Registrada e exportada em `auth.module.ts`.

- [x] Criar `auth.controller.ts` no backend com a skill [backend-nest-controller](../../../.cursor/skills/backend-nest-controller) expondo o endpoint de registrar usuário: injetar repositório e `crypto.provider` diretamente no controller, instanciar o caso de uso `register-user` no corpo do método e passar as dependências via parâmetro.
  > ✅ 2026-06-16 00:28 — Controller `AuthController` atualizado com endpoint `POST /auth/register` (HTTP 201, rota pública via `@Public()`). Injeta `PrismaUserRepository` e `BcryptCryptoProvider` no construtor; instancia `RegisterUser` no corpo do método. `AuthModule` registrado no `AppModule`. Backend compila sem erros.

- [x] Criar os testes de integração HTTP em `auth.integration.http` (Rest Client) cobrindo o fluxo de registro de usuário.
  > ✅ 2026-06-16 00:29 — Arquivo `apps/backend/src/modules/auth/auth.integration.http` criado com 5 cenários: cadastro válido (201), e-mail duplicado (409), sem nome (422), sem e-mail (422) e senha fraca (422). Usa `@scenarioVersion = {{$timestamp}}` para evitar colisão entre execuções.

## Resultado Esperado

- Módulo `auth` com agregado `user`, entidade validada e caso de uso `register-user` implementado e testado.
- Model `user` sincronizado no Prisma com migration aplicada.
- Endpoint de cadastro de usuário exposto no backend, com senha armazenada criptografada via bcrypt.
- Testes de integração em `auth.integration.http` executando com sucesso.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
