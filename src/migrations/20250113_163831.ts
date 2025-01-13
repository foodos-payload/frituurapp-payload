import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('nl', 'en', 'de', 'fr');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('super-admin', 'user');
  CREATE TYPE "public"."enum_users_tenants_roles" AS ENUM('tenant-admin', 'tenant-viewer');
  CREATE TYPE "public"."enum_payment_methods_multisafepay_settings_methods" AS ENUM('MSP_Bancontact', 'MSP_Visa', 'MSP_Mastercard', 'MSP_iDeal');
  CREATE TYPE "public"."enum_payment_methods_provider" AS ENUM('multisafepay', 'cash_on_delivery');
  CREATE TYPE "public"."enum_fulfillment_methods_method_type" AS ENUM('delivery', 'takeaway', 'dine_in');
  CREATE TYPE "public"."enum_tables_status" AS ENUM('0', '1', '2');
  CREATE TYPE "public"."enum_printers_printer_type" AS ENUM('kitchen', 'kiosk');
  CREATE TYPE "public"."enum_pos_provider" AS ENUM('cloudpos', 'deliverect');
  CREATE TYPE "public"."enum_customers_memberships_status" AS ENUM('active', 'disabled');
  CREATE TYPE "public"."enum_customer_loyalty_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_coupons_value_type" AS ENUM('percentage', 'fixed');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending_payment', 'awaiting_preparation', 'in_preparation', 'ready_for_pickup', 'in_delivery', 'complete', 'cancelled');
  CREATE TYPE "public"."enum_orders_order_type" AS ENUM('pos', 'web', 'kiosk');
  CREATE TYPE "public"."enum_orders_fulfillment_method" AS ENUM('delivery', 'takeaway', 'dine_in');
  CREATE TYPE "public"."enum_categories_status" AS ENUM('enabled', 'disabled');
  CREATE TYPE "public"."enum_products_allergens" AS ENUM('gluten', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs');
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
  	"location_lat" varchar,
  	"location_lng" varchar,
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
  
  CREATE TABLE IF NOT EXISTS "payment_methods_terminal_ids" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kiosk" numeric NOT NULL,
  	"terminal_id" varchar NOT NULL
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
  	"settings_kiosk_pickup_instructions" varchar,
  	"settings_shared_booked_slots" boolean DEFAULT false,
  	"settings_checkout_email_required" boolean DEFAULT false,
  	"settings_checkout_phone_required" boolean DEFAULT false,
  	"settings_checkout_lastname_required" boolean DEFAULT false,
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
  
  CREATE TABLE IF NOT EXISTS "timeslots_week_monday" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"interval_minutes" numeric DEFAULT 15,
  	"max_orders" numeric,
  	"status" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "timeslots_week_tuesday" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"interval_minutes" numeric DEFAULT 15,
  	"max_orders" numeric,
  	"status" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "timeslots_week_wednesday" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"interval_minutes" numeric DEFAULT 15,
  	"max_orders" numeric,
  	"status" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "timeslots_week_thursday" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"interval_minutes" numeric DEFAULT 15,
  	"max_orders" numeric,
  	"status" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "timeslots_week_friday" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"interval_minutes" numeric DEFAULT 15,
  	"max_orders" numeric,
  	"status" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "timeslots_week_saturday" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"interval_minutes" numeric DEFAULT 15,
  	"max_orders" numeric,
  	"status" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "timeslots_week_sunday" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"interval_minutes" numeric DEFAULT 15,
  	"max_orders" numeric,
  	"status" boolean DEFAULT true
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
  
  CREATE TABLE IF NOT EXISTS "shop_branding_kiosk_idle_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"video_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "shop_branding" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"site_title" varchar NOT NULL,
  	"site_header_img_id" uuid,
  	"site_logo_id" uuid,
  	"ad_image_id" uuid,
  	"header_background_color" varchar,
  	"category_card_bg_color" varchar DEFAULT '#CE2027',
  	"primary_color_c_t_a" varchar DEFAULT '#068b59',
  	"google_review_url" varchar,
  	"trip_advisor_url" varchar,
  	"kiosk_idle_screen_enabled" boolean DEFAULT true,
  	"kiosk_idle_image_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "shop_branding_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "digital_menus_category_overrides" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_id" uuid NOT NULL,
  	"display_name" varchar,
  	"columns_for_products" numeric DEFAULT 2
  );
  
  CREATE TABLE IF NOT EXISTS "digital_menus" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"name" varchar NOT NULL,
  	"shop_branding_id" uuid,
  	"max_rows" numeric DEFAULT 8,
  	"auto_rotate_interval" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "digital_menus_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid,
  	"products_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "reservation_entries" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_email" varchar NOT NULL,
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
  
  CREATE TABLE IF NOT EXISTS "printers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"awl_i_p" varchar NOT NULL,
  	"printer_name" varchar,
  	"queue_name" varchar NOT NULL,
  	"printer_type" "enum_printers_printer_type" NOT NULL,
  	"unique_id" varchar NOT NULL,
  	"print_enabled" boolean DEFAULT true,
  	"customer_enabled" boolean DEFAULT false,
  	"kitchen_ticket_amount" numeric DEFAULT 2,
  	"print_category_headers" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "printers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "pos" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"provider" "enum_pos_provider" NOT NULL,
  	"license_name" varchar,
  	"token" varchar,
  	"api_key" varchar,
  	"api_secret" varchar,
  	"active" boolean DEFAULT true,
  	"shop_id" uuid NOT NULL,
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
  
  CREATE TABLE IF NOT EXISTS "customers_memberships" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role_id" uuid NOT NULL,
  	"points" numeric DEFAULT 0,
  	"status" "enum_customers_memberships_status" DEFAULT 'active',
  	"date_joined" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "customers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"cloud_p_o_s_id" numeric,
  	"firstname" varchar NOT NULL,
  	"lastname" varchar NOT NULL,
  	"company_name" varchar,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"barcode" varchar,
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
  	"shops_id" uuid,
  	"membership_roles_id" uuid
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
  
  CREATE TABLE IF NOT EXISTS "membership_roles" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"default_role" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "membership_roles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"shops_id" uuid,
  	"customer_loyalty_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "orders_order_details_subproducts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"subproduct_id" varchar,
  	"name_nl" varchar,
  	"name_en" varchar,
  	"name_de" varchar,
  	"name_fr" varchar,
  	"price" numeric,
  	"tax" numeric,
  	"tax_dinein" numeric,
  	"quantity" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "orders_order_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" numeric NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" uuid NOT NULL,
  	"quantity" numeric NOT NULL,
  	"price" numeric NOT NULL,
  	"tax" numeric,
  	"tax_dinein" numeric,
  	"name_nl" varchar,
  	"name_en" varchar,
  	"name_de" varchar,
  	"name_fr" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "orders_payments" (
  	"_order" integer NOT NULL,
  	"_parent_id" numeric NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"payment_method_id" uuid NOT NULL,
  	"sub_method_label" varchar,
  	"amount" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "orders" (
  	"id" numeric PRIMARY KEY NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"cloud_p_o_s_id" numeric,
  	"provider_order_id" varchar,
  	"temp_ord_nr" numeric,
  	"status" "enum_orders_status" DEFAULT 'pending_payment' NOT NULL,
  	"order_type" "enum_orders_order_type" NOT NULL,
  	"fulfillment_method" "enum_orders_fulfillment_method",
  	"fulfillment_date" varchar,
  	"fulfillment_time" varchar,
  	"customer_id" uuid,
  	"customer_barcode" varchar,
  	"customer_details_first_name" varchar,
  	"customer_details_last_name" varchar,
  	"customer_details_email" varchar,
  	"customer_details_phone" varchar,
  	"customer_details_address" varchar,
  	"customer_details_city" varchar,
  	"customer_details_postal_code" varchar,
  	"shipping_cost" numeric,
  	"subtotal_before_discount" numeric,
  	"discount_total" numeric,
  	"total_after_discount" numeric,
  	"total_tax" numeric,
  	"subtotal" numeric,
  	"total" numeric,
  	"promotions_used_points_used" numeric DEFAULT 0,
  	"promotions_used_credits_used" numeric DEFAULT 0,
  	"promotions_used_coupon_used_coupon_id" varchar,
  	"promotions_used_coupon_used_barcode" varchar,
  	"promotions_used_coupon_used_value" numeric,
  	"promotions_used_coupon_used_value_type" varchar,
  	"promotions_used_coupon_used_valid_from" timestamp(3) with time zone,
  	"promotions_used_coupon_used_valid_until" timestamp(3) with time zone,
  	"promotions_used_coupon_used_max_uses" numeric,
  	"promotions_used_coupon_used_used" boolean,
  	"promotions_used_gift_voucher_used_voucher_id" varchar,
  	"promotions_used_gift_voucher_used_barcode" varchar,
  	"promotions_used_gift_voucher_used_value" numeric,
  	"promotions_used_gift_voucher_used_valid_from" timestamp(3) with time zone,
  	"promotions_used_gift_voucher_used_valid_until" timestamp(3) with time zone,
  	"promotions_used_gift_voucher_used_used" boolean,
  	"user_locale" varchar,
  	"kiosk_number" numeric,
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
  	"cloud_p_o_s_id" numeric,
  	"name_nl" varchar NOT NULL,
  	"name_en" varchar,
  	"name_de" varchar,
  	"name_fr" varchar,
  	"menu_order" numeric DEFAULT 0,
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
  
  CREATE TABLE IF NOT EXISTS "products_allergens" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_products_allergens",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
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
  	"cloud_p_o_s_id" numeric,
  	"name_nl" varchar NOT NULL,
  	"name_en" varchar,
  	"name_de" varchar,
  	"name_fr" varchar,
  	"price_unified" boolean DEFAULT true,
  	"price" numeric,
  	"price_dinein" numeric,
  	"price_takeaway" numeric,
  	"price_delivery" numeric,
  	"menu_order" numeric DEFAULT 0,
  	"is_promotion" boolean DEFAULT false,
  	"old_price" numeric,
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
  	"cloud_p_o_s_id" numeric,
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
  	"allow_multiple_times" boolean DEFAULT false,
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
  	"shop_branding_id" uuid,
  	"digital_menus_id" uuid,
  	"reservation_entries_id" uuid,
  	"reservation_settings_id" uuid,
  	"tables_id" uuid,
  	"printers_id" uuid,
  	"pos_id" uuid,
  	"pages_id" uuid,
  	"media_id" uuid,
  	"customers_id" uuid,
  	"customer_credits_id" uuid,
  	"customer_loyalty_id" uuid,
  	"coupons_id" uuid,
  	"gift_vouchers_id" uuid,
  	"membership_roles_id" uuid,
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
   ALTER TABLE "payment_methods_terminal_ids" ADD CONSTRAINT "payment_methods_terminal_ids_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payment_methods"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "timeslots_week_monday" ADD CONSTRAINT "timeslots_week_monday_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."timeslots"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots_week_tuesday" ADD CONSTRAINT "timeslots_week_tuesday_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."timeslots"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots_week_wednesday" ADD CONSTRAINT "timeslots_week_wednesday_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."timeslots"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots_week_thursday" ADD CONSTRAINT "timeslots_week_thursday_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."timeslots"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots_week_friday" ADD CONSTRAINT "timeslots_week_friday_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."timeslots"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots_week_saturday" ADD CONSTRAINT "timeslots_week_saturday_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."timeslots"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "timeslots_week_sunday" ADD CONSTRAINT "timeslots_week_sunday_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."timeslots"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "shop_branding_kiosk_idle_videos" ADD CONSTRAINT "shop_branding_kiosk_idle_videos_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "shop_branding_kiosk_idle_videos" ADD CONSTRAINT "shop_branding_kiosk_idle_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shop_branding"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "shop_branding" ADD CONSTRAINT "shop_branding_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "shop_branding" ADD CONSTRAINT "shop_branding_site_header_img_id_media_id_fk" FOREIGN KEY ("site_header_img_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "shop_branding" ADD CONSTRAINT "shop_branding_site_logo_id_media_id_fk" FOREIGN KEY ("site_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "shop_branding" ADD CONSTRAINT "shop_branding_ad_image_id_media_id_fk" FOREIGN KEY ("ad_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "shop_branding" ADD CONSTRAINT "shop_branding_kiosk_idle_image_id_media_id_fk" FOREIGN KEY ("kiosk_idle_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "shop_branding_rels" ADD CONSTRAINT "shop_branding_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."shop_branding"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "shop_branding_rels" ADD CONSTRAINT "shop_branding_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "digital_menus_category_overrides" ADD CONSTRAINT "digital_menus_category_overrides_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "digital_menus_category_overrides" ADD CONSTRAINT "digital_menus_category_overrides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."digital_menus"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "digital_menus" ADD CONSTRAINT "digital_menus_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "digital_menus" ADD CONSTRAINT "digital_menus_shop_branding_id_shop_branding_id_fk" FOREIGN KEY ("shop_branding_id") REFERENCES "public"."shop_branding"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "digital_menus_rels" ADD CONSTRAINT "digital_menus_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."digital_menus"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "digital_menus_rels" ADD CONSTRAINT "digital_menus_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "digital_menus_rels" ADD CONSTRAINT "digital_menus_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "printers" ADD CONSTRAINT "printers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "printers_rels" ADD CONSTRAINT "printers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."printers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "printers_rels" ADD CONSTRAINT "printers_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "pos" ADD CONSTRAINT "pos_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE set null ON UPDATE no action;
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
   ALTER TABLE "customers_memberships" ADD CONSTRAINT "customers_memberships_role_id_membership_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."membership_roles"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "customers_memberships" ADD CONSTRAINT "customers_memberships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "customer_loyalty_rels" ADD CONSTRAINT "customer_loyalty_rels_membership_roles_fk" FOREIGN KEY ("membership_roles_id") REFERENCES "public"."membership_roles"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "membership_roles_rels" ADD CONSTRAINT "membership_roles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."membership_roles"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "membership_roles_rels" ADD CONSTRAINT "membership_roles_rels_shops_fk" FOREIGN KEY ("shops_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "membership_roles_rels" ADD CONSTRAINT "membership_roles_rels_customer_loyalty_fk" FOREIGN KEY ("customer_loyalty_id") REFERENCES "public"."customer_loyalty"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "products_allergens" ADD CONSTRAINT "products_allergens_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shop_branding_fk" FOREIGN KEY ("shop_branding_id") REFERENCES "public"."shop_branding"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_digital_menus_fk" FOREIGN KEY ("digital_menus_id") REFERENCES "public"."digital_menus"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pos_fk" FOREIGN KEY ("pos_id") REFERENCES "public"."pos"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_membership_roles_fk" FOREIGN KEY ("membership_roles_id") REFERENCES "public"."membership_roles"("id") ON DELETE cascade ON UPDATE no action;
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
  CREATE INDEX IF NOT EXISTS "payment_methods_terminal_ids_order_idx" ON "payment_methods_terminal_ids" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "payment_methods_terminal_ids_parent_id_idx" ON "payment_methods_terminal_ids" USING btree ("_parent_id");
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
  CREATE INDEX IF NOT EXISTS "timeslots_week_monday_order_idx" ON "timeslots_week_monday" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "timeslots_week_monday_parent_id_idx" ON "timeslots_week_monday" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_week_tuesday_order_idx" ON "timeslots_week_tuesday" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "timeslots_week_tuesday_parent_id_idx" ON "timeslots_week_tuesday" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_week_wednesday_order_idx" ON "timeslots_week_wednesday" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "timeslots_week_wednesday_parent_id_idx" ON "timeslots_week_wednesday" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_week_thursday_order_idx" ON "timeslots_week_thursday" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "timeslots_week_thursday_parent_id_idx" ON "timeslots_week_thursday" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_week_friday_order_idx" ON "timeslots_week_friday" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "timeslots_week_friday_parent_id_idx" ON "timeslots_week_friday" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_week_saturday_order_idx" ON "timeslots_week_saturday" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "timeslots_week_saturday_parent_id_idx" ON "timeslots_week_saturday" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_week_sunday_order_idx" ON "timeslots_week_sunday" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "timeslots_week_sunday_parent_id_idx" ON "timeslots_week_sunday" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_tenant_idx" ON "timeslots" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "timeslots_method_id_idx" ON "timeslots" USING btree ("method_id_id");
  CREATE INDEX IF NOT EXISTS "timeslots_updated_at_idx" ON "timeslots" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "timeslots_created_at_idx" ON "timeslots" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "timeslots_rels_order_idx" ON "timeslots_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "timeslots_rels_parent_idx" ON "timeslots_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "timeslots_rels_path_idx" ON "timeslots_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "timeslots_rels_shops_id_idx" ON "timeslots_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "shop_branding_kiosk_idle_videos_order_idx" ON "shop_branding_kiosk_idle_videos" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "shop_branding_kiosk_idle_videos_parent_id_idx" ON "shop_branding_kiosk_idle_videos" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "shop_branding_kiosk_idle_videos_video_idx" ON "shop_branding_kiosk_idle_videos" USING btree ("video_id");
  CREATE INDEX IF NOT EXISTS "shop_branding_tenant_idx" ON "shop_branding" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "shop_branding_site_header_img_idx" ON "shop_branding" USING btree ("site_header_img_id");
  CREATE INDEX IF NOT EXISTS "shop_branding_site_logo_idx" ON "shop_branding" USING btree ("site_logo_id");
  CREATE INDEX IF NOT EXISTS "shop_branding_ad_image_idx" ON "shop_branding" USING btree ("ad_image_id");
  CREATE INDEX IF NOT EXISTS "shop_branding_kiosk_idle_image_idx" ON "shop_branding" USING btree ("kiosk_idle_image_id");
  CREATE INDEX IF NOT EXISTS "shop_branding_updated_at_idx" ON "shop_branding" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "shop_branding_created_at_idx" ON "shop_branding" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "shop_branding_rels_order_idx" ON "shop_branding_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "shop_branding_rels_parent_idx" ON "shop_branding_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "shop_branding_rels_path_idx" ON "shop_branding_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "shop_branding_rels_shops_id_idx" ON "shop_branding_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "digital_menus_category_overrides_order_idx" ON "digital_menus_category_overrides" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "digital_menus_category_overrides_parent_id_idx" ON "digital_menus_category_overrides" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "digital_menus_category_overrides_category_idx" ON "digital_menus_category_overrides" USING btree ("category_id");
  CREATE INDEX IF NOT EXISTS "digital_menus_tenant_idx" ON "digital_menus" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "digital_menus_shop_branding_idx" ON "digital_menus" USING btree ("shop_branding_id");
  CREATE INDEX IF NOT EXISTS "digital_menus_updated_at_idx" ON "digital_menus" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "digital_menus_created_at_idx" ON "digital_menus" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "digital_menus_rels_order_idx" ON "digital_menus_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "digital_menus_rels_parent_idx" ON "digital_menus_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "digital_menus_rels_path_idx" ON "digital_menus_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "digital_menus_rels_shops_id_idx" ON "digital_menus_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "digital_menus_rels_products_id_idx" ON "digital_menus_rels" USING btree ("products_id");
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
  CREATE INDEX IF NOT EXISTS "printers_tenant_idx" ON "printers" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "printers_updated_at_idx" ON "printers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "printers_created_at_idx" ON "printers" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "printers_rels_order_idx" ON "printers_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "printers_rels_parent_idx" ON "printers_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "printers_rels_path_idx" ON "printers_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "printers_rels_shops_id_idx" ON "printers_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "pos_shop_idx" ON "pos" USING btree ("shop_id");
  CREATE INDEX IF NOT EXISTS "pos_updated_at_idx" ON "pos" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "pos_created_at_idx" ON "pos" USING btree ("created_at");
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
  CREATE INDEX IF NOT EXISTS "customers_memberships_order_idx" ON "customers_memberships" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "customers_memberships_parent_id_idx" ON "customers_memberships" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "customers_memberships_role_idx" ON "customers_memberships" USING btree ("role_id");
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
  CREATE INDEX IF NOT EXISTS "customer_loyalty_rels_membership_roles_id_idx" ON "customer_loyalty_rels" USING btree ("membership_roles_id");
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
  CREATE INDEX IF NOT EXISTS "membership_roles_tenant_idx" ON "membership_roles" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "membership_roles_updated_at_idx" ON "membership_roles" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "membership_roles_created_at_idx" ON "membership_roles" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "membership_roles_rels_order_idx" ON "membership_roles_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "membership_roles_rels_parent_idx" ON "membership_roles_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "membership_roles_rels_path_idx" ON "membership_roles_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "membership_roles_rels_shops_id_idx" ON "membership_roles_rels" USING btree ("shops_id");
  CREATE INDEX IF NOT EXISTS "membership_roles_rels_customer_loyalty_id_idx" ON "membership_roles_rels" USING btree ("customer_loyalty_id");
  CREATE INDEX IF NOT EXISTS "orders_order_details_subproducts_order_idx" ON "orders_order_details_subproducts" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "orders_order_details_subproducts_parent_id_idx" ON "orders_order_details_subproducts" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "orders_order_details_order_idx" ON "orders_order_details" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "orders_order_details_parent_id_idx" ON "orders_order_details" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "orders_order_details_product_idx" ON "orders_order_details" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "orders_payments_order_idx" ON "orders_payments" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "orders_payments_parent_id_idx" ON "orders_payments" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "orders_payments_payment_method_idx" ON "orders_payments" USING btree ("payment_method_id");
  CREATE INDEX IF NOT EXISTS "orders_tenant_idx" ON "orders" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "orders_customer_idx" ON "orders" USING btree ("customer_id");
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
  CREATE INDEX IF NOT EXISTS "products_allergens_order_idx" ON "products_allergens" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "products_allergens_parent_idx" ON "products_allergens" USING btree ("parent_id");
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
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_shop_branding_id_idx" ON "payload_locked_documents_rels" USING btree ("shop_branding_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_digital_menus_id_idx" ON "payload_locked_documents_rels" USING btree ("digital_menus_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reservation_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("reservation_entries_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reservation_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("reservation_settings_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tables_id_idx" ON "payload_locked_documents_rels" USING btree ("tables_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_printers_id_idx" ON "payload_locked_documents_rels" USING btree ("printers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_pos_id_idx" ON "payload_locked_documents_rels" USING btree ("pos_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_customer_credits_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_credits_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_customer_loyalty_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_loyalty_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_coupons_id_idx" ON "payload_locked_documents_rels" USING btree ("coupons_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_gift_vouchers_id_idx" ON "payload_locked_documents_rels" USING btree ("gift_vouchers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_membership_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("membership_roles_id");
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
  DROP TABLE "payment_methods_terminal_ids" CASCADE;
  DROP TABLE "payment_methods" CASCADE;
  DROP TABLE "payment_methods_rels" CASCADE;
  DROP TABLE "fulfillment_methods" CASCADE;
  DROP TABLE "fulfillment_methods_rels" CASCADE;
  DROP TABLE "timeslots_week_monday" CASCADE;
  DROP TABLE "timeslots_week_tuesday" CASCADE;
  DROP TABLE "timeslots_week_wednesday" CASCADE;
  DROP TABLE "timeslots_week_thursday" CASCADE;
  DROP TABLE "timeslots_week_friday" CASCADE;
  DROP TABLE "timeslots_week_saturday" CASCADE;
  DROP TABLE "timeslots_week_sunday" CASCADE;
  DROP TABLE "timeslots" CASCADE;
  DROP TABLE "timeslots_rels" CASCADE;
  DROP TABLE "shop_branding_kiosk_idle_videos" CASCADE;
  DROP TABLE "shop_branding" CASCADE;
  DROP TABLE "shop_branding_rels" CASCADE;
  DROP TABLE "digital_menus_category_overrides" CASCADE;
  DROP TABLE "digital_menus" CASCADE;
  DROP TABLE "digital_menus_rels" CASCADE;
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
  DROP TABLE "printers" CASCADE;
  DROP TABLE "printers_rels" CASCADE;
  DROP TABLE "pos" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "media_tags" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "customers_tags" CASCADE;
  DROP TABLE "customers_memberships" CASCADE;
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
  DROP TABLE "membership_roles" CASCADE;
  DROP TABLE "membership_roles_rels" CASCADE;
  DROP TABLE "orders_order_details_subproducts" CASCADE;
  DROP TABLE "orders_order_details" CASCADE;
  DROP TABLE "orders_payments" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "orders_rels" CASCADE;
  DROP TABLE "categories_productpopups" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_rels" CASCADE;
  DROP TABLE "products_allergens" CASCADE;
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
  DROP TYPE "public"."enum_tables_status";
  DROP TYPE "public"."enum_printers_printer_type";
  DROP TYPE "public"."enum_pos_provider";
  DROP TYPE "public"."enum_customers_memberships_status";
  DROP TYPE "public"."enum_customer_loyalty_status";
  DROP TYPE "public"."enum_coupons_value_type";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_order_type";
  DROP TYPE "public"."enum_orders_fulfillment_method";
  DROP TYPE "public"."enum_categories_status";
  DROP TYPE "public"."enum_products_allergens";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum_subproducts_status";`)
}
