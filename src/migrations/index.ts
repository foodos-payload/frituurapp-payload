import * as migration_20241223_082756 from './20241223_082756';
import * as migration_20241223_102117 from './20241223_102117';
import * as migration_20241223_123719 from './20241223_123719';
import * as migration_20241223_133453 from './20241223_133453';
import * as migration_20241223_134831 from './20241223_134831';
import * as migration_20241223_182334 from './20241223_182334';
import * as migration_20241224_112439 from './20241224_112439';
import * as migration_20241224_114347 from './20241224_114347';
import * as migration_20241226_072611 from './20241226_072611';
import * as migration_20241226_083710 from './20241226_083710';
import * as migration_20241226_083731 from './20241226_083731';
import * as migration_20241226_085457 from './20241226_085457';
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
    up: migration_20241224_112439.up,
    down: migration_20241224_112439.down,
    name: '20241224_112439',
  },
  {
    up: migration_20241224_114347.up,
    down: migration_20241224_114347.down,
    name: '20241224_114347',
  },
  {
    up: migration_20241226_072611.up,
    down: migration_20241226_072611.down,
    name: '20241226_072611',
  },
  {
    up: migration_20241226_083710.up,
    down: migration_20241226_083710.down,
    name: '20241226_083710',
  },
  {
    up: migration_20241226_083731.up,
    down: migration_20241226_083731.down,
    name: '20241226_083731',
  },
  {
    up: migration_20241226_085457.up,
    down: migration_20241226_085457.down,
    name: '20241226_085457',
  },
  {
    up: migration_seed.up,
    down: migration_seed.down,
    name: 'seed'
  },
];
