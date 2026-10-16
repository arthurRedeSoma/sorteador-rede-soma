import { ArrowRight, Check, FileUp, Users } from 'lucide-react';
import { deduplicateParticipants } from '../../domain/participants';
import type { PreparedParticipants } from './prepareDraw';
import styles from './DrawWorkbench.module.css';

interface Props {
  text: string;
  prepared: PreparedParticipants;
  duplicateChoice: 'review' | 'keep';
  onTextChange: (text: string) => void;
  onKeepDuplicates: () => void;
  onImport: () => void;
}

const EXAMPLE =
  'Ana Souza\nBruno Lima\nCamila Alves\nDiego Santos\nElisa Costa\nFelipe Rocha\nGabriela Dias\nHenrique Melo\nIsabela Reis\nJoão Pereira\nLarissa Silva\nMarcos Oliveira';

export function ParticipantEntry({
  text,
  prepared,
  duplicateChoice,
  onTextChange,
  onKeepDuplicates,
  onImport,
}: Props) {
  const total = prepared.participants.length;
  return (
    <>
      <div className={styles.sectionHeading}>
        <h2 id="entry-title">Quem participa?</h2>
        <button className="textButton" onClick={onImport}>
          <FileUp />
          Importar lista
        </button>
      </div>
      <label className={styles.sectionHint} htmlFor="participants">
        Digite ou cole um nome por linha.
      </label>
      <div className={styles.textareaWrap}>
        <textarea
          id="participants"
          spellCheck={false}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={'Ana Souza\nBruno Lima\nCamila Alves\n...'}
          aria-label="Participantes"
          aria-describedby="participant-help"
          aria-invalid={!!prepared.error}
        />
        <div className={styles.textareaFooter}>
          <span aria-live="polite">
            <Users />
            <strong>{total.toLocaleString('pt-BR')}</strong>{' '}
            {total === 1 ? 'participante' : 'participantes'}
          </span>
          {text && (
            <button onClick={() => onTextChange('')} className={styles.clear}>
              Limpar
            </button>
          )}
        </div>
      </div>
      <div className={styles.entryBottom}>
        <p id="participant-help">Até 10.000 participantes.</p>
        <button className="textButton" onClick={() => onTextChange(EXAMPLE)}>
          Usar lista de exemplo
          <ArrowRight />
        </button>
      </div>
      {prepared.duplicates.length > 0 && (
        <div className={styles.duplicates} role="group" aria-label="Revisão de nomes repetidos">
          <strong>
            {prepared.duplicates.length === 1
              ? 'Um nome aparece mais de uma vez.'
              : `${prepared.duplicates.length} nomes aparecem mais de uma vez.`}
          </strong>
          <p>
            {prepared.duplicates.slice(0, 3).join(', ')}
            {prepared.duplicates.length > 3 ? '…' : ''}
          </p>
          <p>Cada linha mantida vale uma inscrição.</p>
          <div>
            <button className="buttonSecondary" onClick={onKeepDuplicates}>
              {duplicateChoice === 'keep' && <Check />}Manter inscrições distintas
            </button>
            <button
              className="textButton"
              onClick={() =>
                onTextChange(
                  deduplicateParticipants(prepared.participants)
                    .map((p) => p.name)
                    .join('\n'),
                )
              }
            >
              Remover duplicatas
            </button>
          </div>
        </div>
      )}
    </>
  );
}
