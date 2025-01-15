import * as migration_20250115_024227_migration from './20250115_024227_migration';
import * as migration_20250115_024314_migration from './20250115_024314_migration';
import * as migration_20250115_024619_migration from './20250115_024619_migration';
import * as migration_seed from './seed';

export const migrations = [
  {
    up: migration_20250115_024227_migration.up,
    down: migration_20250115_024227_migration.down,
    name: '20250115_024227_migration',
  },
  {
    up: migration_20250115_024314_migration.up,
    down: migration_20250115_024314_migration.down,
    name: '20250115_024314_migration',
  },
  {
    up: migration_20250115_024619_migration.up,
    down: migration_20250115_024619_migration.down,
    name: '20250115_024619_migration',
  },
  {
    up: migration_seed.up,
    down: migration_seed.down,
    name: 'seed'
  },
];
