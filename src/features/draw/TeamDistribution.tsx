import { Users } from 'lucide-react';
import styles from './TeamDistribution.module.css';

interface Props {
  total: number;
  teamRule: 'count' | 'size';
  teamCount: number;
  valid: boolean;
  smallest: number;
  largest: number;
}

export function TeamDistribution({ total, teamRule, teamCount, valid, smallest, largest }: Props) {
  const visibleGroups = valid ? Math.min(teamCount, 4) : 0;
  const largerGroups = valid ? total % teamCount : 0;

  return (
    <div className={styles.distribution} aria-live="polite">
      <div className={styles.summary}>
        {!valid ? <Users aria-hidden="true" /> : null}
        <div>
          <strong>
            {valid
              ? `${teamCount} equipes de ${smallest === largest ? smallest : `${smallest} a ${largest}`} ${largest === 1 ? 'pessoa' : 'pessoas'}`
              : total < 2
                ? 'Equipes na medida certa'
                : 'Ajuste a divisão'}
          </strong>
          <p>
            {valid
              ? `${total} participantes, todos em uma equipe.`
              : total < 2
                ? 'Adicione pelo menos 2 nomes para ver a divisão.'
                : teamRule === 'size' && teamCount < 2
                  ? `Use no máximo ${total - 1} por equipe para formar ao menos 2 equipes.`
                  : `Escolha entre 2 e ${total} equipes.`}
          </p>
        </div>
      </div>
      {valid ? (
        <div className={styles.diagram} aria-hidden="true">
          <div className={styles.groups}>
            {Array.from({ length: visibleGroups }, (_, index) => {
              const count = index < largerGroups ? largest : smallest;
              return (
                <div className={styles.group} key={index}>
                  <span className={styles.groupLabel}>Equipe {index + 1}</span>
                  <div className={styles.groupQuantity}>
                    <span className={styles.dots}>
                      {Array.from({ length: Math.min(count, 8) }, (_, dot) => (
                        <i key={dot} />
                      ))}
                    </span>
                    <strong>{count}</strong>
                  </div>
                </div>
              );
            })}
          </div>
          {teamCount > visibleGroups ? (
            <span className={styles.remaining}>+{teamCount - visibleGroups} equipes</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
