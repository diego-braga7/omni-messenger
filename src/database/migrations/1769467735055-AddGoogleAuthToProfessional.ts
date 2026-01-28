import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleAuthToProfessional1769467735055 implements MigrationInterface {
  name = 'AddGoogleAuthToProfessional1769467735055';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "z_api_returns" DROP CONSTRAINT "FK_ad9279700cd415326e8a2032779"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_professional"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_service"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_Z_API_RETURNS_ZAAP_ID"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_Z_API_RETURNS_ID"`);
    await queryRunner.query(
      `ALTER TABLE "professionals" ADD "google_access_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "professionals" ADD "google_refresh_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "professionals" ADD "google_token_expiry" bigint`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."appointment_status_enum" RENAME TO "appointment_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointments_status_enum" AS ENUM('SCHEDULED', 'CANCELED', 'COMPLETED', 'RESCHEDULED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "public"."appointments_status_enum" USING "status"::"text"::"public"."appointments_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'`,
    );
    await queryRunner.query(`DROP TYPE "public"."appointment_status_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."conversation_step_enum" RENAME TO "conversation_step_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_states_step_enum" AS ENUM('SELECT_SERVICE', 'SELECT_PROFESSIONAL', 'SELECT_DATE', 'SELECT_TIME', 'CONFIRMATION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_states" ALTER COLUMN "step" TYPE "public"."conversation_states_step_enum" USING "step"::"text"::"public"."conversation_states_step_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."conversation_step_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "z_api_returns" ADD CONSTRAINT "FK_ad9279700cd415326e8a2032779" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_830a3c1d92614d1495418c46736" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_66dee3bea82328659a4db8e54b7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_60b7a60cf6727d87d525a750414" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_2a2088e8eaa8f28d8de2bdbb857" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_2a2088e8eaa8f28d8de2bdbb857"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_60b7a60cf6727d87d525a750414"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_66dee3bea82328659a4db8e54b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_830a3c1d92614d1495418c46736"`,
    );
    await queryRunner.query(
      `ALTER TABLE "z_api_returns" DROP CONSTRAINT "FK_ad9279700cd415326e8a2032779"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_step_enum_old" AS ENUM('SELECT_SERVICE', 'SELECT_PROFESSIONAL', 'SELECT_DATE', 'SELECT_TIME', 'CONFIRMATION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_states" ALTER COLUMN "step" TYPE "public"."conversation_step_enum_old" USING "step"::"text"::"public"."conversation_step_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."conversation_states_step_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."conversation_step_enum_old" RENAME TO "conversation_step_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_status_enum_old" AS ENUM('SCHEDULED', 'CANCELED', 'COMPLETED', 'RESCHEDULED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "public"."appointment_status_enum_old" USING "status"::"text"::"public"."appointment_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'`,
    );
    await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."appointment_status_enum_old" RENAME TO "appointment_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "professionals" DROP COLUMN "google_token_expiry"`,
    );
    await queryRunner.query(
      `ALTER TABLE "professionals" DROP COLUMN "google_refresh_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "professionals" DROP COLUMN "google_access_token"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_Z_API_RETURNS_ID" ON "z_api_returns" ("id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_Z_API_RETURNS_ZAAP_ID" ON "z_api_returns" ("zaap_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_professional" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "z_api_returns" ADD CONSTRAINT "FK_ad9279700cd415326e8a2032779" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
