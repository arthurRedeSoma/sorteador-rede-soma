import { useId, useState } from 'react';
import { CircleCheck, FileSearch, TriangleAlert } from 'lucide-react';
import { verifyRecord } from '../../platform/records';
import type { DrawRecordV1 } from '../../domain/types';
import styles from './Verification.module.css';

const MAX_RECORD_BYTES = 10 * 1024 * 1024;

export function Verification() {
  const fileId = useId();
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState<DrawRecordV1 | null>(null);
  const [error, setError] = useState('');

  async function checkFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setRecord(null);
    setError('');
    try {
      if (file.size > MAX_RECORD_BYTES) throw new Error('O registro deve ter no máximo 10 MB.');
      let input: unknown;
      try {
        input = JSON.parse(await file.text());
      } catch {
        throw new Error(
          'Este arquivo não é um JSON válido. Escolha o registro baixado após o sorteio.',
        );
      }
      const result = await verifyRecord(input);
      if (result.valid) setRecord(result.record);
      else setError(result.error);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível verificar o registro. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="verification-title">
      <div className={styles.intro}>
        <FileSearch size={24} aria-hidden="true" />
        <div>
          <h1 id="verification-title">Verificar um registro</h1>
          <p>
            Confira se as entradas, as escolhas aleatórias e o resultado de um sorteio são
            consistentes entre si.
          </p>
        </div>
      </div>

      <div className={styles.upload}>
        <label htmlFor={fileId}>Registro do sorteio (.json)</label>
        <input
          id={fileId}
          className="field"
          type="file"
          accept=".json,application/json"
          disabled={busy}
          onChange={(event) => {
            void checkFile(event.target.files?.[0]);
            event.target.value = '';
          }}
          aria-describedby={`${fileId}-hint`}
        />
        <p id={`${fileId}-hint`} className={styles.hint}>
          Até 10 MB. O arquivo é verificado neste navegador e não é enviado a um servidor.
        </p>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {busy ? (
          <p className={styles.progress}>Conferindo o registro e reproduzindo o cálculo…</p>
        ) : null}
        {error ? (
          <div className={styles.error} role="alert">
            <TriangleAlert size={22} aria-hidden="true" />
            <div>
              <h2>Não foi possível confirmar o registro</h2>
              <p>{error}</p>
            </div>
          </div>
        ) : null}
        {record ? (
          <div className={styles.success}>
            <CircleCheck size={24} aria-hidden="true" />
            <div>
              <h2>Resultado consistente com o registro</h2>
              <p>O cálculo reproduziu o resultado e o resumo SHA-256 corresponde ao conteúdo.</p>
              <dl className={styles.details}>
                <div>
                  <dt>Identificação</dt>
                  <dd>{record.id}</dd>
                </div>
                <div>
                  <dt>Modalidade</dt>
                  <dd>
                    {{ teams: 'Equipes', names: 'Nomes', numbers: 'Números' }[record.result.mode]}
                  </dd>
                </div>
                <div>
                  <dt>Versão do algoritmo</dt>
                  <dd>{record.algorithmVersion}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.explanation}>
        <h2>O que esta verificação demonstra</h2>
        <p>
          Ela reproduz o sorteio com as escolhas registradas e confere o resumo do arquivo. Isso
          ajuda a identificar inconsistências e permite inspecionar o cálculo.
        </p>
        <p>
          O arquivo pode ser recriado por quem o possui. A verificação não comprova tentativa única,
          horário externo, origem aleatória das escolhas nem ausência de outros sorteios feitos pelo
          organizador.
        </p>
        <a href="#/como-funciona">Entenda o processo de sorteio</a>
      </div>
    </section>
  );
}
