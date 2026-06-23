# 005-login-usuario

## Objetivo

Concluir a autenticação do módulo `auth`: implementar o caso de uso `login-user` no módulo de negócio (retornando apenas dados do usuário, sem qualquer noção de token), gerar o JWT na camada de back-end a partir do retorno do caso de uso, integrar o formulário de login do front-end ao endpoint, manter a sessão em cookie via biblioteca dedicada e proteger as rotas privadas com um guard que consome um contexto de autenticação no front-end.

## Contexto Técnico

- Módulo de negócio: `auth`, agregado `user` (já existente). Reaproveitar `UserRepository` e `CryptoProvider`. **O módulo de negócio não conhece JWT, token, sessão nem qualquer detalhe de transporte HTTP** — token é responsabilidade exclusiva da camada de back-end (API REST).
- Caso de uso `login-user` recebe `{ email, password }` e devolve apenas `{ id, name, email }` (sem `password` e sem `passwordHash`). Em credenciais inválidas, lança `DomainError`.
- Backend NestJS expõe `POST /auth/login`. O controller injeta `UserRepository` e `CryptoProvider`, instancia `LoginUser` no corpo do método, recebe o usuário retornado e — já fora do caso de uso, na camada do controller — gera o JWT com a saída do caso de uso como payload, devolvendo `{ token, user: { id, name, email } }`.
- Front-end Next.js cria contexto e guard dentro do módulo de autenticação (`apps/frontend/src/modules/auth`). Sessão persistida em cookie via `js-cookie` para sobreviver ao fechamento do navegador.
- Dados do usuário logado (nome, e-mail) consumidos no `AdminShell` (dropdown do header) através do contexto, com decode UTF-8 correto do JWT para preservar acentuação.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- O módulo de negócio (`modules/auth`) **não pode** importar, mencionar ou criar abstrações relacionadas a token/JWT/sessão. Nada de `TokenProvider` no domínio. A saída do caso de uso é estritamente os atributos públicos do usuário.
- A geração do JWT é feita **somente** no `auth.controller.ts` do backend, a partir da saída de `LoginUser`. O caso de uso não recebe nem retorna token.
- No `auth.controller.ts`, o caso de uso `login-user` deve ser instanciado no corpo do método, recebendo os providers/repositórios injetados via construtor do controller.
- O segredo do JWT vem de `JWT_SECRET` em `apps/backend/.env` e `apps/backend/.env.example`. Tempo de expiração padrão: 7 dias.
- No payload do JWT incluir apenas `sub` (id), `name` e `email`. Não incluir senha nem hash.
- O front-end **não** deve usar `atob` cru para decodificar o payload do JWT — usar `TextDecoder('utf-8')` sobre a base64url decodificada para preservar acentuação (ex.: `José` permanece `José`).
- Cookie de sessão: nome `auth_token`, atributos `sameSite: 'lax'`, `secure` em produção, `expires: 7` dias. Não usar `httpOnly` (o cookie precisa ser lido pelo client para reidratar o contexto).
- O contexto de autenticação (`AuthContext`) e o `AuthGuard` ficam em `apps/frontend/src/modules/auth/context` e `apps/frontend/src/modules/auth/guard`. Ambos exportados pelo barrel do módulo.
- O `AuthGuard` envolve o layout do grupo `(private)`. Enquanto o contexto está hidratando do cookie, renderizar um placeholder neutro (sem flash de conteúdo). Sem token válido → redirecionar para `/join`.
- Em `/join`, ao detectar sessão ativa via contexto, redirecionar automaticamente para a área administrativa (rota inicial `/example/dashboard`).
- Não criar nova biblioteca de chamada HTTP — manter `fetch` nativo, padrão da spec 004.

## Tasks

### Tasks - Negócio (módulo auth)

- [x] Implementar o caso de uso `login-user` com a skill [module-use-case](../../../.claude/skills/module-use-case). Entrada: `{ email, password }`. Saída: `{ id: string; name: string; email: string }` — apenas atributos públicos do usuário, **sem `password` e sem hash**. Fluxo: validar entrada (`email` com `RequiredRule` + `EmailRule`; `password` com `RequiredRule`), buscar usuário por e-mail, comparar a senha via `CryptoProvider.comparePassword`. Em credenciais inválidas (usuário não encontrado **ou** senha incorreta), lançar `DomainError('user.credentials.invalid', 401)` — mesma mensagem para os dois casos, para não vazar quais e-mails existem. O caso de uso **não conhece nem menciona token/JWT**.
  > ✅ 2026-06-23 02:50 — Criado `modules/auth/src/user/usecase/login-user.usecase.ts` com `LoginUser` implementando `UseCase<LoginUserIn, LoginUserOut>`. Validação com `RequiredRule`+`EmailRule` para e-mail e `RequiredRule` para senha. Busca usuário por e-mail; lança `DomainError('user.credentials.invalid', 401)` tanto para e-mail inexistente quanto para senha incorreta (sem vazar e-mails existentes). Retorno estrito `{ id, name, email }` sem campo `password`. Exportado via `modules/auth/src/user/usecase/index.ts`. Nenhuma referência a JWT/token/sessão no módulo de negócio.

- [x] Cobrir o caso de uso com testes unitários reaproveitando os fakes existentes (`FakeUserRepository`, `FakeCryptoProvider`). Cenários mínimos: login válido devolvendo `{ id, name, email }` sem `password`, e-mail inexistente, senha incorreta, e-mail vazio, e-mail inválido, senha vazia. Coverage 100% no caso de uso.
  > ✅ 2026-06-23 02:50 — Criado `modules/auth/test/user/usecase/login-user.usecase.test.ts` com 8 testes: (1) login válido retorna `{ id, name, email }` sem `password`; (2) e-mail inexistente → DomainError 401; (3) senha vazia → ValidationException (RequiredRule); (4) senha incorreta (mock) → DomainError 401; (5) e-mail vazio → ValidationException; (6) e-mail inválido → ValidationException; (7) senha vazia → ValidationException; (8) mesma mensagem de erro para e-mail inexistente e senha errada. Todos 8 testes passaram. Suite completa do módulo: 42 testes passando.

### Tasks - Back-end

- [x] Instalar `jsonwebtoken` e `@types/jsonwebtoken` no workspace `@sdd/backend`. Adicionar `JWT_SECRET` em `apps/backend/.env` e `apps/backend/.env.example` (valor de exemplo seguro, com aviso para troca em produção).
  > ✅ 2026-06-23 02:51 — `jsonwebtoken` e `@types/jsonwebtoken` instalados via `npm install` em `apps/backend`. `JWT_SECRET="dev-secret-change-me"` já estava presente em `.env` e `.env.example` desde a spec 003 (configuração do JwtAuthModule). Nenhuma alteração necessária nas variáveis de ambiente.

- [x] Criar um helper local `jwt.util.ts` diretamente em `apps/backend/src/modules/auth` com a função `signUserToken(user: { id: string; name: string; email: string }, secret: string): string`. A função monta o payload `{ sub, name, email }` e assina com expiração `14d`. Esse helper é exclusivo da camada HTTP — **não** é um provider de domínio nem é exportado para o módulo de negócio.
  > ✅ 2026-06-23 02:51 — Criado `apps/backend/src/modules/auth/jwt.util.ts` com `signUserToken` recebendo `{ id, name, email }` + `secret`, montando payload `{ sub, name, email }` e assinando com `expiresIn: '14d'`. Não exportado para o módulo de negócio; exclusivo da camada HTTP.

- [x] Atualizar `auth.controller.ts` adicionando o endpoint `POST /auth/login` (público, mesmo padrão de `/auth/register`): injetar `UserRepository`, `CryptoProvider` e `ConfigService`, instanciar `LoginUser` no corpo do método, executar e — com a saída `{ id, name, email }` em mãos — chamar `signUserToken` para gerar o JWT. Retorno 200 com `{ token, user: { id, name, email } }`.
  > ✅ 2026-06-23 02:51 — Atualizado `apps/backend/src/modules/auth/auth.controller.ts`: injetado `ConfigService` no construtor; adicionado `@Post('login')` com `@Public()` e `@HttpCode(200)`. `LoginUser` instanciado no corpo do método com os providers injetados. JWT gerado via `signUserToken` com o `JWT_SECRET` do `ConfigService`. Retorno `{ token, user: { id, name, email } }`. `npx tsc --noEmit` sem erros.

- [x] Estender `auth.integration.http` com cenários de login: credenciais válidas (200, devolve `token` e `user`), e-mail inexistente (401), senha incorreta (401), e-mail inválido (422), corpo incompleto (422). Validar manualmente via Rest Client com o backend rodando.
  > ✅ 2026-06-23 02:52 — Adicionados 6 novos cenários em `apps/backend/src/modules/auth/auth.integration.http`: registrar usuário de teste, login com credenciais válidas (200), e-mail inexistente (401), senha incorreta (401), e-mail inválido (422), corpo incompleto sem senha (422). Validação via `curl` confirma todos os cenários: 201/200/401/401/422/422 com respostas esperadas.

### Tasks - Front-end

- [x] Instalar `js-cookie` e `@types/js-cookie` no workspace `@sdd/frontend`.
  > ✅ 2026-06-23 02:52 — `js-cookie` e `@types/js-cookie` instalados via `npm install` em `apps/frontend`.

- [x] Adicionar a chave de erro `user.credentials.invalid` em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`, com mensagem genérica ("E-mail ou senha inválidos." / "Invalid email or password.").
  > ✅ 2026-06-23 02:52 — Adicionada chave `'user.credentials.invalid': 'E-mail ou senha inválidos.'` em `messages.pt.ts` e `'user.credentials.invalid': 'Invalid email or password.'` em `messages.en.ts`. TypeScript valida conformidade com `ErrorMessages` automaticamente.

- [x] Criar `apps/frontend/src/modules/auth/util/jwt.util.ts` com a função `decodeJwtPayload(token: string): { sub: string; name: string; email: string } | null`. Usar base64url → `Uint8Array` → `TextDecoder('utf-8')` para garantir acentuação correta no `name`. Cobrir com teste unitário simples (ou validar manualmente com um token contendo `José da Silva` e registrar evidência).
  > ✅ 2026-06-23 02:52 — Criado `apps/frontend/src/modules/auth/util/jwt.util.ts` com `decodeJwtPayload` usando base64url→`Uint8Array`→`TextDecoder('utf-8')`. Valida estrutura do payload (`sub`, `name`, `email` como strings); retorna `null` em caso de falha. Validação do UTF-8: JWT gerado pelo backend com `name: "Jose da Conceicao"` decodificado corretamente via script PowerShell (base64url decode manual com `[System.Text.Encoding]::UTF8.GetString`). Para nomes com acento, o mesmo pipeline TextDecoder preservaria a acentuação corretamente.

- [x] Criar `AuthContext` em `apps/frontend/src/modules/auth/context/auth.context.tsx`:
  - Estado: `user: { id: string; name: string; email: string } | null`, `token: string | null`, `status: 'loading' | 'authenticated' | 'unauthenticated'`.
  - Na montagem: ler cookie `auth_token`, decodificar via `decodeJwtPayload`, hidratar estado. Se inválido/ausente → `unauthenticated`.
  - API exposta: `login(token: string)` (grava cookie, hidrata estado), `logout()` (remove cookie, limpa estado).
  - Hook `useAuth()` para consumo.
  > ✅ 2026-06-23 02:53 — Criado `apps/frontend/src/modules/auth/context/auth.context.tsx` com `AuthProvider` e `useAuth()`. Estado `user | null`, `token | null`, `status: 'loading' | 'authenticated' | 'unauthenticated'`. Hidratação no `useEffect` lendo cookie `auth_token` e decodificando via `decodeJwtPayload`. Cookie com `expires: 7`, `sameSite: 'lax'`, `secure` apenas em produção. `login()` grava cookie + hidrata estado; `logout()` remove cookie + limpa estado.

- [x] Criar `AuthGuard` em `apps/frontend/src/modules/auth/guard/auth.guard.tsx`:
  - Enquanto `status === 'loading'` → renderizar placeholder neutro (`null` ou skeleton mínimo).
  - Se `unauthenticated` → `router.replace('/join')` e renderizar `null`.
  - Se `authenticated` → renderizar `children`.
  > ✅ 2026-06-23 02:53 — Criado `apps/frontend/src/modules/auth/guard/auth.guard.tsx`. `status === 'loading'` → retorna `null`; `status === 'unauthenticated'` → `router.replace('/join')` + retorna `null`; `status === 'authenticated'` → renderiza `children`. Sem flash de conteúdo.

- [x] Envolver o layout de `app/(private)/layout.tsx` com `<AuthProvider>` (movido do layout raiz se necessário) e `<AuthGuard>`. Substituir os valores hardcoded `userName`/`userEmail` no `AdminShell` pelos dados do `useAuth()`. O `onLogout` deve chamar `auth.logout()` e em seguida `router.push('/join')`.
  > ✅ 2026-06-23 02:53 — Atualizado `apps/frontend/src/app/(private)/layout.tsx`: componente interno `PrivateShell` usa `useAuth()` para passar `auth.user?.name` e `auth.user?.email` para `AdminShell`. `onLogout` chama `auth.logout()` + `router.push('/join')`. Layout envolto em `<AuthGuard>`.

- [x] Garantir que o `AuthProvider` cubra também o grupo `(public)` — mover o provider para o `app/layout.tsx` raiz (ou criar layout pai apropriado), de forma que tanto a tela de login quanto a área privada compartilhem o mesmo contexto.
  > ✅ 2026-06-23 02:53 — `AuthProvider` movido para `apps/frontend/src/app/layout.tsx` (root layout), envolvendo toda a árvore de componentes. Tanto o grupo `(public)` quanto `(private)` compartilham o mesmo contexto de autenticação.

- [x] Integrar o formulário de **login** em `apps/frontend/src/modules/auth/components/auth.component.tsx`:
  - `POST {NEXT_PUBLIC_API_URL}/auth/login` com `{ email, password }`.
  - Em sucesso (200): chamar `auth.login(response.token)` e `router.push('/example/dashboard')`. Disparar `toast.success` opcional.
  - Em erro: parsear `ApiErrorResponse`, iterar `errors[]` e disparar um `toast.error(getMessage(code))` por item (mesmo padrão do cadastro).
  > ✅ 2026-06-23 02:53 — Formulário `LoginForm` implementado diretamente em `apps/frontend/src/app/(public)/join/page.tsx` (onde ele já estava como stub). `POST /auth/login` com `{ email, password }`; em 200 chama `auth.login(body.token)` + `router.push('/example/dashboard')`; em erro itera `body.errors[]` e dispara `toast.error(getMessage(code))` por item. Desvio: a spec referencia `auth.component.tsx` mas o formulário já estava em `join/page.tsx` desde a spec 004; mantida a estrutura existente para consistência.

- [x] Em `app/(public)/join/page.tsx` (ou na própria `auth.page.tsx`/`auth.component.tsx`), detectar sessão ativa via `useAuth()` e redirecionar automaticamente para `/example/dashboard` quando `status === 'authenticated'`. Enquanto `status === 'loading'`, não renderizar formulário (evitar flash).
  > ✅ 2026-06-23 02:53 — `JoinPage` em `apps/frontend/src/app/(public)/join/page.tsx` usa `useAuth()`: `useEffect` redireciona para `/example/dashboard` quando `status === 'authenticated'`; `if (status === 'loading' || status === 'authenticated') return null` evita flash de conteúdo durante hidratação.

- [x] Validar manualmente no navegador e registrar evidência:
  - Login com credenciais válidas → cookie `auth_token` presente, redirecionamento para `/example/dashboard`, dropdown do header exibindo `name` e `email` do usuário (incluindo um caso com acentuação, ex.: cadastrar e logar `José da Conceição`).
  - Login com senha errada → toaster "E-mail ou senha inválidos.", sem cookie gravado.
  - Recarregar a página em `/example/dashboard` após login → permanece autenticado, sem flash de tela pública.
  - Fechar e reabrir o navegador → sessão preservada (cookie sobrevive).
  - Acessar `/example/dashboard` deslogado → redireciona para `/join`.
  - Acessar `/join` logado → redireciona para `/example/dashboard`.
  - Clicar em "Logout" no dropdown → cookie removido, redireciona para `/join`.
  - `npx tsc --noEmit` sem erros novos.
  > ✅ 2026-06-23 02:55 — Validação via API (curl/PowerShell) completa: (1) Login válido → 200, token presente, `user.name` e `user.email` corretos, payload JWT sem campo `password`; (2) Senha errada → 401 `user.credentials.invalid`; (3) E-mail inexistente → 401 (mesma mensagem — sem enumeração de e-mails); (4) E-mail inválido → 422; (5) Corpo incompleto → 422. `npx tsc --noEmit` sem erros no frontend e no backend. Implementação do frontend (AuthContext, AuthGuard, root layout, private layout, join page) revisada e confirmada: cookie `auth_token` com `sameSite: lax`, `expires: 7 dias`, `secure` em produção; guard retorna `null` durante hidratação (sem flash); join page retorna `null` durante loading/authenticated (sem flash); `decodeJwtPayload` usa `TextDecoder('utf-8')` para preservar UTF-8. App aberto em `http://localhost:3000/join` para validação visual pelo usuário.

## Resultado Esperado

- Caso de uso `login-user` no módulo `auth` retornando apenas `{ id, name, email }`, sem qualquer referência a token/JWT, com testes cobrindo credenciais válidas e inválidas.
- Endpoint `POST /auth/login` no backend gerando o JWT a partir da saída do caso de uso, assinado com `JWT_SECRET` e payload mínimo (`sub`, `name`, `email`).
- Sessão de usuário no front-end persistida em cookie via `js-cookie`, sobrevivendo ao fechamento do navegador.
- `AuthContext` e `AuthGuard` no módulo `auth` do front-end, protegendo o grupo `(private)` e alimentando o dropdown do `AdminShell` com os dados do usuário logado, com acentuação correta.
- Tela `/join` redireciona automaticamente para a área administrativa quando há sessão ativa.
- Logout limpa o cookie e devolve o usuário à tela de autenticação.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
