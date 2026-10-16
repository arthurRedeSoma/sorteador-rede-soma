export interface Participant {
  id: string;
  name: string;
}

export type DrawRequest =
  | { mode: 'teams'; participants: Participant[]; teamCount: number }
  | { mode: 'names'; participants: Participant[]; count: number }
  | { mode: 'numbers'; min: number; max: number; count: number; allowRepeats: boolean };

export type DrawResult =
  | { mode: 'teams'; teams: Participant[][] }
  | { mode: 'names'; winners: Participant[] }
  | { mode: 'numbers'; numbers: number[] };

export interface RandomSource {
  nextInt(maxExclusive: number): number;
}

export interface BuildIdentity {
  version: string;
  commit: string;
}

export interface DrawRecordV1 {
  schemaVersion: 1;
  algorithmVersion: '1';
  id: string;
  createdAt: string;
  build: BuildIdentity;
  request: DrawRequest;
  result: DrawResult;
  choices: number[];
  digest: string;
}
