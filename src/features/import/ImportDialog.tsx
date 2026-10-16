import { useEffect, useId, useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';
import { readImportFile, selectParticipants, type ImportPreview } from './parseImport';
import styles from './ImportDialog.module.css';

interface ImportDialogProps {
  onImport: (text: string) => void;
  onClose: () => void;
}

export function ImportDialog({ onImport, onClose }: ImportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const fileId = useId();
  const columnId = useId();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [filename, setFilename] = useState('');
  const [column, setColumn] = useState(0);
  const [hasHeader, setHasHeader] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  let names: string[] = [];
  let selectionError = '';
  if (preview) {
    try {
      names = selectParticipants(preview, column, hasHeader);
    } catch (cause) {
      selectionError =
        cause instanceof Error ? cause.message : 'Não foi possível preparar esta lista.';
    }
  }
  const visibleError = error || selectionError;

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    setReading(true);
    setError('');
    setPreview(null);
    setFilename(file.name);
    setColumn(0);
    setHasHeader(false);
    try {
      setPreview(await readImportFile(file));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível ler o arquivo. Tente novamente.',
      );
    } finally {
      setReading(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id={titleId}>Importar participantes</h2>
          <p>Confira a lista antes de usá-la no sorteio.</p>
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Fechar importação"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.fileField}>
          <label htmlFor={fileId}>
            <FileUp size={20} aria-hidden="true" /> Arquivo TXT ou CSV
          </label>
          <input
            id={fileId}
            className="field"
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            disabled={reading}
            onChange={(event) => {
              void chooseFile(event.target.files?.[0]);
              event.target.value = '';
            }}
            aria-describedby={`${fileId}-hint`}
          />
          <p id={`${fileId}-hint`} className={styles.hint}>
            Até 5 MB e 10.000 participantes. O arquivo é lido apenas neste navegador.
          </p>
        </div>

        {reading ? <p role="status">Lendo arquivo…</p> : null}
        {preview?.kind === 'csv' ? (
          <div className={styles.options}>
            <label htmlFor={columnId}>
              Coluna dos participantes
              <select
                id={columnId}
                className="field"
                value={column}
                onChange={(event) => setColumn(Number(event.target.value))}
              >
                {Array.from({ length: preview.columnCount }, (_, index) => (
                  <option key={index} value={index}>
                    Coluna {index + 1}
                    {hasHeader && preview.rows[0]?.[index]
                      ? ` — ${preview.rows[0][index].slice(0, 80)}`
                      : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(event) => setHasHeader(event.target.checked)}
              />{' '}
              A primeira linha é um cabeçalho
            </label>
          </div>
        ) : null}

        {visibleError ? (
          <p className={styles.error} role="alert">
            {visibleError}
          </p>
        ) : null}
        {preview && !selectionError ? (
          <section className={styles.preview} aria-label="Prévia da importação">
            <div className={styles.previewHeading}>
              <h3>Prévia da lista</h3>
              <span>{names.length.toLocaleString('pt-BR')} participantes</span>
            </div>
            <p className={styles.filename}>{filename}</p>
            {names.length > 0 ? (
              <ol>
                {names.slice(0, 5).map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ol>
            ) : (
              <p>Nenhum nome nesta coluna. Escolha outra coluna ou outro arquivo.</p>
            )}
            {names.length > 5 ? (
              <p className={styles.hint}>
                E mais {(names.length - 5).toLocaleString('pt-BR')} participantes.
              </p>
            ) : null}
            <p className={styles.hint}>
              Linhas vazias são ignoradas. Nomes repetidos serão revisados na preparação.
            </p>
          </section>
        ) : null}
      </div>

      <footer className={styles.footer}>
        <button type="button" className="buttonSecondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="button"
          disabled={reading || !names.length || Boolean(visibleError)}
          onClick={() => {
            onImport(names.join('\n'));
            onClose();
          }}
        >
          Usar esta lista
        </button>
      </footer>
    </dialog>
  );
}
