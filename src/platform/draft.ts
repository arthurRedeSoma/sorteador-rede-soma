import { utf8ByteLength } from '../domain/canonical';
import { objectWithKeys } from '../domain/validation';

export const DRAFT_STORAGE_KEY = 'rede-soma:draw-draft:v1';
export const MAX_DRAFT_TEXT_BYTES = 5 * 1024 * 1024;

export interface DrawDraft {
  text: string;
  teamRule: 'count' | 'size';
  teamAmount: string;
  winnerCount: string;
  minimum: string;
  maximum: string;
  numberCount: string;
  allowRepeats: boolean;
  duplicateChoice: 'review' | 'keep';
  autoPresent: boolean;
  countdown: boolean;
}

export const defaultDraft: DrawDraft = Object.freeze({
  text: '',
  teamRule: 'count',
  teamAmount: '2',
  winnerCount: '1',
  minimum: '1',
  maximum: '100',
  numberCount: '1',
  allowRepeats: false,
  duplicateChoice: 'review',
  autoPresent: false,
  countdown: true,
});

function fieldText(value: unknown): string {
  // Incomplete numeric input is still a draft; draw validation runs on confirmation.
  if (typeof value !== 'string' || value.length > 64)
    throw new Error('Campo de preparação inválido.');
  return value;
}

function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Opção de preparação inválida.');
  return value;
}

function parseDraft(value: unknown): DrawDraft {
  const input = objectWithKeys(value, Object.keys(defaultDraft));
  if (
    typeof input.text !== 'string' ||
    input.text.length > MAX_DRAFT_TEXT_BYTES ||
    utf8ByteLength(input.text) > MAX_DRAFT_TEXT_BYTES
  ) {
    throw new Error('A preparação excede o limite de 5 MiB de texto.');
  }
  if (input.teamRule !== 'count' && input.teamRule !== 'size')
    throw new Error('Regra de equipes inválida.');
  if (input.duplicateChoice !== 'review' && input.duplicateChoice !== 'keep')
    throw new Error('Revisão de duplicatas inválida.');
  return {
    text: input.text,
    teamRule: input.teamRule,
    teamAmount: fieldText(input.teamAmount),
    winnerCount: fieldText(input.winnerCount),
    minimum: fieldText(input.minimum),
    maximum: fieldText(input.maximum),
    numberCount: fieldText(input.numberCount),
    allowRepeats: boolean(input.allowRepeats),
    duplicateChoice: input.duplicateChoice,
    autoPresent: boolean(input.autoPresent),
    countdown: boolean(input.countdown),
  };
}

export function loadDraft(): { draft: DrawDraft; warning?: string } {
  try {
    const stored = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (stored === null) return { draft: { ...defaultDraft } };
    // A JSON escape can occupy six characters for one original text character.
    if (stored.length > MAX_DRAFT_TEXT_BYTES * 6 + 2_048)
      throw new Error('Preparação extensa demais.');
    const envelope = objectWithKeys(JSON.parse(stored) as unknown, ['version', 'draft']);
    if (envelope.version !== 1) throw new Error('Versão de preparação inválida.');
    return { draft: parseDraft(envelope.draft) };
  } catch {
    return {
      draft: { ...defaultDraft },
      warning:
        'Não foi possível recuperar a preparação salva. Confira a lista e as regras antes de sortear.',
    };
  }
}

export function saveDraft(draft: DrawDraft): string | undefined {
  try {
    const snapshot = parseDraft(draft);
    window.sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ version: 1, draft: snapshot }),
    );
    return undefined;
  } catch {
    return 'Não foi possível salvar a preparação. Ela permanece nesta página, mas poderá ser perdida ao recarregar.';
  }
}
