import { ArrowRight, Hash } from 'lucide-react';
import type { DrawDraft } from '../../platform/draft';
import styles from './DrawWorkbench.module.css';

type Range = Pick<DrawDraft, 'minimum' | 'maximum'>;
interface Props {
  value: Range;
  onChange: (changes: Partial<Range>) => void;
}

export function NumberRange({ value: { minimum, maximum }, onChange }: Props) {
  return (
    <>
      <div className={styles.sectionHeading}>
        <h2 id="entry-title">Qual é o intervalo?</h2>
        <Hash className={styles.sectionIcon} />
      </div>
      <p className={styles.sectionHint}>O primeiro e o último número também participam.</p>
      <div className={styles.rangeFields}>
        <label>
          <span className="fieldLabel">De</span>
          <input
            className="field"
            type="number"
            min="0"
            max="1000000000"
            value={minimum}
            onChange={(e) => onChange({ minimum: e.target.value })}
          />
        </label>
        <ArrowRight aria-hidden="true" />
        <label>
          <span className="fieldLabel">Até</span>
          <input
            className="field"
            type="number"
            min="0"
            max="1000000000"
            value={maximum}
            onChange={(e) => onChange({ maximum: e.target.value })}
          />
        </label>
      </div>
      <div className={styles.numberExplanation}>
        <div className={styles.numberLine}>
          <span>{minimum || '0'}</span>
          <span />
          <span>{maximum || '0'}</span>
        </div>
        <p>
          {minimum && maximum && Number(maximum) >= Number(minimum) ? (
            <>
              <strong>{(Number(maximum) - Number(minimum) + 1).toLocaleString('pt-BR')}</strong>{' '}
              números possíveis neste intervalo.
            </>
          ) : (
            'Defina um intervalo para começar.'
          )}
        </p>
      </div>
      <p className={styles.limit}>Números inteiros entre 0 e 1 bilhão.</p>
    </>
  );
}
