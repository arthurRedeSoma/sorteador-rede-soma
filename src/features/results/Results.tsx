import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, FileJson, Maximize2, Printer, RotateCcw } from 'lucide-react';
import type { DrawRecordV1 } from '../../domain/types';
import { downloadCsv, downloadRecord, formatResultText } from '../../platform/files';
import styles from './Results.module.css';

interface Props {
  record: DrawRecordV1;
  sequence: number;
  onPresent: () => void;
  onDrawAgain: () => void;
  busy: boolean;
}

export function Results({ record, sequence, onPresent, onDrawAgain, busy }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [record.id]);
  const { result, request } = record;
  const description =
    result.mode === 'teams'
      ? `${result.teams.length} equipes formadas`
      : result.mode === 'names'
        ? `${result.winners.length} ${result.winners.length === 1 ? 'nome sorteado' : 'nomes sorteados'}`
        : `${result.numbers.length} ${result.numbers.length === 1 ? 'número sorteado' : 'números sorteados'}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatResultText(record));
      setFeedback('Resultado copiado.');
    } catch {
      setFeedback('Não foi possível copiar. Você pode baixar o resultado em CSV.');
    }
  }
  function download(action: () => void) {
    try {
      action();
      setFeedback('Arquivo preparado para download.');
    } catch {
      setFeedback('Não foi possível baixar. Tente copiar o resultado.');
    }
  }

  return (
    <section className={styles.results} data-print-result aria-labelledby="result-title">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.complete}>
            <Check />
            Sorteio concluído
          </p>
          <h2 id="result-title" tabIndex={-1} ref={heading}>
            Resultado do sorteio
          </h2>
          <p className={styles.summary}>
            {description}
            <span>·</span>Sorteio {sequence}
            <span>·</span>
            {new Date(record.createdAt).toLocaleString('pt-BR')}
          </p>
        </div>
        <button className="buttonSecondary" onClick={onPresent} data-no-print>
          <Maximize2 />
          Apresentar
        </button>
      </div>
      {result.mode === 'teams' ? (
        <div className={styles.teams}>
          {result.teams.map((team, index) => (
            <section className={styles.team} key={index}>
              <div className={styles.teamHeading}>
                <h3>Equipe {index + 1}</h3>
                <span>
                  {team.length} {team.length === 1 ? 'pessoa' : 'pessoas'}
                </span>
              </div>
              <ul>
                {team.map((person) => (
                  <li key={person.id}>{person.name}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : result.mode === 'names' ? (
        <ol className={styles.winners}>
          {result.winners.map((person, index) => (
            <li key={person.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{person.name}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <ol className={styles.numbers}>
          {result.numbers.map((number, index) => (
            <li key={index}>
              <span className="visuallyHidden">Posição {index + 1}: </span>
              {number.toLocaleString('pt-BR')}
            </li>
          ))}
        </ol>
      )}
      <div className={styles.actions} data-no-print>
        <div>
          <button className="buttonSecondary" onClick={() => void copy()}>
            <Copy />
            Copiar
          </button>
          <button className="buttonSecondary" onClick={() => download(() => downloadCsv(record))}>
            <Download />
            Baixar CSV
          </button>
          <button
            className="buttonSecondary"
            onClick={() => download(() => downloadRecord(record))}
          >
            <FileJson />
            Baixar registro
          </button>
          <button className="buttonSecondary" onClick={() => window.print()}>
            <Printer />
            Imprimir
          </button>
        </div>
        <button className="textButton" disabled={busy} onClick={onDrawAgain}>
          <RotateCcw />
          Novo sorteio
        </button>
      </div>
      <p role="status" className={styles.feedback} data-no-print>
        {feedback}
      </p>
      <details className={styles.details} data-no-print>
        <summary>Dados deste sorteio</summary>
        <dl>
          <dt>Identificação</dt>
          <dd>{record.id}</dd>
          <dt>Participação</dt>
          <dd>
            {request.mode === 'numbers'
              ? `De ${request.min} a ${request.max}, ${request.allowRepeats ? 'com' : 'sem'} repetição`
              : `${request.participants.length} inscrições`}
          </dd>
          <dt>Versão</dt>
          <dd>
            v{record.build.version} · {record.build.commit.slice(0, 7)}
          </dd>
          <dt>SHA-256</dt>
          <dd>
            <code>{record.digest}</code>
          </dd>
        </dl>
        <p>
          O registro permite conferir o cálculo. Não comprova tentativa única nem impede novos
          sorteios. <a href="#/verificar">Verificar um arquivo</a>
        </p>
      </details>
    </section>
  );
}
