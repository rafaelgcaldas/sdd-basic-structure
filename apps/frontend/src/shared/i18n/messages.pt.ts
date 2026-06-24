export const errorMessagesPt = {
  DEFAULT_API_ERROR: 'Ocorreu um erro inesperado na comunicação com o servidor.',
  INVALID_ARRAY: 'O valor deve ser uma lista.',
  INVALID_ITEM: 'Item inválido.',
  INVALID_OBJECT: 'O valor deve ser um objeto.',
  INVALID_VALUE: 'Valor inválido.',
  MAX_ITEMS: 'Máximo de {{max}} itens.',
  MIN_ITEMS: 'Mínimo de {{min}} itens.',
  REQUIRED_FIELD: 'Campo de preenchimento obrigatório.',
  SHELL_CONTEXT_PROVIDER_REQUIRED: 'useShellContext deve ser usado dentro de <ShellProvider>.',
  UNKNOWN_ERROR_CODE: 'Erro desconhecido: {{code}}',
  'user.name.required': 'O nome é obrigatório.',
  'user.name.min.length': 'O nome deve ter no mínimo 3 caracteres.',
  'user.name.max.length': 'O nome deve ter no máximo 80 caracteres.',
  'user.name.person.name': 'Informe seu nome completo (nome e sobrenome).',
  'user.email.required': 'O e-mail é obrigatório.',
  'user.email.invalid.email': 'Informe um e-mail válido.',
  'user.email.already.registered': 'Este e-mail já está cadastrado.',
  'user.password.required': 'A senha é obrigatória.',
  'user.password.strong.password': 'A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.',
  'user.password.no.common.password': 'Esta senha é muito comum. Escolha uma senha mais segura.',
  'user.credentials.invalid': 'E-mail ou senha inválidos.',
  'user.not_found': 'Usuário não encontrado.',
  'user.password.confirmation.mismatch': 'A senha e a confirmação de senha não conferem.',
} as const;

export type ErrorMessageKey = keyof typeof errorMessagesPt;
export type ErrorMessages = Record<ErrorMessageKey, string>;
