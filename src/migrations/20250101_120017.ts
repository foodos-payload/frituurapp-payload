import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('nl', 'en', 'de', 'fr');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('super-admin', 'user');
  CREATE TYPE "public"."enum_users_tenants_roles" AS ENUM('tenant-admin', 'tenant-viewer');
  CREATE TYPE "public"."enum_payment_methods_multisafepay_settings_methods" AS ENUM('MSP_Bancontact', 'MSP_Visa', 'MSP_Mastercard', 'MSP_iDeal');
  CREATE TYPE "public"."enum_payment_methods_provider" AS ENUM('multisafepay', 'cash_on_delivery');
  CREATE TYPE "public"."enum_fulfillment_methods_method_type" AS ENUM('delivery', 'takeaway', 'dine_in');
  CREATE TYPE "public"."enum_timeslots_days_day" AS ENUM('1', '2', '3', '4', '5', '6', '7');
  CREATE TYPE "public"."enum_tables_status" AS ENUM('0', '1', '2');
  CREATE TYPE "public"."enum_customer_loyalty_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_coupons_value_type" AS ENUM('percentage', 'fixed');
  CREATE TYPE "public"."enum_orders_order_type" AS ENUM('pos', 'web', 'kiosk');
  CREATE TYPE "public"."enum_categories_status" AS ENUM('enabled', 'disabled');
  CREATE TYPE "public"."enum_products_status" AS ENUM('enabled', 'disabled');
  CREATE TYPE "public"."enum_subproducts_status" AS ENUM('enabled', 'disabled');
  CREATE TABLE IF NOT EXISTS "tenants_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "tenants" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"public" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_users_roles",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "users_tenants_roles" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_users_tenants_roles",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "users_tenants" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tenant_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "users" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"username" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "shops_exceptionally_closed_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"reason" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "shops" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"domain" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"address" varchar,
  	"phone" varchar,
  	"company_details_company_name" varchar NOT NULL,
  	"company_details_street" varchar,
  	"company_details_house_number" varchar,
  	"company_details_city" varchar,
  	"company_details_postal" varchar,
  	"company_details_vat_nr" varchar,
  	"company_details_website_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payment_methods_multisafepay_settings_methods" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_payment_methods_multisafepay_settings_methods",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payment_methods" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
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
  
  CREATE TABLE IF NOT EXISTS "reservation_settings_reservation_periods" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_settings_holidays" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"reason" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_settings_fully_booked_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"reason" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_settings_exceptions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"exception_date" timestamp(3) with time zone NOT NULL,
  	"reason" varchar
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
  
  CREATE TABLE IF NOT EXISTS "pages" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar DEFAULT 'home',
  	"tenant_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "media_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "media" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"blurhash" varchar,
  	"s3_url" varchar,
  	"alt_text" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_medium_url" varchar,
  	"sizes_medium_width" numeric,
  	"sizes_medium_height" numeric,
  	"sizes_medium_mime_type" varchar,
  	"sizes_medium_filesize" numeric,
  	"sizes_medium_filename" varchar
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
  	"email" varchar NOT NULL,
  	"phone" varchar,
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
  
  CREATE TABLE IF NOT EXISTS "categories_productpopups" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"popup_id" uuid NOT NULL,
  	"order" numeric DEFAULT 0
  );
  
  CREATE TABLE IF NOT EXISTS "categories" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"name_nl" varchar NOT NULL,
  	"name_en" varchar,
  	"name_de" varchar,
  	"name_fr" varchar,
  	"image_id" uuid,
  	"modtime" numeric NOT NULL,
  	"status" "enum_categories_status" DEFAULT 'enabled' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "categories_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "products_productpopups" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"popup_id" uuid NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "products" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"name_nl" varchar NOT NULL,
  	"name_en" varchar,
  	"name_de" varchar,
  	"name_fr" varchar,
  	"price_unified" boolean DEFAULT true,
  	"price" numeric,
  	"price_dinein" numeric,
  	"price_takeaway" numeric,
  	"price_delivery" numeric,
  	"enable_stock" boolean DEFAULT false,
  	"quantity" numeric DEFAULT 0,
  	"tax" numeric NOT NULL,
  	"tax_dinein" numeric,
  	"posshow" boolean DEFAULT false,
  	"barcode" varchar,
  	"image_id" uuid,
  	"modtime" numeric NOT NULL,
  	"description_nl" varchar NOT NULL,
  	"description_en" varchar,
  	"description_de" varchar,
  	"description_fr" varchar,
  	"webshopshow" boolean DEFAULT false,
  	"webshoporderable" boolean DEFAULT false,
  	"status" "enum_products_status" DEFAULT 'enabled' NOT NULL,
  	"exclude_category_popups" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid,
  	"categories_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "subproducts" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"name_nl" varchar NOT NULL,
  	"name_en" varchar,
  	"name_de" varchar,
  	"name_fr" varchar,
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
  	"image_id" uuid,
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
  	"popup_title_nl" varchar NOT NULL,
  	"popup_title_en" varchar,
  	"popup_title_de" varchar,
  	"popup_title_fr" varchar,
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
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tenants_id" uuid,
  	"users_id" uuid,
  	"shops_id" uuid,
  	"payment_methods_id" uuid,
  	"fulfillment_methods_id" uuid,
  	"timeslots_id" uuid,
  	"reservation_entries_id" uuid,
  	"reservation_settings_id" uuid,
  	"tables_id" uuid,
  	"printers_id" uuid,
  	"pages_id" uuid,
  	"media_id" uuid,
  	"customers_id" uuid,
  	"customer_credits_id" uuid,
  	"customer_loyalty_id" uuid,
  	"coupons_id" uuid,
  	"gift_vouchers_id" uuid,
  	"orders_id" numeric,
  	"categories_id" uuid,
  	"products_id" uuid,
  	"subproducts_id" uuid,
  	"productpopups_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DO $$ BEGIN
   ALTER TABLE "tenants_domains" ADD CONSTRAINT "tenants_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_tenants_roles" ADD CONSTRAINT "users_tenants_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users_tenants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "shops_exceptionally_closed_days" ADD CONSTRAINT "shops_exceptionally_closed_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "shops" ADD CONSTRAINT "shops_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
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
   ALTER TABLE "reservation_settings_reservation_periods" ADD CONSTRAINT "reservation_settings_reservation_periods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservation_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_settings_holidays" ADD CONSTRAINT "reservation_settings_holidays_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservation_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_settings_fully_booked_days" ADD CONSTRAINT "reservation_settings_fully_booked_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservation_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation_settings_exceptions" ADD CONSTRAINT "reservation_settings_exceptions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservation_settings"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "pages" ADD CONSTRAINT "pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "media_tags" ADD CONSTRAINT "media_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
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
   ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "categories_productpopups" ADD CONSTRAINT "categories_productpopups_popup_id_productpopups_id_fk" FOREIGN KEY ("popup_id") REFERENCES "public"."productpopups"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "categories_productpopups" ADD CONSTRAINT "categories_productpopups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
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
   ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "products" ADD CONSTRAINT "products_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "subproducts" ADD CONSTRAINT "subproducts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
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
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payment_methods_fk" FOREIGN KEY ("payment_methods_id") REFERENCES "public"."payment_methods"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
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
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservation_entries_fk" FOREIGN KEY ("reservation_entries_id") REFERENCES "public"."reservation_entries"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservation_settings_fk" FOREIGN KEY ("reservation_settings_id") REFERENCES "public"."reservation_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tables_fk" FOREIGN KEY ("tables_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_printers_fk" FOREIGN KEY ("printers_id") REFERENCES "public"."printers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
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
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
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
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "tenants_domains_order_idx" ON "tenants_domains" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "tenants_domains_parent_id_idx" ON "tenants_domains" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "tenants_public_idx" ON "tenants" USING btree ("public");
  CREATE INDEX IF NOT EXISTS "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "users_tenants_roles_order_idx" ON "users_tenants_roles" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "users_tenants_roles_parent_idx" ON "users_tenants_roles" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "users_tenants_order_idx" ON "users_tenants" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "users_tenants_parent_id_idx" ON "users_tenants" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "users_tenants_tenant_idx" ON "users_tenants" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" USING btree ("username");
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "users_rels_shops_id_idx" ON "users_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "shops_exceptionally_closed_days_order_idx" ON "shops_exceptionally_closed_days" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "shops_exceptionally_closed_days_parent_id_idx" ON "shops_exceptionally_closed_days" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "shops_tenant_idx" ON "shops" USING btree ("tenant_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "shops_slug_idx" ON "shops" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "shops_updated_at_idx" ON "shops" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "shops_created_at_idx" ON "shops" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payment_methods_multisafepay_settings_methods_order_idx" ON "payment_methods_multisafepay_settings_methods" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payment_methods_multisafepay_settings_methods_parent_idx" ON "payment_methods_multisafepay_settings_methods" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payment_methods_tenant_idx" ON "payment_methods" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "payment_methods_updated_at_idx" ON "payment_methods" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payment_methods_created_at_idx" ON "payment_methods" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payment_methods_rels_order_idx" ON "payment_methods_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payment_methods_rels_parent_idx" ON "payment_methods_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payment_methods_rels_path_idx" ON "payment_methods_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payment_methods_rels_shops_id_idx" ON "payment_methods_rels" USING btree ("shops_id");
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
  CREATE INDEX IF NOT EXISTS "reservation_entries_tenant_idx" ON "reservation_entries" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "reservation_entries_table_idx" ON "reservation_entries" USING btree ("table_id");
  CREATE INDEX IF NOT EXISTS "reservation_entries_updated_at_idx" ON "reservation_entries" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "reservation_entries_created_at_idx" ON "reservation_entries" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "reservation_entries_rels_order_idx" ON "reservation_entries_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "reservation_entries_rels_parent_idx" ON "reservation_entries_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "reservation_entries_rels_path_idx" ON "reservation_entries_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "reservation_entries_rels_shops_id_idx" ON "reservation_entries_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "reservation_settings_reservation_periods_order_idx" ON "reservation_settings_reservation_periods" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reservation_settings_reservation_periods_parent_id_idx" ON "reservation_settings_reservation_periods" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reservation_settings_holidays_order_idx" ON "reservation_settings_holidays" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reservation_settings_holidays_parent_id_idx" ON "reservation_settings_holidays" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reservation_settings_fully_booked_days_order_idx" ON "reservation_settings_fully_booked_days" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reservation_settings_fully_booked_days_parent_id_idx" ON "reservation_settings_fully_booked_days" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reservation_settings_exceptions_order_idx" ON "reservation_settings_exceptions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reservation_settings_exceptions_parent_id_idx" ON "reservation_settings_exceptions" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reservation_settings_tenant_idx" ON "reservation_settings" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "reservation_settings_updated_at_idx" ON "reservation_settings" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "reservation_settings_created_at_idx" ON "reservation_settings" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "reservation_settings_rels_order_idx" ON "reservation_settings_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "reservation_settings_rels_parent_idx" ON "reservation_settings_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "reservation_settings_rels_path_idx" ON "reservation_settings_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "reservation_settings_rels_shops_id_idx" ON "reservation_settings_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "tables_tenant_idx" ON "tables" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "tables_updated_at_idx" ON "tables" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tables_created_at_idx" ON "tables" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "tables_rels_order_idx" ON "tables_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "tables_rels_parent_idx" ON "tables_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "tables_rels_path_idx" ON "tables_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "tables_rels_shops_id_idx" ON "tables_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "printers_printer_settings_kiosk_printers_order_idx" ON "printers_printer_settings_kiosk_printers" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "printers_printer_settings_kiosk_printers_parent_id_idx" ON "printers_printer_settings_kiosk_printers" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "printers_tenant_idx" ON "printers" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "printers_printername_idx" ON "printers" USING btree ("printername_id");
  CREATE INDEX IF NOT EXISTS "printers_updated_at_idx" ON "printers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "printers_created_at_idx" ON "printers" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "pages_tenant_idx" ON "pages" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "media_tags_order_idx" ON "media_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "media_tags_parent_id_idx" ON "media_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "media_tenant_idx" ON "media" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
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
  CREATE INDEX IF NOT EXISTS "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "orders_rels_order_idx" ON "orders_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "orders_rels_parent_idx" ON "orders_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "orders_rels_path_idx" ON "orders_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "orders_rels_shops_id_idx" ON "orders_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "categories_productpopups_order_idx" ON "categories_productpopups" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "categories_productpopups_parent_id_idx" ON "categories_productpopups" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "categories_productpopups_popup_idx" ON "categories_productpopups" USING btree ("popup_id");
  CREATE INDEX IF NOT EXISTS "categories_tenant_idx" ON "categories" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "categories_image_idx" ON "categories" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "categories_rels_order_idx" ON "categories_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "categories_rels_parent_idx" ON "categories_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "categories_rels_path_idx" ON "categories_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "categories_rels_shops_id_idx" ON "categories_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "products_productpopups_order_idx" ON "products_productpopups" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "products_productpopups_parent_id_idx" ON "products_productpopups" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "products_productpopups_popup_idx" ON "products_productpopups" USING btree ("popup_id");
  CREATE INDEX IF NOT EXISTS "products_tenant_idx" ON "products" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "products_image_idx" ON "products" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "products_rels_shops_id_idx" ON "products_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "products_rels_categories_id_idx" ON "products_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "subproducts_tenant_idx" ON "subproducts" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "subproducts_linked_product_idx" ON "subproducts" USING btree ("linked_product_id");
  CREATE INDEX IF NOT EXISTS "subproducts_image_idx" ON "subproducts" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "subproducts_updated_at_idx" ON "subproducts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "subproducts_created_at_idx" ON "subproducts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "subproducts_rels_order_idx" ON "subproducts_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "subproducts_rels_parent_idx" ON "subproducts_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "subproducts_rels_path_idx" ON "subproducts_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "subproducts_rels_shops_id_idx" ON "subproducts_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "productpopups_tenant_idx" ON "productpopups" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "productpopups_default_checked_subproduct_idx" ON "productpopups" USING btree ("default_checked_subproduct_id");
  CREATE INDEX IF NOT EXISTS "productpopups_updated_at_idx" ON "productpopups" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "productpopups_created_at_idx" ON "productpopups" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "productpopups_rels_order_idx" ON "productpopups_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "productpopups_rels_parent_idx" ON "productpopups_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "productpopups_rels_path_idx" ON "productpopups_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "productpopups_rels_shops_id_idx" ON "productpopups_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "productpopups_rels_subproducts_id_idx" ON "productpopups_rels" USING btree ("subproducts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_shops_id_idx" ON "payload_locked_documents_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_payment_methods_id_idx" ON "payload_locked_documents_rels" USING btree ("payment_methods_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_fulfillment_methods_id_idx" ON "payload_locked_documents_rels" USING btree ("fulfillment_methods_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_timeslots_id_idx" ON "payload_locked_documents_rels" USING btree ("timeslots_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reservation_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("reservation_entries_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reservation_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("reservation_settings_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tables_id_idx" ON "payload_locked_documents_rels" USING btree ("tables_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_printers_id_idx" ON "payload_locked_documents_rels" USING btree ("printers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_customer_credits_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_credits_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_customer_loyalty_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_loyalty_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_coupons_id_idx" ON "payload_locked_documents_rels" USING btree ("coupons_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_gift_vouchers_id_idx" ON "payload_locked_documents_rels" USING btree ("gift_vouchers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subproducts_id_idx" ON "payload_locked_documents_rels" USING btree ("subproducts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_productpopups_id_idx" ON "payload_locked_documents_rels" USING btree ("productpopups_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tenants_domains" CASCADE;
  DROP TABLE "tenants" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_tenants_roles" CASCADE;
  DROP TABLE "users_tenants" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "shops_exceptionally_closed_days" CASCADE;
  DROP TABLE "shops" CASCADE;
  DROP TABLE "payment_methods_multisafepay_settings_methods" CASCADE;
  DROP TABLE "payment_methods" CASCADE;
  DROP TABLE "payment_methods_rels" CASCADE;
  DROP TABLE "fulfillment_methods" CASCADE;
  DROP TABLE "fulfillment_methods_rels" CASCADE;
  DROP TABLE "timeslots_days_time_ranges" CASCADE;
  DROP TABLE "timeslots_days" CASCADE;
  DROP TABLE "timeslots" CASCADE;
  DROP TABLE "timeslots_rels" CASCADE;
  DROP TABLE "reservation_entries" CASCADE;
  DROP TABLE "reservation_entries_rels" CASCADE;
  DROP TABLE "reservation_settings_reservation_periods" CASCADE;
  DROP TABLE "reservation_settings_holidays" CASCADE;
  DROP TABLE "reservation_settings_fully_booked_days" CASCADE;
  DROP TABLE "reservation_settings_exceptions" CASCADE;
  DROP TABLE "reservation_settings" CASCADE;
  DROP TABLE "reservation_settings_rels" CASCADE;
  DROP TABLE "tables" CASCADE;
  DROP TABLE "tables_rels" CASCADE;
  DROP TABLE "printers_printer_settings_kiosk_printers" CASCADE;
  DROP TABLE "printers" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "media_tags" CASCADE;
  DROP TABLE "media" CASCADE;
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
  DROP TABLE "categories_productpopups" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_rels" CASCADE;
  DROP TABLE "products_productpopups" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "subproducts" CASCADE;
  DROP TABLE "subproducts_rels" CASCADE;
  DROP TABLE "productpopups" CASCADE;
  DROP TABLE "productpopups_rels" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_tenants_roles";
  DROP TYPE "public"."enum_payment_methods_multisafepay_settings_methods";
  DROP TYPE "public"."enum_payment_methods_provider";
  DROP TYPE "public"."enum_fulfillment_methods_method_type";
  DROP TYPE "public"."enum_timeslots_days_day";
  DROP TYPE "public"."enum_tables_status";
  DROP TYPE "public"."enum_customer_loyalty_status";
  DROP TYPE "public"."enum_coupons_value_type";
  DROP TYPE "public"."enum_orders_order_type";
  DROP TYPE "public"."enum_categories_status";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum_subproducts_status";`)
}
