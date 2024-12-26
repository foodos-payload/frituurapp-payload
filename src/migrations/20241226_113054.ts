import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ALTER COLUMN "filename" DROP NOT NULL;
  ALTER TABLE "media" ADD COLUMN "s3_url" varchar NOT NULL;
  ALTER TABLE "media" ADD COLUMN "blurhash" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ALTER COLUMN "filename" SET NOT NULL;
  ALTER TABLE "media" DROP COLUMN IF EXISTS "s3_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "blurhash";`)
}
