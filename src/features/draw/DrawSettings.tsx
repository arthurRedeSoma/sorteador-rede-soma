import { ChevronDown, Minus, Plus, Shuffle } from 'lucide-react';
import type { DrawDraft } from '../../platform/draft';
import { getTeamDistribution } from './prepareDraw';
import { TeamDistribution } from './TeamDistribution';
import styles from './DrawWorkbench.module.css';

type TeamOptions = Pick<DrawDraft, 'teamRule' | 'teamAmount'>;
interface TeamProps {
  value: TeamOptions;
  participantCount: number;
  onChange: (changes: Partial<TeamOptions>) => void;
}

export function TeamSettings({ value, participantCount: total, onChange }: TeamProps) {
  const { teamRule, teamAmount } = value;
  const { amount, teamCount, valid, smallest, largest } = getTeamDistribution(value, total);
  return (
    <>
      <fieldset className={styles.segmented}>
        <legend className="visuallyHidden">Distribuir por</legend>
        <label>
          <input
            type="radio"
            name="team-rule"
            checked={teamRule === 'count'}
            onChange={() => onChange({ teamRule: 'count', teamAmount: '2' })}
          />
          <span>Nº de equipes</span>
        </label>
        <label>
          <input
            type="radio"
            name="team-rule"
            checked={teamRule === 'size'}
            onChange={() => onChange({ teamRule: 'size', teamAmount: '4' })}
          />
          <span>Pessoas por equipe</span>
        </label>
      </fieldset>
      <label className="fieldLabel" htmlFor="team-amount">
        {teamRule === 'count' ? 'Quantidade de equipes' : 'Máximo de pessoas por equipe'}
      </label>
      <div className={styles.stepper}>
        <button
          aria-label="Diminuir quantidade"
          disabled={amount <= (teamRule === 'count' ? 2 : 1)}
          onClick={() =>
            onChange({ teamAmount: String(Math.max(teamRule === 'count' ? 2 : 1, amount - 1)) })
          }
        >
          <Minus />
        </button>
        <input
          id="team-amount"
          type="number"
          value={teamAmount}
          min={teamRule === 'count' ? 2 : 1}
          max="10000"
          onChange={(e) => onChange({ teamAmount: e.target.value })}
        />
        <button
          aria-label="Aumentar quantidade"
          disabled={amount >= 10000}
          onClick={() => onChange({ teamAmount: String(Math.min(10000, amount + 1)) })}
        >
          <Plus />
        </button>
      </div>
      <TeamDistribution
        total={total}
        teamRule={teamRule}
        teamCount={teamCount}
        valid={valid}
        smallest={smallest}
        largest={largest}
      />
    </>
  );
}

interface SelectionProps {
  mode: 'names' | 'numbers';
  count: string;
  allowRepeats: boolean;
  onCountChange: (count: string) => void;
  onRepeatsChange: (allowRepeats: boolean) => void;
}

export function SelectionSettings({
  mode,
  count,
  allowRepeats,
  onCountChange,
  onRepeatsChange,
}: SelectionProps) {
  return (
    <>
      <label className={styles.countLabel} htmlFor="draw-count">
        {mode === 'names' ? 'Quantos nomes sortear?' : 'Quantos números sortear?'}
      </label>
      <input
        id="draw-count"
        className="field"
        type="number"
        min="1"
        max="10000"
        value={count}
        onChange={(e) => onCountChange(e.target.value)}
      />
      {mode === 'numbers' ? (
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={allowRepeats}
            onChange={(e) => onRepeatsChange(e.target.checked)}
          />
          Permitir números repetidos
        </label>
      ) : (
        <p className={styles.settingHelp}>Cada inscrição pode sair uma única vez neste sorteio.</p>
      )}
      <div className={styles.distribution}>
        <Shuffle />
        <div>
          <strong>
            {mode === 'numbers'
              ? allowRepeats
                ? 'Com repetição'
                : 'Sem repetição'
              : 'Uma chance por inscrição'}
          </strong>
          <p>
            {mode === 'numbers'
              ? 'Até 10.000 resultados por sorteio.'
              : 'Os nomes saem na ordem sorteada.'}
          </p>
        </div>
      </div>
    </>
  );
}

type PresentationOptionsValue = Pick<DrawDraft, 'autoPresent' | 'countdown'>;
interface PresentationProps {
  value: PresentationOptionsValue;
  onChange: (changes: Partial<PresentationOptionsValue>) => void;
}

export function PresentationOptions({
  value: { autoPresent, countdown },
  onChange,
}: PresentationProps) {
  return (
    <details className={styles.presentationOptions}>
      <summary>
        Opções de apresentação
        <ChevronDown />
      </summary>
      <div>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={autoPresent}
            onChange={(e) => onChange({ autoPresent: e.target.checked })}
          />
          Abrir em modo apresentação
        </label>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={countdown}
            onChange={(e) => onChange({ countdown: e.target.checked })}
          />
          Contagem de 3 segundos
        </label>
        <p>A contagem só é usada no modo apresentação.</p>
      </div>
    </details>
  );
}
