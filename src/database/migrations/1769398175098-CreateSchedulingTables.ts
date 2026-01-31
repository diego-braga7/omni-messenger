import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchedulingTables1769398175098 implements MigrationInterface {
  name = 'CreateSchedulingTables1769398175098';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ⚠️ DROP EXISTING CONFLICTING TABLES/ENUMS FROM PREVIOUS IMPLEMENTATIONS
    // This ensures a clean slate for the new schema structure

    // Note: We use CASCADE in DROP TABLE to handle foreign keys, avoiding "relation does not exist" errors
    // that would occur if we tried to drop constraints on non-existent tables.

    // Drop tables if they exist
    await queryRunner.query(
      `DROP TABLE IF EXISTS "scheduling_sessions" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "conversation_states" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "business_services" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "professionals" CASCADE`);

    // Drop Types if they exist
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."appointment_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."scheduling_step_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."conversation_step_enum"`,
    );

    // --- START NEW SCHEMA ---

    // Create Enums
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_status_enum" AS ENUM('SCHEDULED', 'CANCELED', 'COMPLETED', 'RESCHEDULED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_step_enum" AS ENUM('SELECT_SERVICE', 'SELECT_PROFESSIONAL', 'SELECT_DATE', 'SELECT_TIME', 'CONFIRMATION')`,
    );

    // Create Professionals Table
    await queryRunner.query(`
      CREATE TABLE "professionals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "specialty" character varying NOT NULL,
        "calendar_id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_professionals" PRIMARY KEY ("id")
      )
    `);

    // Create Services Table
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "duration_minutes" integer NOT NULL,
        "price" numeric(10,2),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services" PRIMARY KEY ("id")
      )
    `);

    // Create Appointments Table
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "professional_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "start_time" TIMESTAMP NOT NULL,
        "end_time" TIMESTAMP NOT NULL,
        "status" "public"."appointment_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "google_event_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id")
      )
    `);

    // Create Conversation States Table
    await queryRunner.query(`
      CREATE TABLE "conversation_states" (
        "phone" character varying NOT NULL,
        "step" "public"."conversation_step_enum" NOT NULL,
        "data" jsonb,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversation_states" PRIMARY KEY ("phone")
      )
    `);

    // Add Foreign Keys
    await queryRunner.query(`
      ALTER TABLE "appointments" 
      ADD CONSTRAINT "FK_appointments_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments" 
      ADD CONSTRAINT "FK_appointments_professional" 
      FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments" 
      ADD CONSTRAINT "FK_appointments_service" 
      FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop Foreign Keys
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_service"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_professional"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_user"`,
    );

    // Drop Tables
    await queryRunner.query(`DROP TABLE "conversation_states"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "professionals"`);

    // Drop Enums
    await queryRunner.query(`DROP TYPE "public"."conversation_step_enum"`);
    await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
  }
}
