import { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowUpRight, History, Info, X } from 'lucide-react';
import type { DrawRecordV1 } from '../domain/types';
import { DrawWorkbench } from '../features/draw/DrawWorkbench';
import { Verification } from '../features/verification/Verification';
import { loadSession, saveSession } from '../platform/session';
import styles from './App.module.css';

const REPOSITORY = 'https://github.com/arthurRedeSoma/sorteador-rede-soma';
const labels = { teams: 'Equipes', names: 'Nomes', numbers: 'Números' };

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
function getRoute() {
  return window.location.hash.slice(1) || '/equipes';
}

export function App() {
  const route = useSyncExternalStore(subscribe, getRoute);
  const [initial] = useState(loadSession);
  const [records, setRecords] = useState(initial.records);
  const [warning, setWarning] = useState(initial.warning);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState<DrawRecordV1 | null>(null);
  const mode = route === '/nomes' ? 'names' : route === '/numeros' ? 'numbers' : 'teams';
  const isHelp = route === '/como-funciona';
  const isVerification = route === '/verificar';

  useEffect(() => {
    if (records !== initial.records) setWarning(saveSession(records));
  }, [records, initial.records]);

  function addRecord(record: DrawRecordV1) {
    setRecords((current) => [record, ...current]);
    setSelected(record);
  }

  return (
    <div className={styles.shell}>
      <a
        className={styles.skip}
        href="#conteudo"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('conteudo')?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <header className={styles.header}>
        <a className={styles.brand} href="#/equipes" aria-label="Sorteador Rede Soma, início">
          <img
            src={`${import.meta.env.BASE_URL}brand/logo-soma.png`}
            alt="Rede Soma Drogarias"
            width="145"
            height="64"
          />
          <span className={styles.brandDivider} />
          <span className={styles.brandName}>Sorteador</span>
        </a>
        <div className={styles.headerActions}>
          <a href="#/como-funciona" className={styles.helpLink} aria-label="Como funciona">
            <Info />
            <span>Como funciona</span>
          </a>
          <button
            className={styles.historyButton}
            onClick={() => setHistoryOpen(!historyOpen)}
            aria-expanded={historyOpen}
            aria-controls="historico"
          >
            <History />
            <span>Histórico</span>
            {records.length > 0 && <b>{records.length}</b>}
          </button>
        </div>
      </header>

      <main id="conteudo" className={styles.main} tabIndex={-1}>
        {warning && (
          <p className="notice" role="status">
            {warning}
          </p>
        )}
        {historyOpen && (
          <section
            id="historico"
            className={styles.history}
            data-no-print
            aria-labelledby="historico-title"
          >
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="historico-title">Sorteios desta sessão</h2>
                <p className="muted">Os registros ficam nesta aba. Baixe os que quiser guardar.</p>
              </div>
              <button
                className="textButton"
                onClick={() => setHistoryOpen(false)}
                aria-label="Fechar histórico"
              >
                <X />
              </button>
            </div>
            {records.length === 0 ? (
              <p className={styles.historyEmpty}>Seu primeiro resultado aparecerá aqui.</p>
            ) : (
              <ol className={styles.historyList}>
                {records.map((record, index) => (
                  <li key={record.id}>
                    <button
                      onClick={() => {
                        setSelected(record);
                        setHistoryOpen(false);
                        window.location.hash = `/${record.request.mode === 'teams' ? 'equipes' : record.request.mode === 'names' ? 'nomes' : 'numeros'}`;
                      }}
                    >
                      <span>
                        <strong>{labels[record.request.mode]}</strong>
                        <small>{new Date(record.createdAt).toLocaleString('pt-BR')}</small>
                      </span>
                      <span>
                        Sorteio {records.length - index}
                        <ArrowUpRight />
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
        <div hidden={isHelp || isVerification}>
          <DrawWorkbench
            active={!isHelp && !isVerification}
            mode={mode}
            onRecord={addRecord}
            record={selected}
            sequence={
              selected ? records.length - records.findIndex((r) => r.id === selected.id) : 0
            }
          />
        </div>
        {isHelp ? (
          <section className={styles.help}>
            <a className="textButton" href="#/equipes">
              Voltar ao sorteador
            </a>
            <h1>Um processo que você pode conferir.</h1>
            <p className={styles.helpLead}>
              Da lista ao resultado, o cálculo acontece no seu navegador. O código está aberto para
              inspeção.
            </p>
            <h2>Prepare, confira e sorteie</h2>
            <p>
              Escolha a modalidade, preencha os participantes ou o intervalo e revise as regras.
              Cada inscrição tem a mesma chance. Em equipes, os tamanhos diferem em no máximo uma
              pessoa.
            </p>
            <h2>De onde vem o acaso?</h2>
            <p>
              Usamos a fonte criptográfica do navegador, Web Crypto. O algoritmo evita favorecer
              valores na conversão para números inteiros e embaralha os participantes com
              Fisher–Yates.
            </p>
            <h2>O que o registro comprova</h2>
            <p>
              O arquivo JSON guarda as entradas, regras, escolhas e resultado. O verificador refaz o
              cálculo e confere a integridade do arquivo. Isso mostra consistência, mas não comprova
              tentativa única, origem da aleatoriedade nem horário externo. Um organizador ainda
              pode repetir o sorteio ou fabricar um registro consistente.
            </p>
            <h2>Seus dados ficam com você</h2>
            <p>
              A aplicação não envia nomes ou resultados a servidores e não usa rastreadores. O
              histórico fica na sessão desta aba. Arquivos exportados contêm os nomes informados;
              compartilhe-os apenas quando desejar.
            </p>
            <h2>Cada execução é um novo registro</h2>
            <p>
              A apresentação só revela um resultado já calculado. Alterar a lista não muda o
              resultado anterior. Ao sortear novamente, uma nova execução aparece no histórico.
            </p>
            <div className={styles.helpActions}>
              <a className="button" href="#/verificar">
                Verificar um registro
              </a>
              <a className="buttonSecondary" href={REPOSITORY} target="_blank" rel="noreferrer">
                Consultar código
                <ArrowUpRight />
              </a>
            </div>
          </section>
        ) : isVerification ? (
          <Verification />
        ) : null}
      </main>

      <footer className={styles.footer}>
        <div>
          <span className={styles.footerMark} />
          Feito para juntar pessoas.
        </div>
        <div className={styles.footerLinks}>
          <a href="#/verificar">Verificar registro</a>
          <a href={REPOSITORY} target="_blank" rel="noreferrer">
            Código público
            <ArrowUpRight />
          </a>
          <a
            href={
              __BUILD_COMMIT__ === 'local' ? REPOSITORY : `${REPOSITORY}/commit/${__BUILD_COMMIT__}`
            }
            target="_blank"
            rel="noreferrer"
            className={styles.version}
          >
            v{__APP_VERSION__} · {__BUILD_COMMIT__.slice(0, 7)}
          </a>
        </div>
      </footer>
    </div>
  );
}
