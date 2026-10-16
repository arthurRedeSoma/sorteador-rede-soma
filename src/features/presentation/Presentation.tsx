import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react';
import type { DrawRecordV1 } from '../../domain/types';
import styles from './Presentation.module.css';

interface Props {
  record: DrawRecordV1;
  countdown: boolean;
  onClose: () => void;
}

export function Presentation({ record, countdown, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [remaining, setRemaining] = useState(() =>
    countdown && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 3 : 0,
  );
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [fullScreenError, setFullScreenError] = useState('');
  const { result } = record;
  const entries =
    result.mode === 'teams'
      ? result.teams.map((team, i) => ({
          title: `Equipe ${i + 1}`,
          names: team.map((p) => p.name),
        }))
      : result.mode === 'names'
        ? result.winners.map((p, i) => ({ title: `${i + 1}º nome sorteado`, names: [p.name] }))
        : result.numbers.map((n, i) => ({
            title: `${i + 1}º número sorteado`,
            names: [n.toLocaleString('pt-BR')],
          }));
  const current = entries[index];

  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (focus instanceof HTMLElement) focus.focus();
      if (document.fullscreenElement === element) void document.exitFullscreen().catch(() => {});
    };
  }, []);
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  async function fullScreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await dialog.current?.requestFullscreen();
    } catch {
      setFullScreenError('A tela cheia não está disponível. A apresentação continua nesta janela.');
    }
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="presentation-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.top}>
        <img
          src={`${import.meta.env.BASE_URL}brand/logo-soma.png`}
          alt="Rede Soma Drogarias"
          width="145"
          height="64"
        />
        <div>
          <button
            className="textButton"
            onClick={() => void fullScreen()}
            aria-label="Alternar tela cheia"
          >
            <Maximize2 />
          </button>
          <button className="buttonSecondary" onClick={onClose}>
            <X />
            Fechar
          </button>
        </div>
      </div>
      {fullScreenError && (
        <p className="notice" role="status">
          {fullScreenError}
        </p>
      )}
      <div className={styles.stage} aria-live="polite" aria-atomic="true">
        {remaining > 0 ? (
          <>
            <h1 id="presentation-title">Tudo pronto para revelar.</h1>
            <div className={styles.countdown}>{remaining}</div>
            <button className="textButton" onClick={() => setRemaining(0)}>
              Pular contagem
              <ArrowRight />
            </button>
          </>
        ) : showAll ? (
          <>
            <h1 id="presentation-title">Resultado do sorteio</h1>
            <div className={styles.all}>
              {entries.map((entry, i) => (
                <section key={i}>
                  <h2>{entry.title}</h2>
                  <ul>
                    {entry.names.map((name, n) => (
                      <li key={n}>{name}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        ) : current ? (
          <>
            <p className={styles.position}>
              {index + 1} de {entries.length}
            </p>
            <h1 id="presentation-title">{current.title}</h1>
            <ul className={result.mode === 'teams' ? styles.teamNames : styles.single}>
              {current.names.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      <div className={styles.bottom}>
        <p>Um resultado já calculado. Agora, só a revelação.</p>
        {remaining === 0 && (
          <div>
            <button
              className="buttonSecondary"
              disabled={index === 0 && !showAll}
              onClick={() => {
                if (showAll) setShowAll(false);
                else setIndex((value) => value - 1);
              }}
            >
              <ArrowLeft />
              Anterior
            </button>
            {!showAll && (
              <button
                className="button"
                onClick={() => {
                  if (index < entries.length - 1) setIndex((value) => value + 1);
                  else setShowAll(true);
                }}
              >
                {index < entries.length - 1 ? 'Próximo' : 'Ver todos'}
                <ArrowRight />
              </button>
            )}
            {!showAll && index < entries.length - 1 && (
              <button className="textButton" onClick={() => setShowAll(true)}>
                Mostrar todos
              </button>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
