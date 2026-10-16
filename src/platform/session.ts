import { parseRecord } from '../domain/records';
import type { DrawRecordV1 } from '../domain/types';

export const SESSION_STORAGE_KEY = 'rede-soma:draw-session:v1';
const MAX_SESSION_BYTES = 10 * 1024 * 1024;

export interface DrawSession {
  records: DrawRecordV1[];
  warning?: string;
}

export function loadSession(): DrawSession {
  try {
    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return { records: [] };
    if (stored.length > MAX_SESSION_BYTES) throw new Error('Sessão extensa demais.');
    const session: unknown = JSON.parse(stored);
    if (
      !session ||
      typeof session !== 'object' ||
      !('version' in session) ||
      session.version !== 1 ||
      !('records' in session) ||
      !Array.isArray(session.records)
    ) {
      throw new Error('Formato de sessão inválido.');
    }

    const records: DrawRecordV1[] = [];
    const ids = new Set<string>();
    let skipped = false;
    for (const item of session.records) {
      try {
        const record = parseRecord(item);
        if (ids.has(record.id)) throw new Error('Identificação repetida.');
        ids.add(record.id);
        records.push(record);
      } catch {
        skipped = true;
      }
    }
    return skipped
      ? {
          records,
          warning:
            'Alguns registros da sessão estavam inválidos e não puderam ser recuperados. Os demais continuam disponíveis.',
        }
      : { records };
  } catch {
    return {
      records: [],
      warning:
        'Não foi possível recuperar a sessão. Os próximos sorteios continuam disponíveis nesta página; baixe os registros para guardá-los.',
    };
  }
}

export function saveSession(records: DrawRecordV1[]): string | undefined {
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ version: 1, records }));
    return undefined;
  } catch {
    return 'O navegador não conseguiu salvar a sessão. Os sorteios continuam nesta página, mas podem ser perdidos ao recarregar. Baixe os registros para guardá-los.';
  }
}
