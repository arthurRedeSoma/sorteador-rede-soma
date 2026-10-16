import { useEffect, useState } from 'react';
import type { DrawRequest } from '../../domain/types';
import { loadDraft, saveDraft, type DrawDraft } from '../../platform/draft';

export function useDrawDraft() {
  const [initial] = useState(loadDraft);
  const [draft, setDraft] = useState(initial.draft);
  const [warning, setWarning] = useState(initial.warning);

  useEffect(() => {
    const saveWarning = saveDraft(draft);
    setWarning(saveWarning || (draft === initial.draft ? initial.warning : undefined));
  }, [draft, initial]);

  function updateDraft(changes: Partial<DrawDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function restoreRequest(request: DrawRequest) {
    if (request.mode === 'numbers') {
      updateDraft({
        minimum: String(request.min),
        maximum: String(request.max),
        numberCount: String(request.count),
        allowRepeats: request.allowRepeats,
      });
      return;
    }

    updateDraft({
      text: request.participants.map((person) => person.name).join('\n'),
      duplicateChoice: 'keep',
      ...(request.mode === 'teams'
        ? { teamRule: 'count', teamAmount: String(request.teamCount) }
        : { winnerCount: String(request.count) }),
    });
  }

  return { draft, warning, updateDraft, restoreRequest };
}
