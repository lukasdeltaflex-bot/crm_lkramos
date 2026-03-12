/**
 * 🛡️ MOTOR DE PERSISTÊNCIA SEGURA LK RAMOS
 * Implementa versionamento, validação de JSON e auto-reparo para localStorage.
 */

const STORAGE_PREFIX = 'lk-v1.1-'; // Prefixo com versão para invalidar cache antigo se necessário

export const safeStorage = {
  /**
   * Salva um dado no localStorage com prefixo de versão e conversão automática para JSON.
   */
  set: (key: string, value: any): void => {
    if (typeof window === 'undefined') return;
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedValue);
    } catch (error) {
      console.warn(`[Storage] Falha ao salvar chave: ${key}`, error);
    }
  },

  /**
   * Recupera um dado, valida o JSON e aplica o auto-reparo em caso de corrupção.
   */
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);
      
      // Validação básica: se o retorno for nulo ou indefinido onde não deveria, reseta
      if (parsed === null || parsed === undefined) {
        return defaultValue;
      }

      return parsed as T;
    } catch (error) {
      // 🛠️ AUTO-REPARO: Se o JSON estiver quebrado, deleta a chave corrompida e usa o padrão
      console.error(`[Storage] Cache corrompido detectado na chave: ${key}. Resetando para o padrão.`);
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return defaultValue;
    }
  },

  /**
   * Remove uma chave específica.
   */
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  },

  /**
   * Limpa todo o cache relacionado ao sistema (mantendo dados de outros apps se existirem).
   */
  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('lk-')) {
        localStorage.removeItem(key);
      }
    });
  }
};
