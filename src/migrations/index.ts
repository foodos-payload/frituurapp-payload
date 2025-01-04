import * as migration_20250104_083905 from './20250104_083905';
import * as migration_seed from './seed';

export const migrations = [
  {
    up: migration_20250104_083905.up,
    down: migration_20250104_083905.down,
    name: '20250104_083905',
  },
  {
    up: migration_seed.up,
    down: migration_seed.down,
    name: 'seed'
  },
];
