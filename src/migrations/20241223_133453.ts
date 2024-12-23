import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "tenants_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar NOT NULL
  );
  
  DO $$ BEGIN
   ALTER TABLE "tenants_domains" ADD CONSTRAINT "tenants_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "tenants_domains_order_idx" ON "tenants_domains" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "tenants_domains_parent_id_idx" ON "tenants_domains" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tenants_domains" CASCADE;`)
}
