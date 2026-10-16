import { validateRequest } from '../../domain/draw';
import { findDuplicates, parseParticipants } from '../../domain/participants';
import type { DrawRequest, Participant } from '../../domain/types';
import { MAX_DRAFT_TEXT_BYTES, type DrawDraft } from '../../platform/draft';

export interface PreparedParticipants {
  participants: Participant[];
  duplicates: string[];
  error: string;
}

export function prepareParticipants(text: string): PreparedParticipants {
  try {
    if (text.length > MAX_DRAFT_TEXT_BYTES)
      throw new Error('A lista excede o limite de 5 MB. Reduza o texto antes de continuar.');
    const participants = parseParticipants(text);
    const error =
      participants.length > 10_000
        ? 'A lista deve ter no máximo 10.000 participantes.'
        : participants.some((person) => person.name.length > 2000)
          ? 'Cada nome pode ter no máximo 2.000 caracteres.'
          : '';
    return { participants, duplicates: findDuplicates(participants), error };
  } catch (cause) {
    return {
      participants: [],
      duplicates: [],
      error: cause instanceof Error ? cause.message : 'Revise a lista de participantes.',
    };
  }
}

export function getTeamDistribution(
  { teamRule, teamAmount }: Pick<DrawDraft, 'teamRule' | 'teamAmount'>,
  total: number,
) {
  const amount = Number(teamAmount);
  const teamCount = teamRule === 'count' ? amount : Math.ceil(total / amount);
  const valid = Number.isInteger(teamCount) && teamCount >= 2 && teamCount <= total;
  return {
    amount,
    teamCount,
    valid,
    smallest: valid ? Math.floor(total / teamCount) : 0,
    largest: valid ? Math.ceil(total / teamCount) : 0,
  };
}

export function prepareRequest(
  mode: DrawRequest['mode'],
  draft: DrawDraft,
  prepared: PreparedParticipants,
): DrawRequest {
  if (mode !== 'numbers') {
    if (prepared.error) throw new Error(prepared.error);
    if (prepared.duplicates.length && draft.duplicateChoice === 'review')
      throw new Error('Revise os nomes repetidos antes de sortear.');
  }

  let request: DrawRequest;
  if (mode === 'teams') {
    const total = prepared.participants.length;
    const { amount, teamCount } = getTeamDistribution(draft, total);
    if (!Number.isInteger(amount) || amount < 1 || !draft.teamAmount)
      throw new Error('Informe uma quantidade inteira válida.');
    if (draft.teamRule === 'size' && total >= 2 && teamCount < 2)
      throw new Error(
        `Reduza o máximo para até ${total - 1} ${total === 2 ? 'pessoa' : 'pessoas'} por equipe para formar pelo menos 2 equipes.`,
      );
    request = { mode, participants: prepared.participants, teamCount };
  } else if (mode === 'names') {
    request = {
      mode,
      participants: prepared.participants,
      count: draft.winnerCount ? Number(draft.winnerCount) : 0,
    };
  } else {
    if (!draft.minimum || !draft.maximum || !draft.numberCount)
      throw new Error('Preencha o intervalo e a quantidade de números.');
    request = {
      mode,
      min: Number(draft.minimum),
      max: Number(draft.maximum),
      count: Number(draft.numberCount),
      allowRepeats: draft.allowRepeats,
    };
  }
  validateRequest(request);
  return request;
}
