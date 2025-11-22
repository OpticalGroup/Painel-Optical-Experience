/**
 * FASE 4: SEGURANÇA - Rate Limiting do lado do cliente
 * Previne abuso de API e ataques de força bruta
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private requests = new Map<string, RequestRecord>();

  /**
   * Verifica se a requisição é permitida
   * @param key - Identificador único (ex: userId, IP, endpoint)
   * @param config - Configuração de limite
   * @returns true se permitido, false se bloqueado
   */
  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    // Primeira requisição ou janela expirada
    if (!record || now >= record.resetAt) {
      this.requests.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }

    // Dentro da janela e abaixo do limite
    if (record.count < config.maxRequests) {
      record.count++;
      return true;
    }

    // Limite excedido
    return false;
  }

  /**
   * Retorna o tempo restante até o reset em ms
   */
  getTimeUntilReset(key: string): number {
    const record = this.requests.get(key);
    if (!record) return 0;

    const now = Date.now();
    return Math.max(0, record.resetAt - now);
  }

  /**
   * Retorna quantas requisições restam na janela atual
   */
  getRemainingRequests(key: string, maxRequests: number): number {
    const record = this.requests.get(key);
    if (!record) return maxRequests;

    const now = Date.now();
    if (now >= record.resetAt) return maxRequests;

    return Math.max(0, maxRequests - record.count);
  }

  /**
   * Remove entrada do rate limiter
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Limpa entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, record] of this.requests.entries()) {
      if (now >= record.resetAt) {
        this.requests.delete(key);
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Limpar rate limiter expirado a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

// Configurações predefinidas
export const RateLimits = {
  // Autenticação: 5 tentativas por 15 minutos
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  
  // Mutações gerais: 30 requisições por minuto
  MUTATIONS: { maxRequests: 30, windowMs: 60 * 1000 },
  
  // CSV Import: 3 por hora (operação pesada)
  CSV_IMPORT: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  
  // Queries: 100 por minuto
  QUERIES: { maxRequests: 100, windowMs: 60 * 1000 },
  
  // Export: 10 por hora
  EXPORT: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
};

/**
 * Helper para aplicar rate limiting em funções
 */
export function withRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  key: string,
  config: RateLimitConfig
): T {
  return ((...args: any[]) => {
    if (!rateLimiter.isAllowed(key, config)) {
      const waitTime = Math.ceil(rateLimiter.getTimeUntilReset(key) / 1000);
      throw new Error(
        `Limite de requisições excedido. Tente novamente em ${waitTime} segundos.`
      );
    }
    
    return fn(...args);
  }) as T;
}
