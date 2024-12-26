import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_fulfillment_methods_method_type" AS ENUM('delivery', 'takeaway', 'dine_in');
  CREATE TYPE "public"."enum_timeslots_days_day" AS ENUM('1', '2', '3', '4', '5', '6', '7');
  CREATE TYPE "public"."enum_customer_loyalty_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_coupons_value_type" AS ENUM('percentage', 'fixed');
  CREATE TYPE "public"."enum_orders_order_type" AS ENUM('pos', 'web', 'kiosk');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending_payment', 'pending', 'processing', 'completed', 'cancelled');
  CREATE TABLE IF NOT EXISTS "shops_exceptionally_closed_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"reason" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "fulfillment_methods" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"method_type" "enum_fulfillment_methods_method_type" NOT NULL,
  	"delivery_fee" numeric DEFAULT 0,
  	"minimum_order" numeric DEFAULT 0,
  	"extra_cost_per_km" numeric DEFAULT 0,
  	"enabled" boolean DEFAULT true,
  	"settings_delivery_radius" numeric,
  	"settings_pickup_instructions" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fulfillment_methods_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "timeslots_days_time_ranges" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"interval_minutes" numeric DEFAULT 15 NOT NULL,
  	"max_orders" numeric,
  	"status" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "timeslots_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "enum_timeslots_days_day" NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "timeslots" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"method_id_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "timeslots_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"reservation_name" varchar NOT NULL,
  	"active_days_monday" boolean DEFAULT false,
  	"active_days_tuesday" boolean DEFAULT false,
  	"active_days_wednesday" boolean DEFAULT false,
  	"active_days_thursday" boolean DEFAULT false,
  	"active_days_friday" boolean DEFAULT false,
  	"active_days_saturday" boolean DEFAULT false,
  	"active_days_sunday" boolean DEFAULT false,
  	"reservation_period_start_date" timestamp(3) with time zone NOT NULL,
  	"reservation_period_end_date" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_entries" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"time" varchar NOT NULL,
  	"persons" numeric NOT NULL,
  	"table_id" uuid NOT NULL,
  	"special_requests" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_entries_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_exceptions" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"exception_date" timestamp(3) with time zone NOT NULL,
  	"reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_exceptions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_holidays" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"reason" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_holidays_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "fully_booked_days" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fully_booked_days_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "printers_printer_settings_kiosk_printers" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kiosk_id" varchar,
  	"kiosk_printnode_id" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "printers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"printername_id" uuid NOT NULL,
  	"printer_settings_default_printer_id" varchar DEFAULT '73861244',
  	"printer_settings_print_enabled" boolean DEFAULT true,
  	"printer_settings_kitchen_enabled" boolean DEFAULT true,
  	"printer_settings_customer_enabled" boolean DEFAULT false,
  	"printer_settings_kitchen_ticket_amount" numeric DEFAULT 2,
  	"printer_settings_kitchen_printer_id" varchar DEFAULT '73861244',
  	"printer_settings_print_category_headers" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "customers_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag_id" varchar,
  	"tag_type" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "customers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"firstname" varchar NOT NULL,
  	"lastname" varchar NOT NULL,
  	"company_name" varchar,
  	"street" varchar,
  	"house_number" varchar,
  	"city" varchar,
  	"postal_code" varchar,
  	"vat_number" varchar,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"modtime" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "customers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "customer_credits" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"customerid_id" uuid NOT NULL,
  	"value" numeric NOT NULL,
  	"tagid" varchar,
  	"tagtype" varchar,
  	"productid_id" uuid,
  	"categoryid_id" uuid,
  	"paymenttype_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "customer_credits_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "customer_loyalty" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"program_name" varchar NOT NULL,
  	"points_per_purchase" numeric NOT NULL,
  	"redeem_ratio" numeric NOT NULL,
  	"status" "enum_customer_loyalty_status" NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "customer_loyalty_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "coupons" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"barcode" varchar NOT NULL,
  	"value" numeric NOT NULL,
  	"value_type" "enum_coupons_value_type" NOT NULL,
  	"valid_from" timestamp(3) with time zone NOT NULL,
  	"valid_until" timestamp(3) with time zone NOT NULL,
  	"max_uses" numeric,
  	"uses" numeric DEFAULT 0,
  	"used" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "coupons_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "gift_vouchers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"barcode" varchar NOT NULL,
  	"value" numeric NOT NULL,
  	"valid_from" timestamp(3) with time zone NOT NULL,
  	"valid_until" timestamp(3) with time zone NOT NULL,
  	"used" boolean DEFAULT false,
  	"payment_type_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "gift_vouchers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "orders_order_details_subproducts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"subproduct_id" uuid NOT NULL,
  	"price" numeric NOT NULL,
  	"tax" numeric NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "orders_order_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" numeric NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" uuid NOT NULL,
  	"quantity" numeric NOT NULL,
  	"price" numeric NOT NULL,
  	"tax" numeric NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "orders_payments" (
  	"_order" integer NOT NULL,
  	"_parent_id" numeric NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"payment_method_id" uuid NOT NULL,
  	"amount" numeric NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "orders" (
  	"id" numeric PRIMARY KEY NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"temp_ord_nr" numeric NOT NULL,
  	"order_type" "enum_orders_order_type" NOT NULL,
  	"customer_id" uuid,
  	"total_price" numeric NOT NULL,
  	"order_date" timestamp(3) with time zone NOT NULL,
  	"order_time" varchar NOT NULL,
  	"order_expected_date" timestamp(3) with time zone,
  	"order_expected_time" varchar,
  	"table_number" numeric,
  	"fulfillment_method_id" uuid,
  	"status" "enum_orders_status" DEFAULT 'pending',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "orders_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" numeric NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  ALTER TABLE "shops" ADD COLUMN "company_details_company_name" varchar NOT NULL;
  ALTER TABLE "shops" ADD COLUMN "company_details_street" varchar;
  ALTER TABLE "shops" ADD COLUMN "company_details_house_number" varchar;
  ALTER TABLE "shops" ADD COLUMN "company_details_city" varchar;
  ALTER TABLE "shops" ADD COLUMN "company_details_postal" varchar;
  ALTER TABLE "shops" ADD COLUMN "company_details_vat_nr" varchar;
  ALTER TABLE "shops" ADD COLUMN "company_details_website_url" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "fulfillment_methods_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "timeslots_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reservation_settings_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reservation_entries_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reservation_exceptions_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reservation_holidays_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "fully_booked_days_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "printers_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customers_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customer_credits_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customer_loyalty_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "coupons_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "gift_vouchers_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" numeric;
  DO $$ BEGIN
   ALTER TABLE "shops_exceptionally_closed_days" ADD CONSTRAINT "shops_exceptionally_closed_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "fulfillment_methods" ADD CONSTRAINT "fulfillment_methods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "fulfillment_methods_rels" ADD CONSTRAINT "fulfillment_methods_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."fulfillment_methods"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "fulfillment_methods_rels" ADD CONSTRAINT "fulfillment_methods_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots_days_time_ranges" ADD CONSTRAINT "timeslots_days_time_ranges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."timeslots_days"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots_days" ADD CONSTRAINT "timeslots_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."timeslots"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots" ADD CONSTRAINT "timeslots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots" ADD CONSTRAINT "timeslots_method_id_id_fulfillment_methods_id_fk" FOREIGN KEY ("method_id_id") REFERENCES "public"."fulfillment_methods"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots_rels" ADD CONSTRAINT "timeslots_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."timeslots"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots_rels" ADD CONSTRAINT "timeslots_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_settings" ADD CONSTRAINT "reservation_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_settings_rels" ADD CONSTRAINT "reservation_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reservation_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_settings_rels" ADD CONSTRAINT "reservation_settings_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_entries" ADD CONSTRAINT "reservation_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_entries" ADD CONSTRAINT "reservation_entries_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_entries_rels" ADD CONSTRAINT "reservation_entries_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reservation_entries"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_entries_rels" ADD CONSTRAINT "reservation_entries_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_exceptions" ADD CONSTRAINT "reservation_exceptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_exceptions_rels" ADD CONSTRAINT "reservation_exceptions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reservation_exceptions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_exceptions_rels" ADD CONSTRAINT "reservation_exceptions_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_holidays" ADD CONSTRAINT "reservation_holidays_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_holidays_rels" ADD CONSTRAINT "reservation_holidays_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reservation_holidays"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_holidays_rels" ADD CONSTRAINT "reservation_holidays_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "fully_booked_days" ADD CONSTRAINT "fully_booked_days_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "fully_booked_days_rels" ADD CONSTRAINT "fully_booked_days_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."fully_booked_days"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "fully_booked_days_rels" ADD CONSTRAINT "fully_booked_days_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "printers_printer_settings_kiosk_printers" ADD CONSTRAINT "printers_printer_settings_kiosk_printers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."printers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "printers" ADD CONSTRAINT "printers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "printers" ADD CONSTRAINT "printers_printername_id_shops_id_fk" FOREIGN KEY ("printername_id") REFERENCES "public"."shops"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customers_tags" ADD CONSTRAINT "customers_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customers_rels" ADD CONSTRAINT "customers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customers_rels" ADD CONSTRAINT "customers_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_customerid_id_customers_id_fk" FOREIGN KEY ("customerid_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_productid_id_products_id_fk" FOREIGN KEY ("productid_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_categoryid_id_categories_id_fk" FOREIGN KEY ("categoryid_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_paymenttype_id_payment_methods_id_fk" FOREIGN KEY ("paymenttype_id") REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customer_credits_rels" ADD CONSTRAINT "customer_credits_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."customer_credits"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customer_credits_rels" ADD CONSTRAINT "customer_credits_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customer_loyalty" ADD CONSTRAINT "customer_loyalty_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customer_loyalty_rels" ADD CONSTRAINT "customer_loyalty_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."customer_loyalty"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customer_loyalty_rels" ADD CONSTRAINT "customer_loyalty_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "coupons" ADD CONSTRAINT "coupons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "gift_vouchers" ADD CONSTRAINT "gift_vouchers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "gift_vouchers" ADD CONSTRAINT "gift_vouchers_payment_type_id_payment_methods_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "gift_vouchers_rels" ADD CONSTRAINT "gift_vouchers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gift_vouchers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "gift_vouchers_rels" ADD CONSTRAINT "gift_vouchers_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders_order_details_subproducts" ADD CONSTRAINT "orders_order_details_subproducts_subproduct_id_subproducts_id_fk" FOREIGN KEY ("subproduct_id") REFERENCES "public"."subproducts"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders_order_details_subproducts" ADD CONSTRAINT "orders_order_details_subproducts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders_order_details"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders_order_details" ADD CONSTRAINT "orders_order_details_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders_order_details" ADD CONSTRAINT "orders_order_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders_payments" ADD CONSTRAINT "orders_payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders_payments" ADD CONSTRAINT "orders_payments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_fulfillment_method_id_fulfillment_methods_id_fk" FOREIGN KEY ("fulfillment_method_id") REFERENCES "public"."fulfillment_methods"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "shops_exceptionally_closed_days_order_idx" ON "shops_exceptionally_closed_days" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "shops_exceptionally_closed_days_parent_id_idx" ON "shops_exceptionally_closed_days" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fulfillment_methods_tenant_idx" ON "fulfillment_methods" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "fulfillment_methods_updated_at_idx" ON "fulfillment_methods" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "fulfillment_methods_created_at_idx" ON "fulfillment_methods" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "fulfillment_methods_rels_order_idx" ON "fulfillment_methods_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "fulfillment_methods_rels_parent_idx" ON "fulfillment_methods_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "fulfillment_methods_rels_path_idx" ON "fulfillment_methods_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "fulfillment_methods_rels_shops_id_idx" ON "fulfillment_methods_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "timeslots_days_time_ranges_order_idx" ON "timeslots_days_time_ranges" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "timeslots_days_time_ranges_parent_id_idx" ON "timeslots_days_time_ranges" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_days_order_idx" ON "timeslots_days" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "timeslots_days_parent_id_idx" ON "timeslots_days" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_tenant_idx" ON "timeslots" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "timeslots_method_id_idx" ON "timeslots" USING btree ("method_id_id");
  CREATE INDEX IF NOT EXISTS "timeslots_updated_at_idx" ON "timeslots" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "timeslots_created_at_idx" ON "timeslots" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "timeslots_rels_order_idx" ON "timeslots_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "timeslots_rels_parent_idx" ON "timeslots_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_rels_path_idx" ON "timeslots_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "timeslots_rels_shops_id_idx" ON "timeslots_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "reservation_settings_tenant_idx" ON "reservation_settings" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "reservation_settings_updated_at_idx" ON "reservation_settings" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "reservation_settings_created_at_idx" ON "reservation_settings" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "reservation_settings_rels_order_idx" ON "reservation_settings_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "reservation_settings_rels_parent_idx" ON "reservation_settings_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "reservation_settings_rels_path_idx" ON "reservation_settings_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "reservation_settings_rels_shops_id_idx" ON "reservation_settings_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "reservation_entries_tenant_idx" ON "reservation_entries" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "reservation_entries_table_idx" ON "reservation_entries" USING btree ("table_id");
  CREATE INDEX IF NOT EXISTS "reservation_entries_updated_at_idx" ON "reservation_entries" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "reservation_entries_created_at_idx" ON "reservation_entries" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "reservation_entries_rels_order_idx" ON "reservation_entries_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "reservation_entries_rels_parent_idx" ON "reservation_entries_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "reservation_entries_rels_path_idx" ON "reservation_entries_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "reservation_entries_rels_shops_id_idx" ON "reservation_entries_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "reservation_exceptions_tenant_idx" ON "reservation_exceptions" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "reservation_exceptions_updated_at_idx" ON "reservation_exceptions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "reservation_exceptions_created_at_idx" ON "reservation_exceptions" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "reservation_exceptions_rels_order_idx" ON "reservation_exceptions_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "reservation_exceptions_rels_parent_idx" ON "reservation_exceptions_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "reservation_exceptions_rels_path_idx" ON "reservation_exceptions_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "reservation_exceptions_rels_shops_id_idx" ON "reservation_exceptions_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "reservation_holidays_tenant_idx" ON "reservation_holidays" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "reservation_holidays_updated_at_idx" ON "reservation_holidays" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "reservation_holidays_created_at_idx" ON "reservation_holidays" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "reservation_holidays_rels_order_idx" ON "reservation_holidays_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "reservation_holidays_rels_parent_idx" ON "reservation_holidays_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "reservation_holidays_rels_path_idx" ON "reservation_holidays_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "reservation_holidays_rels_shops_id_idx" ON "reservation_holidays_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "fully_booked_days_tenant_idx" ON "fully_booked_days" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "fully_booked_days_updated_at_idx" ON "fully_booked_days" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "fully_booked_days_created_at_idx" ON "fully_booked_days" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "fully_booked_days_rels_order_idx" ON "fully_booked_days_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "fully_booked_days_rels_parent_idx" ON "fully_booked_days_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "fully_booked_days_rels_path_idx" ON "fully_booked_days_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "fully_booked_days_rels_shops_id_idx" ON "fully_booked_days_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "printers_printer_settings_kiosk_printers_order_idx" ON "printers_printer_settings_kiosk_printers" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "printers_printer_settings_kiosk_printers_parent_id_idx" ON "printers_printer_settings_kiosk_printers" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "printers_tenant_idx" ON "printers" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "printers_printername_idx" ON "printers" USING btree ("printername_id");
  CREATE INDEX IF NOT EXISTS "printers_updated_at_idx" ON "printers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "printers_created_at_idx" ON "printers" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "customers_tags_order_idx" ON "customers_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "customers_tags_parent_id_idx" ON "customers_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "customers_tenant_idx" ON "customers" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "customers_rels_order_idx" ON "customers_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "customers_rels_parent_idx" ON "customers_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "customers_rels_path_idx" ON "customers_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "customers_rels_shops_id_idx" ON "customers_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "customer_credits_tenant_idx" ON "customer_credits" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "customer_credits_customerid_idx" ON "customer_credits" USING btree ("customerid_id");
  CREATE INDEX IF NOT EXISTS "customer_credits_productid_idx" ON "customer_credits" USING btree ("productid_id");
  CREATE INDEX IF NOT EXISTS "customer_credits_categoryid_idx" ON "customer_credits" USING btree ("categoryid_id");
  CREATE INDEX IF NOT EXISTS "customer_credits_paymenttype_idx" ON "customer_credits" USING btree ("paymenttype_id");
  CREATE INDEX IF NOT EXISTS "customer_credits_updated_at_idx" ON "customer_credits" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "customer_credits_created_at_idx" ON "customer_credits" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "customer_credits_rels_order_idx" ON "customer_credits_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "customer_credits_rels_parent_idx" ON "customer_credits_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "customer_credits_rels_path_idx" ON "customer_credits_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "customer_credits_rels_shops_id_idx" ON "customer_credits_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "customer_loyalty_tenant_idx" ON "customer_loyalty" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "customer_loyalty_updated_at_idx" ON "customer_loyalty" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "customer_loyalty_created_at_idx" ON "customer_loyalty" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "customer_loyalty_rels_order_idx" ON "customer_loyalty_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "customer_loyalty_rels_parent_idx" ON "customer_loyalty_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "customer_loyalty_rels_path_idx" ON "customer_loyalty_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "customer_loyalty_rels_shops_id_idx" ON "customer_loyalty_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "coupons_tenant_idx" ON "coupons" USING btree ("tenant_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "coupons_barcode_idx" ON "coupons" USING btree ("barcode");
  CREATE INDEX IF NOT EXISTS "coupons_updated_at_idx" ON "coupons" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "coupons_created_at_idx" ON "coupons" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "coupons_rels_order_idx" ON "coupons_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "coupons_rels_parent_idx" ON "coupons_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "coupons_rels_path_idx" ON "coupons_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "coupons_rels_shops_id_idx" ON "coupons_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "gift_vouchers_tenant_idx" ON "gift_vouchers" USING btree ("tenant_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "gift_vouchers_barcode_idx" ON "gift_vouchers" USING btree ("barcode");
  CREATE INDEX IF NOT EXISTS "gift_vouchers_payment_type_idx" ON "gift_vouchers" USING btree ("payment_type_id");
  CREATE INDEX IF NOT EXISTS "gift_vouchers_updated_at_idx" ON "gift_vouchers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "gift_vouchers_created_at_idx" ON "gift_vouchers" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "gift_vouchers_rels_order_idx" ON "gift_vouchers_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "gift_vouchers_rels_parent_idx" ON "gift_vouchers_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "gift_vouchers_rels_path_idx" ON "gift_vouchers_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "gift_vouchers_rels_shops_id_idx" ON "gift_vouchers_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "orders_order_details_subproducts_order_idx" ON "orders_order_details_subproducts" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "orders_order_details_subproducts_parent_id_idx" ON "orders_order_details_subproducts" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "orders_order_details_subproducts_subproduct_idx" ON "orders_order_details_subproducts" USING btree ("subproduct_id");
  CREATE INDEX IF NOT EXISTS "orders_order_details_order_idx" ON "orders_order_details" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "orders_order_details_parent_id_idx" ON "orders_order_details" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "orders_order_details_product_idx" ON "orders_order_details" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "orders_payments_order_idx" ON "orders_payments" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "orders_payments_parent_id_idx" ON "orders_payments" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "orders_payments_payment_method_idx" ON "orders_payments" USING btree ("payment_method_id");
  CREATE INDEX IF NOT EXISTS "orders_tenant_idx" ON "orders" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX IF NOT EXISTS "orders_fulfillment_method_idx" ON "orders" USING btree ("fulfillment_method_id");
  CREATE INDEX IF NOT EXISTS "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "orders_rels_order_idx" ON "orders_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "orders_rels_parent_idx" ON "orders_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "orders_rels_path_idx" ON "orders_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "orders_rels_shops_id_idx" ON "orders_rels" USING btree ("shops_id");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fulfillment_methods_fk" FOREIGN KEY ("fulfillment_methods_id") REFERENCES "public"."fulfillment_methods"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_timeslots_fk" FOREIGN KEY ("timeslots_id") REFERENCES "public"."timeslots"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservation_settings_fk" FOREIGN KEY ("reservation_settings_id") REFERENCES "public"."reservation_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservation_entries_fk" FOREIGN KEY ("reservation_entries_id") REFERENCES "public"."reservation_entries"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservation_exceptions_fk" FOREIGN KEY ("reservation_exceptions_id") REFERENCES "public"."reservation_exceptions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservation_holidays_fk" FOREIGN KEY ("reservation_holidays_id") REFERENCES "public"."reservation_holidays"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fully_booked_days_fk" FOREIGN KEY ("fully_booked_days_id") REFERENCES "public"."fully_booked_days"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_printers_fk" FOREIGN KEY ("printers_id") REFERENCES "public"."printers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customer_credits_fk" FOREIGN KEY ("customer_credits_id") REFERENCES "public"."customer_credits"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customer_loyalty_fk" FOREIGN KEY ("customer_loyalty_id") REFERENCES "public"."customer_loyalty"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupons_fk" FOREIGN KEY ("coupons_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gift_vouchers_fk" FOREIGN KEY ("gift_vouchers_id") REFERENCES "public"."gift_vouchers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_fulfillment_methods_id_idx" ON "payload_locked_documents_rels" USING btree ("fulfillment_methods_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_timeslots_id_idx" ON "payload_locked_documents_rels" USING btree ("timeslots_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reservation_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("reservation_settings_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reservation_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("reservation_entries_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reservation_exceptions_id_idx" ON "payload_locked_documents_rels" USING btree ("reservation_exceptions_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reservation_holidays_id_idx" ON "payload_locked_documents_rels" USING btree ("reservation_holidays_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_fully_booked_days_id_idx" ON "payload_locked_documents_rels" USING btree ("fully_booked_days_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_printers_id_idx" ON "payload_locked_documents_rels" USING btree ("printers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_customer_credits_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_credits_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_customer_loyalty_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_loyalty_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_coupons_id_idx" ON "payload_locked_documents_rels" USING btree ("coupons_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_gift_vouchers_id_idx" ON "payload_locked_documents_rels" USING btree ("gift_vouchers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  ALTER TABLE "payment_methods" DROP COLUMN IF EXISTS "payment_name";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "shops_exceptionally_closed_days" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fulfillment_methods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fulfillment_methods_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "timeslots_days_time_ranges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "timeslots_days" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "timeslots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "timeslots_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reservation_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reservation_settings_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reservation_entries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reservation_entries_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reservation_exceptions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reservation_exceptions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reservation_holidays" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reservation_holidays_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fully_booked_days" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fully_booked_days_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "printers_printer_settings_kiosk_printers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "printers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customers_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customers_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customer_credits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customer_credits_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customer_loyalty" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customer_loyalty_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coupons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coupons_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gift_vouchers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gift_vouchers_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_order_details_subproducts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_order_details" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_payments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "shops_exceptionally_closed_days" CASCADE;
  DROP TABLE "fulfillment_methods" CASCADE;
  DROP TABLE "fulfillment_methods_rels" CASCADE;
  DROP TABLE "timeslots_days_time_ranges" CASCADE;
  DROP TABLE "timeslots_days" CASCADE;
  DROP TABLE "timeslots" CASCADE;
  DROP TABLE "timeslots_rels" CASCADE;
  DROP TABLE "reservation_settings" CASCADE;
  DROP TABLE "reservation_settings_rels" CASCADE;
  DROP TABLE "reservation_entries" CASCADE;
  DROP TABLE "reservation_entries_rels" CASCADE;
  DROP TABLE "reservation_exceptions" CASCADE;
  DROP TABLE "reservation_exceptions_rels" CASCADE;
  DROP TABLE "reservation_holidays" CASCADE;
  DROP TABLE "reservation_holidays_rels" CASCADE;
  DROP TABLE "fully_booked_days" CASCADE;
  DROP TABLE "fully_booked_days_rels" CASCADE;
  DROP TABLE "printers_printer_settings_kiosk_printers" CASCADE;
  DROP TABLE "printers" CASCADE;
  DROP TABLE "customers_tags" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "customers_rels" CASCADE;
  DROP TABLE "customer_credits" CASCADE;
  DROP TABLE "customer_credits_rels" CASCADE;
  DROP TABLE "customer_loyalty" CASCADE;
  DROP TABLE "customer_loyalty_rels" CASCADE;
  DROP TABLE "coupons" CASCADE;
  DROP TABLE "coupons_rels" CASCADE;
  DROP TABLE "gift_vouchers" CASCADE;
  DROP TABLE "gift_vouchers_rels" CASCADE;
  DROP TABLE "orders_order_details_subproducts" CASCADE;
  DROP TABLE "orders_order_details" CASCADE;
  DROP TABLE "orders_payments" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "orders_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_fulfillment_methods_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_timeslots_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reservation_settings_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reservation_entries_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reservation_exceptions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reservation_holidays_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_fully_booked_days_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_printers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customer_credits_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customer_loyalty_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_coupons_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_gift_vouchers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_fulfillment_methods_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_timeslots_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_reservation_settings_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_reservation_entries_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_reservation_exceptions_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_reservation_holidays_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_fully_booked_days_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_printers_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_customers_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_customer_credits_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_customer_loyalty_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_coupons_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_gift_vouchers_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_orders_id_idx";
  ALTER TABLE "payment_methods" ADD COLUMN "payment_name" varchar NOT NULL;
  ALTER TABLE "shops" DROP COLUMN IF EXISTS "company_details_company_name";
  ALTER TABLE "shops" DROP COLUMN IF EXISTS "company_details_street";
  ALTER TABLE "shops" DROP COLUMN IF EXISTS "company_details_house_number";
  ALTER TABLE "shops" DROP COLUMN IF EXISTS "company_details_city";
  ALTER TABLE "shops" DROP COLUMN IF EXISTS "company_details_postal";
  ALTER TABLE "shops" DROP COLUMN IF EXISTS "company_details_vat_nr";
  ALTER TABLE "shops" DROP COLUMN IF EXISTS "company_details_website_url";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "fulfillment_methods_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "timeslots_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reservation_settings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reservation_entries_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reservation_exceptions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reservation_holidays_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "fully_booked_days_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "printers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "customers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "customer_credits_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "customer_loyalty_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "coupons_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "gift_vouchers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "orders_id";
  DROP TYPE "public"."enum_fulfillment_methods_method_type";
  DROP TYPE "public"."enum_timeslots_days_day";
  DROP TYPE "public"."enum_customer_loyalty_status";
  DROP TYPE "public"."enum_coupons_value_type";
  DROP TYPE "public"."enum_orders_order_type";
  DROP TYPE "public"."enum_orders_status";`)
}
