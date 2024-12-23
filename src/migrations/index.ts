import * as migration_20241223_082756 from './20241223_082756';
import * as migration_20241223_102117 from './20241223_102117';
import * as migration_20241223_123719 from './20241223_123719';
import * as migration_20241223_133453 from './20241223_133453';
import * as migration_20241223_134831 from './20241223_134831';
import * as migration_20241223_182334 from './20241223_182334';
import * as migration_seed from './seed';

export const migrations = [
  {
    up: migration_20241223_082756.up,
    down: migration_20241223_082756.down,
    name: '20241223_082756',
  },
  {
    up: migration_20241223_102117.up,
    down: migration_20241223_102117.down,
    name: '20241223_102117',
  },
  {
    up: migration_20241223_123719.up,
    down: migration_20241223_123719.down,
    name: '20241223_123719',
  },
  {
    up: migration_20241223_133453.up,
    down: migration_20241223_133453.down,
    name: '20241223_133453',
  },
  {
    up: migration_20241223_134831.up,
    down: migration_20241223_134831.down,
    name: '20241223_134831',
  },
  {
    up: migration_20241223_182334.up,
    down: migration_20241223_182334.down,
    name: '20241223_182334',
  },
  {
    up: migration_seed.up,
    down: migration_seed.down,
    name: 'seed'
  },
];
