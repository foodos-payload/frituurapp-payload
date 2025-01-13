import * as migration_20250113_163831 from './20250113_163831';
import * as migration_seed from './seed';

export const migrations = [
  {
    up: migration_20250113_163831.up,
    down: migration_20250113_163831.down,
    name: '20250113_163831',
  },
  {
    up: migration_seed.up,
    down: migration_seed.down,
    name: 'seed'
  },
];
