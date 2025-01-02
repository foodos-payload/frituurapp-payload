import * as migration_20250101_120017 from './20250101_120017';
import * as migration_seed from './seed';

export const migrations = [
  {
    up: migration_20250101_120017.up,
    down: migration_20250101_120017.down,
    name: '20250101_120017',
  },
  {
    up: migration_seed.up,
    down: migration_seed.down,
    name: 'seed'
  },
];
