import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Hash, Shuffle, Users, UserRound } from 'lucide-react';
import type { DrawRecordV1, DrawRequest } from '../../domain/types';
import type { DrawDraft } from '../../platform/draft';
import { createRecord } from '../../platform/records';
import { ImportDialog } from '../import/ImportDialog';
import { Results } from '../results/Results';
import { Presentation } from '../presentation/Presentation';
import { ParticipantEntry } from './ParticipantEntry';
import { NumberRange } from './NumberRange';
import { TeamSettings, SelectionSettings, PresentationOptions } from './DrawSettings';
import { prepareParticipants, prepareRequest } from './prepareDraw';
import { useDrawDraft } from './useDrawDraft';
import styles from './DrawWorkbench.module.css';

type Mode = DrawRequest['mode'];
type Props = {
  active: boolean;
  mode: Mode;
  record: DrawRecordV1 | null;
  sequence: number;
  onRecord: (record: DrawRecordV1) => void;
};
const modeInfo = {
  teams: {
    title: 'Sorteador de equipes',
    description: 'Junte os nomes. Forme equipes. Deixe o acaso fazer a divisão.',
    action: 'Sortear equipes',
  },
  names: {
    title: 'Sorteador de nomes',
    description: 'Uma lista de participantes. A mesma chance para cada inscrição.',
    action: 'Sortear nomes',
  },
  numbers: {
    title: 'Sorteador de números',
    description: 'Escolha o intervalo e a quantidade. O próximo número é por acaso.',
    action: 'Sortear números',
  },
};

export function DrawWorkbench({ active, mode, record, sequence, onRecord }: Props) {
  const { draft, warning, updateDraft, restoreRequest } = useDrawDraft();
  const [importing, setImporting] = useState(false);
  const [presentation, setPresentation] = useState<DrawRecordV1 | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ mode: Mode; message: string } | null>(null);
  const running = useRef(false);
  const lastRun = useRef(-Infinity);
  const preparation = useRef<HTMLDivElement>(null);
  const errorElement = useRef<HTMLParagraphElement>(null);
  const prepared = useMemo(() => prepareParticipants(draft.text), [draft.text]);
  const info = modeInfo[mode];
  const visibleRecord = record?.request.mode === mode ? record : null;
  const visibleError =
    (error?.mode === mode ? error.message : '') || (mode !== 'numbers' ? prepared.error : '');

  function changeSettings(changes: Partial<DrawDraft>) {
    updateDraft(changes);
    setError(null);
  }

  function changeText(text: string) {
    changeSettings({ text, duplicateChoice: 'review' });
  }

  async function runDraw() {
    if (running.current || performance.now() - lastRun.current < 700) return;
    setError(null);
    let request: DrawRequest;
    try {
      request = prepareRequest(mode, draft, prepared);
    } catch (cause) {
      setError({
        mode,
        message: cause instanceof Error ? cause.message : 'Revise as configurações.',
      });
      requestAnimationFrame(() => errorElement.current?.focus());
      return;
    }
    running.current = true;
    lastRun.current = performance.now();
    setBusy(true);
    try {
      const next = await createRecord(request, {
        version: __APP_VERSION__,
        commit: __BUILD_COMMIT__,
      });
      onRecord(next);
      if (draft.autoPresent) setPresentation(next);
    } catch (cause) {
      setError({
        mode,
        message:
          cause instanceof Error
            ? cause.message
            : 'Não foi possível concluir o sorteio. Tente novamente.',
      });
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  function prepareAgain() {
    if (!visibleRecord) return;
    restoreRequest(visibleRecord.request);
    setError(null);
    preparation.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    preparation.current
      ?.querySelector<HTMLInputElement | HTMLTextAreaElement>('textarea, input')
      ?.focus({ preventScroll: true });
  }

  return (
    <>
      <div data-no-print>
        <div className={styles.intro}>
          <h1>{info.title}</h1>
          <p>{info.description}</p>
        </div>
        {warning && (
          <p className="notice" role="status">
            {warning}
          </p>
        )}
        <nav className={styles.tabs} aria-label="Modalidades de sorteio">
          <a href="#/equipes" aria-current={mode === 'teams' ? 'page' : undefined}>
            <Users />
            Equipes
          </a>
          <a href="#/nomes" aria-current={mode === 'names' ? 'page' : undefined}>
            <UserRound />
            Nomes
          </a>
          <a href="#/numeros" aria-current={mode === 'numbers' ? 'page' : undefined}>
            <Hash />
            Números
          </a>
        </nav>
        <div className={styles.workspace} ref={preparation}>
          <section className={styles.entry} aria-labelledby="entry-title">
            {mode === 'numbers' ? (
              <NumberRange value={draft} onChange={changeSettings} />
            ) : (
              <ParticipantEntry
                text={draft.text}
                prepared={prepared}
                duplicateChoice={draft.duplicateChoice}
                onTextChange={changeText}
                onKeepDuplicates={() => updateDraft({ duplicateChoice: 'keep' })}
                onImport={() => setImporting(true)}
              />
            )}
          </section>
          <section className={styles.settings} aria-labelledby="settings-title">
            <h2 id="settings-title">
              {mode === 'teams' ? 'Como organizar?' : 'Configure o sorteio'}
            </h2>
            {mode === 'teams' ? (
              <TeamSettings
                value={draft}
                participantCount={prepared.participants.length}
                onChange={changeSettings}
              />
            ) : (
              <SelectionSettings
                mode={mode}
                count={mode === 'names' ? draft.winnerCount : draft.numberCount}
                allowRepeats={draft.allowRepeats}
                onCountChange={(count) =>
                  changeSettings(mode === 'names' ? { winnerCount: count } : { numberCount: count })
                }
                onRepeatsChange={(allowRepeats) => updateDraft({ allowRepeats })}
              />
            )}
            <PresentationOptions value={draft} onChange={updateDraft} />
            {visibleError && (
              <p className="errorMessage" role="alert" tabIndex={-1} ref={errorElement}>
                {visibleError}
              </p>
            )}
            <button
              className={`button ${styles.drawButton}`}
              disabled={busy}
              onClick={() => void runDraw()}
            >
              <Shuffle />
              {busy ? 'Sorteando…' : info.action}
              <ArrowRight />
            </button>
            <p className={styles.localNote}>O sorteio acontece no seu navegador.</p>
          </section>
        </div>
        <div className={styles.toolFootnote}>
          <span>Lista pronta, regras claras, resultado por acaso.</span>
          <a href="#/como-funciona">
            Entenda o sorteio
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
      {visibleRecord && (
        <Results
          record={visibleRecord}
          sequence={sequence}
          onPresent={() => setPresentation(visibleRecord)}
          onDrawAgain={prepareAgain}
          busy={busy}
        />
      )}
      {active && importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onImport={(value) => {
            changeText(value);
            setImporting(false);
          }}
        />
      )}
      {active && presentation && (
        <Presentation
          record={presentation}
          countdown={draft.countdown}
          onClose={() => setPresentation(null)}
        />
      )}
    </>
  );
}
