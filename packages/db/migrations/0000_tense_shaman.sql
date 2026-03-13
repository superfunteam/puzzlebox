CREATE TYPE "public"."edition_status" AS ENUM('draft', 'scheduled', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."game_lifecycle" AS ENUM('playtest', 'production');--> statement-breakpoint
CREATE TYPE "public"."game_mode" AS ENUM('pick_one', 'ordered_sequence', 'survey');--> statement-breakpoint
CREATE TYPE "public"."auth_method" AS ENUM('magic_link', 'external', 'anonymous');--> statement-breakpoint
CREATE TYPE "public"."streak_event_type" AS ENUM('auto_consumed', 'manual_consumed', 'granted', 'purchased');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"label" text NOT NULL,
	"scopes" text[] DEFAULT '{}' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"edition_date" date NOT NULL,
	"status" "edition_status" DEFAULT 'draft' NOT NULL,
	"publish_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"mode" "game_mode" NOT NULL,
	"lifecycle" "game_lifecycle" DEFAULT 'production' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_links" (
	"token" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"auth_method" "auth_method" NOT NULL,
	"email" text,
	"external_id" text,
	"display_name" text,
	"anonymous_token" text,
	"timezone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"answer" jsonb NOT NULL,
	"is_correct" boolean,
	"score" integer DEFAULT 0 NOT NULL,
	"responded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"edition_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"score" integer,
	"max_score" integer,
	"share_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "player_streaks" (
	"player_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_played_date" date,
	"freezes_remaining" integer DEFAULT 2 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streak_freeze_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" "streak_event_type" NOT NULL,
	"freeze_date" date NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"timezone" text NOT NULL,
	"auth_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "editions_game_date_unique" ON "editions" USING btree ("game_id","edition_date");--> statement-breakpoint
CREATE UNIQUE INDEX "editions_tenant_game_date" ON "editions" USING btree ("tenant_id","game_id","edition_date");--> statement-breakpoint
CREATE UNIQUE INDEX "games_tenant_slug_unique" ON "games" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "players_tenant_email_unique" ON "players" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "responses_session_round_unique" ON "responses" USING btree ("session_id","round_id");--> statement-breakpoint
CREATE UNIQUE INDEX "responses_tenant_session_round" ON "responses" USING btree ("tenant_id","session_id","round_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rounds_edition_position_unique" ON "rounds" USING btree ("edition_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_player_edition_unique" ON "sessions" USING btree ("player_id","edition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_tenant_player_edition" ON "sessions" USING btree ("tenant_id","player_id","edition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_streaks_player_game_unique" ON "player_streaks" USING btree ("player_id","game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_streaks_tenant_player_game" ON "player_streaks" USING btree ("tenant_id","player_id","game_id");