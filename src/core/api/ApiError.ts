/** Erro devolvido pela API, com o codigo que o backend definiu. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly details: unknown;

  constructor(
    message: string,
    status: number,
    code: string | null = null,
    details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Falha de rede: o servidor nao chegou a responder. */
  static offline(): ApiError {
    return new ApiError('Sem conexão com o servidor', 0, 'NETWORK_ERROR');
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}
