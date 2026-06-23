# 004-cadastro-cliente-frontend

## Objetivo

Implementar a tela `/join` no front-end com alternância entre **cadastro** e **login**. O cadastro chama `POST /auth/register` no backend. Em sucesso ou erro, exibe toasters — um por mensagem — sem redirecionar. O login terá estrutura visual completa, sem integração funcional por enquanto.

## Contexto Técnico

- Rota existente: `app/(public)/join/page.tsx`, criada pela spec 003.
- URL base da API: variável `NEXT_PUBLIC_API_URL` definida em `apps/frontend/.env`. Endpoint de registro: `POST {NEXT_PUBLIC_API_URL}/auth/register`, corpo `{ name, email, password }`, retorna 201 sem corpo em sucesso.
- Respostas de erro seguem o tipo `ApiErrorResponse` (em `shared/types/api-error.type.ts`): campo `errors: string[]` com chaves i18n. Cada item deve gerar um toaster individual.
- O `Toaster` (sonner) já está montado em `app/layout.tsx` — basta importar `toast` de `sonner` nos componentes.
- Sistema de i18n em `shared/i18n/`: função `getMessage(key)` traduz chaves de erro para o idioma do navegador.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- Usar `fetch` nativo (sem biblioteca extra) para chamar o backend.
- Não redirecionar após o cadastro — nem em sucesso, nem em erro.
- Os campos obrigatórios do cadastro: `name`, `email` e `password`.
- O formulário de login deve ter os campos `email` e `password` com botão de submissão; o handler pode ser no-op ou chamar `toast.info('Login em breve')`.
- Não criar novos componentes fora de `app/(public)/join/` — reaproveitar o que já existe em `shared/`.
- Não adicionar validação client-side além do atributo `required` nos inputs — a validação de negócio fica no backend.

## Tasks

### Tasks - Mapeamento de erros e i18n

- [x] Ler `apps/backend/src/modules/auth/auth.integration.http` e `apps/backend/src/shared/errors/api-exception.filter.ts` para identificar todos os códigos de erro possíveis retornados por `POST /auth/register` no campo `errors[]` da `ApiErrorResponse`. Listar cada código identificado na evidência.
  > ✅ 2026-06-23 00:04 — Mapeamento completo dos erros de `POST /auth/register`:
  > - `user.name.required` — nome vazio (RequiredRule no use case)
  > - `user.email.required` — e-mail vazio (RequiredRule no use case)
  > - `user.password.required` — senha vazia (RequiredRule no use case)
  > - `user.password.strong.password` — senha não atende critérios de força (StrongPasswordRule)
  > - `user.password.no.common.password` — senha na lista de senhas comuns (NoCommonPasswordRule)
  > - `user.name.min.length` — nome com menos de 3 caracteres (MinLengthRule em user.validate())
  > - `user.name.max.length` — nome com mais de 80 caracteres (MaxLengthRule em user.validate())
  > - `user.name.person.name` — nome sem formato "nome sobrenome" (PersonNameRule em user.validate())
  > - `user.email.invalid.email` — formato de e-mail inválido (EmailRule em user.validate())
  > - `user.email.already.registered` — e-mail já cadastrado (DomainError 409)

- [x] Verificar se todos os códigos identificados na task anterior estão presentes como chaves em `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`. Adicionar as chaves ausentes com tradução em português e inglês, mantendo o padrão existente no arquivo.
  > ✅ 2026-06-23 00:07 — Nenhuma das 10 chaves de domínio existia nos arquivos i18n. Todas foram adicionadas em `messages.pt.ts` e `messages.en.ts` seguindo o padrão de literais com aspas simples (chaves em dot notation como `'user.name.required'`). O tipo `ErrorMessages` deriva de `keyof typeof errorMessagesPt`, portanto o TypeScript valida automaticamente que `messages.en.ts` contém as mesmas chaves — build passou sem erros.

### Tasks - Front-end

- [x] Substituir o conteúdo de `app/(public)/join/page.tsx` por um componente com estado `mode` (`'register' | 'login'`) que alterna entre os dois formulários via botão/link de troca.
  > ✅ 2026-06-23 00:10 — Componente `JoinPage` reescrito com `'use client'` e `useState<Mode>('register')`. O botão "Já tem uma conta? Entrar" / "Não tem uma conta? Cadastrar" alterna entre os modos. Screenshot evidencia modo cadastro (subtítulo "Crie sua conta para começar") e modo login (subtítulo "Entre na sua conta para continuar").

- [x] Implementar o formulário de **cadastro** com os campos `name`, `email` e `password`, chamando `POST {NEXT_PUBLIC_API_URL}/auth/register` ao submeter:
  - Em sucesso (201): disparar `toast.success` com mensagem de confirmação de cadastro.
  - Em erro: parsear o corpo como `ApiErrorResponse`, iterar `errors[]` e disparar um `toast.error(getMessage(code))` para cada item — um toaster por erro recebido.
  - Não redirecionar em nenhum caso.
  > ✅ 2026-06-23 00:15 — Componente `RegisterForm` implementado em `page.tsx`:
  > - `fetch` nativo para `POST NEXT_PUBLIC_API_URL/auth/register`
  > - Estado `loading` desabilita inputs e muda texto do botão para "Cadastrando..." durante a requisição
  > - Status 201 → `toast.success('Cadastro realizado com sucesso!')` + `form.reset()`
  > - Demais status → `body.errors.forEach(code => toast.error(getMessage(code)))`
  > - `catch` → `toast.error(getMessage('DEFAULT_API_ERROR'))`
  > - Screenshot capturado: toast de sucesso ("Cadastro realizado com sucesso!") após submit com dados válidos
  > - Screenshot capturado: toast de erro 409 ("Este e-mail já está cadastrado.") ao reenviar o mesmo e-mail
  > - Screenshot capturado: toast de erro 422 ("Esta senha é muito comum. Escolha uma senha mais segura.") com senha "123456"
  > - CDP DOM inspection confirmou 3 toasts simultâneos para payload `{name:'', email:'test@...', password:'123456'}`: "O nome é obrigatório.", "A senha deve ter no mínimo 8 caracteres...", "Esta senha é muito comum..."

- [x] Implementar o formulário de **login** com os campos `email` e `password` e botão de submissão. O handler não precisa chamar nenhum endpoint por enquanto.
  > ✅ 2026-06-23 00:10 — Componente `LoginForm` implementado em `page.tsx` com campos `email` e `password` e `onSubmit` que chama `toast.info('Login em breve')`. Screenshot confirma formulário de login renderizado após alternância.

- [x] Validar manualmente no navegador os seguintes cenários e registrar evidência com print ou descrição:
  - Alternar entre os modos cadastro e login.
  - Submeter cadastro com dados válidos → toaster de sucesso exibido.
  - Submeter com e-mail já cadastrado → toaster com mensagem de e-mail duplicado (erro 409).
  - Submeter com senha fraca → toaster com mensagem de senha inválida (erro 422).
  - Submeter com múltiplos campos inválidos → um toaster individual para cada erro retornado.
  > ✅ 2026-06-23 00:20 — Todos os cenários validados com servidor backend (porta 4000) e frontend (porta 3000) rodando localmente:
  > 1. **Alternância**: clique em "Já tem uma conta? Entrar" alterna para formulário de login; "Não tem uma conta? Cadastrar" retorna ao cadastro. Subtítulo e campos mudam corretamente.
  > 2. **Cadastro válido** (maria.test002@example.com / Strong@Pass1): backend retornou 201, formulário resetado, toast verde "Cadastro realizado com sucesso!" exibido no canto inferior direito.
  > 3. **E-mail duplicado**: reenvio do mesmo e-mail retornou 409 `{"errors":["user.email.already.registered"]}`, toast vermelho "Este e-mail já está cadastrado." exibido.
  > 4. **Senha fraca** ("123456"): backend retornou 422 `{"errors":["user.password.strong.password","user.password.no.common.password"]}`, toast vermelho "Esta senha é muito comum. Escolha uma senha mais segura." capturado.
  > 5. **Múltiplos erros** (name vazio + senha "123456"): backend retornou 422 com 3 erros; CDP MutationObserver confirmou 3 `[data-sonner-toast]` simultâneos no DOM com textos: "O nome é obrigatório.", "A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.", "Esta senha é muito comum. Escolha uma senha mais segura."
  > - `npx tsc --noEmit` e `next build` passaram sem erros. Rota `/join` pré-renderizada como conteúdo estático (○).

## Resultado Esperado

- Rota `/join` exibe alternância entre formulário de cadastro e formulário de login.
- Cadastro integrado ao backend: exibe toasters de sucesso ou de erro (um por mensagem) sem redirecionar.
- Todos os códigos de erro de `POST /auth/register` mapeados no i18n em português e inglês.
- Login com estrutura visual completa, sem integração funcional.
- Sem erros de TypeScript ou de build após as alterações.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
