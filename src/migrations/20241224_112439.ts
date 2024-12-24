import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_categories_status" AS ENUM('enabled', 'disabled');
  CREATE TYPE "public"."enum_subproducts_status" AS ENUM('enabled', 'disabled');
  CREATE TABLE IF NOT EXISTS "products_productpopups" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"popup_id" uuid NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "subproducts" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"name" varchar NOT NULL,
  	"price_unified" boolean DEFAULT true,
  	"price" numeric,
  	"price_dinein" numeric,
  	"price_takeaway" numeric,
  	"price_delivery" numeric,
  	"linked_product_enabled" boolean,
  	"linked_product_id" uuid,
  	"stock_enabled" boolean DEFAULT false,
  	"stock_quantity" numeric DEFAULT 0,
  	"tax" numeric,
  	"tax_table" numeric,
  	"image_url" varchar,
  	"modtime" numeric NOT NULL,
  	"deleted" boolean DEFAULT false,
  	"status" "enum_subproducts_status" DEFAULT 'enabled' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "subproducts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "productpopups" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"popup_title" varchar NOT NULL,
  	"product_id" uuid,
  	"multiselect" boolean DEFAULT false,
  	"required_option_cashregister" boolean DEFAULT false,
  	"required_option_webshop" boolean DEFAULT false,
  	"minimum_option" numeric DEFAULT 0,
  	"maximum_option" numeric DEFAULT 0,
  	"default_checked_subproduct_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "productpopups_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid,
  	"subproducts_id" uuid
  );
  
  ALTER TABLE "categories" ADD COLUMN "status" "enum_categories_status" DEFAULT 'enabled' NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subproducts_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "productpopups_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "products_productpopups" ADD CONSTRAINT "products_productpopups_popup_id_productpopups_id_fk" FOREIGN KEY ("popup_id") REFERENCES "public"."productpopups"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "products_productpopups" ADD CONSTRAINT "products_productpopups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "subproducts" ADD CONSTRAINT "subproducts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "subproducts" ADD CONSTRAINT "subproducts_linked_product_id_products_id_fk" FOREIGN KEY ("linked_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "subproducts_rels" ADD CONSTRAINT "subproducts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subproducts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "subproducts_rels" ADD CONSTRAINT "subproducts_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "productpopups" ADD CONSTRAINT "productpopups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "productpopups" ADD CONSTRAINT "productpopups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "productpopups" ADD CONSTRAINT "productpopups_default_checked_subproduct_id_subproducts_id_fk" FOREIGN KEY ("default_checked_subproduct_id") REFERENCES "public"."subproducts"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "productpopups_rels" ADD CONSTRAINT "productpopups_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."productpopups"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "productpopups_rels" ADD CONSTRAINT "productpopups_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "productpopups_rels" ADD CONSTRAINT "productpopups_rels_subproducts_fk" FOREIGN KEY ("subproducts_id") REFERENCES "public"."subproducts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "products_productpopups_order_idx" ON "products_productpopups" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "products_productpopups_parent_id_idx" ON "products_productpopups" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "products_productpopups_popup_idx" ON "products_productpopups" USING btree ("popup_id");
  CREATE INDEX IF NOT EXISTS "subproducts_tenant_idx" ON "subproducts" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "subproducts_linked_product_idx" ON "subproducts" USING btree ("linked_product_id");
  CREATE INDEX IF NOT EXISTS "subproducts_updated_at_idx" ON "subproducts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "subproducts_created_at_idx" ON "subproducts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "subproducts_rels_order_idx" ON "subproducts_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "subproducts_rels_parent_idx" ON "subproducts_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "subproducts_rels_path_idx" ON "subproducts_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "subproducts_rels_shops_id_idx" ON "subproducts_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "productpopups_tenant_idx" ON "productpopups" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "productpopups_product_idx" ON "productpopups" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "productpopups_default_checked_subproduct_idx" ON "productpopups" USING btree ("default_checked_subproduct_id");
  CREATE INDEX IF NOT EXISTS "productpopups_updated_at_idx" ON "productpopups" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "productpopups_created_at_idx" ON "productpopups" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "productpopups_rels_order_idx" ON "productpopups_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "productpopups_rels_parent_idx" ON "productpopups_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "productpopups_rels_path_idx" ON "productpopups_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "productpopups_rels_shops_id_idx" ON "productpopups_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "productpopups_rels_subproducts_id_idx" ON "productpopups_rels" USING btree ("subproducts_id");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subproducts_fk" FOREIGN KEY ("subproducts_id") REFERENCES "public"."subproducts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_productpopups_fk" FOREIGN KEY ("productpopups_id") REFERENCES "public"."productpopups"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subproducts_id_idx" ON "payload_locked_documents_rels" USING btree ("subproducts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_productpopups_id_idx" ON "payload_locked_documents_rels" USING btree ("productpopups_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_productpopups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subproducts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subproducts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "productpopups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "productpopups_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_productpopups" CASCADE;
  DROP TABLE "subproducts" CASCADE;
  DROP TABLE "subproducts_rels" CASCADE;
  DROP TABLE "productpopups" CASCADE;
  DROP TABLE "productpopups_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subproducts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_productpopups_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_subproducts_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_productpopups_id_idx";
  ALTER TABLE "categories" DROP COLUMN IF EXISTS "status";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "subproducts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "productpopups_id";
  DROP TYPE "public"."enum_categories_status";
  DROP TYPE "public"."enum_subproducts_status";`)
}
