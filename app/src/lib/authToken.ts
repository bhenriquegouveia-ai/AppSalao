// Módulo neutro: guarda o token JWT atual em memória e expõe um hook de
// "não autorizado". Não depende da store de auth nem do apiClient — existe
// justamente para que os dois possam depender dele sem criar import circular
// (apiClient precisa do token; a store de auth precisa avisar o apiClient
// quando logar/deslogar).
let currentToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function getAuthToken(): string | null {
  return currentToken;
}

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function triggerUnauthorized(): void {
  // Só dispara logout se de fato havia uma sessão — evita loop ao tentar
  // logar/registrar com credenciais erradas (que também retornam 401).
  if (currentToken) {
    unauthorizedHandler?.();
  }
}
