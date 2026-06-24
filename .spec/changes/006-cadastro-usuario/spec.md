# 006-cadastro-usuario

## Objetivo

Entregar o CRUD de usuário no módulo `auth`, servindo de referência para os próximos cadastros da aplicação.

## Contexto Técnico

- Módulo de negócio: `auth`, agregado `user` (já existente).
- Backend NestJS com controller dedicado para o CRUD.
- Front-end Next.js com listagem paginada e formulário compartilhado entre criação e edição, dentro do módulo `auth`.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- O caso de uso `save-user` cobre tanto criação quanto atualização e é **distinto** de `register-user`. Não fundir nem substituir o `register-user` existente.
- Casos de uso de comando retornam `void`. Consultas não viram caso de uso — o controller chama o repositório direto.
- Confirmação de senha é responsabilidade do front-end. Backend recebe apenas `password`.
- Em edição, se `password` vier vazio, a senha atual é mantida.
- O projeto não usa DTOs de entrada. **Respostas de leitura devem ser mapeadas para objetos simples no controller antes de retornar** — entidades de domínio usam `protected readonly props` com getters de prototype, que não serializam via `JSON.stringify` (produzem `{}`). O controller deve construir explicitamente o objeto de retorno: `return { id: user.id, name: user.name, email: user.email }`.
- A listagem fica dentro do módulo `auth` no front-end, em rota privada.
- **Sem verificação automatizada de UI nesta spec.** Não acionar `mcp__Claude_Preview` nem `mcp__Claude_in_Chrome`. As validações automatizadas vão até a camada de backend (testes unitários do módulo + cenários no Rest Client). O usuário valida a interface manualmente.

## Tasks

### Tasks - Negócio (módulo auth)

- [x] Implementar o caso de uso `save-user` com a skill [module-use-case](../../../.claude/skills/module-use-case). A decisão entre criar e atualizar deve ser baseada em uma consulta ao repositório (`findById`): se `id` vier na entrada e `findById` retornar um usuário, executa atualização; caso contrário (sem `id` ou usuário não encontrado no banco), executa criação usando o `id` recebido ou gerando um novo. Em edição sem `password` (ausente ou vazio), manter o hash atual sem re-hashear.
  > ✅ 2026-06-23 21:30 — Criado `modules/auth/src/user/usecase/save-user.usecase.ts` com lógica de criação/atualização baseada em `findById`. Em update sem senha, mantém o hash existente. Em criação, `password` é obrigatório. Exportado em `usecase/index.ts`. Cobertura 100%.

- [x] Implementar o caso de uso `delete-user` com a skill [module-use-case](../../../.claude/skills/module-use-case).
  > ✅ 2026-06-23 21:30 — Criado `modules/auth/src/user/usecase/delete-user.usecase.ts`. Chama `userRepository.delete(input.id)` e retorna `void`. Exportado em `usecase/index.ts`. Cobertura 100%.

- [x] Cobrir os dois casos de uso com testes unitários, reaproveitando os fakes existentes (`FakeUserRepository`, `FakeCryptoProvider`).
  > ✅ 2026-06-23 21:30 — Criados `test/user/usecase/save-user.usecase.test.ts` (11 testes) e `test/user/usecase/delete-user.usecase.test.ts` (3 testes). `FakeUserRepository` atualizado para aceitar `initialUsers` no construtor. Total: 56 testes passando no módulo.

### Tasks - Back-end

- [x] Criar `apps/backend/src/modules/auth/user.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD em `/users` (criar, atualizar, excluir, obter por id e listar paginado). Endpoints autenticados. Consultas chamam o repositório direto; comandos instanciam o caso de uso correspondente.
  > ✅ 2026-06-23 21:45 — Criado `apps/backend/src/modules/auth/user.controller.ts` com 5 endpoints: GET /users (paginado), GET /users/:id, POST /users (201), PUT /users/:id (204), DELETE /users/:id (204). Todos autenticados pelo guard global. Respostas de leitura mapeadas para objetos simples. Registrado em `auth.module.ts`. `npx tsc --noEmit` do backend passou sem erros.

- [x] Criar `apps/backend/src/modules/auth/user.integration.http` (Rest Client) cobrindo os fluxos do CRUD, incluindo os principais casos de erro. Validar manualmente com o backend rodando.
  > ✅ 2026-06-23 21:45 — Criado `apps/backend/src/modules/auth/user.integration.http` cobrindo: autenticação (register + login para obter token), listagem com/sem token, criação com/sem token e com validações de campo, busca por id (existente/inexistente/sem token), atualização (manter senha/nova senha/sem token/validação), exclusão (existente/inexistente/sem token). Validação manual pendente com backend rodando.

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. O agente entrega o código + `npx tsc --noEmit` limpo; a verificação visual é manual.

- [x] Criar a listagem paginada de usuários no módulo `auth`, em rota privada. Tabela com colunas de nome, e-mail e ações (ícones de editar e excluir).
  > ✅ 2026-06-23 22:00 — Criados `apps/frontend/src/modules/auth/components/user-list.component.tsx`, `apps/frontend/src/modules/auth/pages/user-list.page.tsx` e `apps/frontend/src/app/(private)/auth/users/page.tsx`. Tabela com colunas Nome, E-mail e Ações. Paginação via `PaginationControls`. API call autenticada com token.

- [x] Criar o formulário de usuário compartilhado entre criação e edição, organizado em seções via [`form-section-layout`](../../../apps/frontend/src/shared/components/ui/form-section-layout.tsx): "Dados básicos" (nome, e-mail) e "Senha" (senha + confirmação).
  > ✅ 2026-06-23 22:00 — Criados `apps/frontend/src/modules/auth/components/user-form.component.tsx` e `apps/frontend/src/modules/auth/pages/user-form.page.tsx`. Seções "Dados básicos" e "Senha" via `FormSectionLayout`. Em edição, senha é opcional (mantida no backend se vazia). Rotas: `apps/frontend/src/app/(private)/auth/users/new/page.tsx` e `apps/frontend/src/app/(private)/auth/users/[id]/page.tsx` (com `user-form-edit-wrapper.component.tsx` que carrega o usuário via API).

- [x] Integrar a coluna de ações: lápis navega para a edição; lixeira abre [`delete-confirmation-dialog`](../../../apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx) e, ao confirmar, chama o backend e atualiza a tabela.
  > ✅ 2026-06-23 22:00 — Integrado em `user-list.component.tsx`: ícone `Pencil` navega para `/auth/users/:id`; ícone `Trash2` abre `DeleteConfirmationDialog` com nome do usuário. Ao confirmar, DELETE /users/:id é chamado e a tabela é recarregada.

- [x] Adicionar o item "Usuários" no menu lateral apontando para a listagem.
  > ✅ 2026-06-23 22:00 — Adicionado módulo "Administração" com item "Usuários" (ícone `Users`) apontando para `/auth/users` em `apps/frontend/src/app/(private)/layout.tsx`.

- [x] Acrescentar no i18n as chaves novas que aparecerem (ex.: `user.not_found`, mensagem de senha e confirmação divergentes). Reaproveitar as chaves já cadastradas em specs anteriores.
  > ✅ 2026-06-23 22:00 — Adicionadas em `messages.pt.ts` e `messages.en.ts`: `user.not_found` e `user.password.confirmation.mismatch`.

- [x] Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
  > ✅ 2026-06-23 22:00 — `npx tsc --noEmit -p apps/frontend/tsconfig.json` executado com saída limpa (exit code 0). UI pronta para conferência manual.

## Resultado Esperado

- Casos de uso `save-user` e `delete-user` implementados e testados, sem alterar `register-user` nem `login-user`.
- CRUD de usuário exposto no backend via `UserController`, com cenários cobertos no `user.integration.http`.
- Listagem paginada, formulário compartilhado e exclusão com confirmação funcionando no front-end.
- Spec serve de referência para os próximos cadastros do projeto.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
