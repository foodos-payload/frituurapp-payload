import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_payment_methods_multisafepay_settings_methods" AS ENUM('MSP_Bancontact', 'MSP_Visa', 'MSP_Mastercard', 'MSP_iDeal');
  CREATE TYPE "public"."enum_payment_methods_provider" AS ENUM('multisafepay', 'cash_on_delivery');
  CREATE TYPE "public"."enum_tables_status" AS ENUM('0', '1', '2');
  CREATE TABLE IF NOT EXISTS "payment_methods_multisafepay_settings_methods" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_payment_methods_multisafepay_settings_methods",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payment_methods" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"payment_name" varchar NOT NULL,
  	"provider" "enum_payment_methods_provider" NOT NULL,
  	"multisafepay_settings_enable_test_mode" boolean DEFAULT false,
  	"multisafepay_settings_live_api_key" varchar,
  	"multisafepay_settings_test_api_key" varchar,
  	"enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payment_methods_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "tables" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"table_num" numeric NOT NULL,
  	"status" "enum_tables_status" DEFAULT '0',
  	"capacity" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "tables_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payment_methods_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tables_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "payment_methods_multisafepay_settings_methods" ADD CONSTRAINT "payment_methods_multisafepay_settings_methods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payment_methods"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payment_methods_rels" ADD CONSTRAINT "payment_methods_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payment_methods"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payment_methods_rels" ADD CONSTRAINT "payment_methods_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "tables" ADD CONSTRAINT "tables_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "tables_rels" ADD CONSTRAINT "tables_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "tables_rels" ADD CONSTRAINT "tables_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payment_methods_multisafepay_settings_methods_order_idx" ON "payment_methods_multisafepay_settings_methods" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payment_methods_multisafepay_settings_methods_parent_idx" ON "payment_methods_multisafepay_settings_methods" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payment_methods_tenant_idx" ON "payment_methods" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "payment_methods_updated_at_idx" ON "payment_methods" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payment_methods_created_at_idx" ON "payment_methods" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payment_methods_rels_order_idx" ON "payment_methods_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payment_methods_rels_parent_idx" ON "payment_methods_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payment_methods_rels_path_idx" ON "payment_methods_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payment_methods_rels_shops_id_idx" ON "payment_methods_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "tables_tenant_idx" ON "tables" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "tables_updated_at_idx" ON "tables" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tables_created_at_idx" ON "tables" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "tables_rels_order_idx" ON "tables_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "tables_rels_parent_idx" ON "tables_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "tables_rels_path_idx" ON "tables_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "tables_rels_shops_id_idx" ON "tables_rels" USING btree ("shops_id");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payment_methods_fk" FOREIGN KEY ("payment_methods_id") REFERENCES "public"."payment_methods"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tables_fk" FOREIGN KEY ("tables_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_payment_methods_id_idx" ON "payload_locked_documents_rels" USING btree ("payment_methods_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tables_id_idx" ON "payload_locked_documents_rels" USING btree ("tables_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payment_methods_multisafepay_settings_methods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payment_methods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payment_methods_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tables_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payment_methods_multisafepay_settings_methods" CASCADE;
  DROP TABLE "payment_methods" CASCADE;
  DROP TABLE "payment_methods_rels" CASCADE;
  DROP TABLE "tables" CASCADE;
  DROP TABLE "tables_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payment_methods_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tables_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_payment_methods_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_tables_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payment_methods_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tables_id";
  DROP TYPE "public"."enum_payment_methods_multisafepay_settings_methods";
  DROP TYPE "public"."enum_payment_methods_provider";
  DROP TYPE "public"."enum_tables_status";`)
}
