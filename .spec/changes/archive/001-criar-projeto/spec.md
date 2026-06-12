# 001-criar-projeto

## Objetivo

Criar a base do projeto monorepo com backend, frontend, pacote compartilhado, Prisma e a infraestrutura de autenticação e tratamento de erros do backend.

## Contexto Técnico

- Monorepo Turbo com `apps/frontend` (Next.js na porta 3000) e `apps/backend` (NestJS na porta 4000).
- Namespace npm do workspace: `@sdd`.
- Persistência via Prisma, com schema modular por domínio.
- Autenticação baseada em JWT no backend, com tratamento de erros centralizado.
- Esta spec entrega apenas a base técnica. Módulos de negócio (ex.: `auth`/cadastro de usuário) são criados em specs posteriores.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- Nenhum módulo de domínio deve ser criado nesta spec; foco exclusivo em infraestrutura compartilhada.

## Tasks

### Tasks - Configuração

- [x] Criar a estrutura base do monorepo com a skill [config-project-fullstack](../../../.cursor/skills/config-project-fullstack) usando o namespace `@sdd`.
  > ✅ 2026-06-11 22:15 — Executado `create-project.js --namespace @sdd`. Criado monorepo Turbo com `apps/backend` (NestJS) e `apps/frontend` (Next.js). Desvio: script usa `spawnSync` sem `shell: true`, que falha no Windows — adicionado `IS_WINDOWS` e `shell: IS_WINDOWS` no script para compatibilidade.

- [x] Configurar a infraestrutura do Prisma no backend com a skill [config-prisma](../../../.cursor/skills/config-prisma).
  > ✅ 2026-06-11 22:30 — Executado `init-prisma-backend.js --apply --install`. Criados `prisma/schema.prisma`, `prisma.config.ts`, `docker-compose.yml`, `src/db/db.module.ts`, `src/db/prisma.service.ts`, seed neutro e `bootstrap.model.prisma`. Prisma client gerado com sucesso. Desvio: mesma correção de Windows (`shell: IS_WINDOWS`) aplicada ao script.

- [x] Criar o pacote compartilhado com a skill [config-package-shared](../../../.cursor/skills/config-package-shared) usando o namespace `@sdd`.
  > ✅ 2026-06-11 22:40 — Executado `rebuild-shared.js`. Criado `packages/shared` com scope `@sdd/shared`, build TypeScript validado. Desvios: (1) template `package.json` tinha `@sdd/shared` em vez de `@temp/shared` — corrigido para o placeholder esperado; (2) `SKILL_DIR` apontava para `.agents/` em vez de `.cursor/` — adicionada detecção dinâmica de caminho; (3) `turbo run build` retorna exit code 1 no Windows mesmo com build bem-sucedido — substituído por `npm --workspace` como fallback no Windows.

- [x] Configurar a base de tratamento de erros e autenticação JWT no backend com a skill [backend-nest-config](../../../.cursor/skills/backend-nest-config).
  > ✅ 2026-06-11 22:24 — Executado `apply-backend-shared.js`. Criado `apps/backend/src/shared/` com auth JWT, guards, filtro global de erros e decorators. `app.module.ts` e `app.controller.ts` reescritos com `JwtAuthModule`, `ApiExceptionFilter` e `JwtAuthGuard` globais. Build do backend validado com sucesso. Desvio: mesma correção de Windows (`shell: IS_WINDOWS`) aplicada ao script.

## Resultado Esperado

- Monorepo funcional com `apps/backend` (NestJS, porta 4000) e `apps/frontend` (Next.js, porta 3000) sob o namespace `@sdd`.
- Prisma configurado com schema modular e infraestrutura (`DbModule`, `PrismaService`, seed técnico, docker compose) pronta para receber models de módulos.
- Pacote compartilhado disponível para backend, frontend e módulos de negócio.
- Backend com tratamento de erros centralizado e base de autenticação JWT prontos para serem consumidos por módulos futuros.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
