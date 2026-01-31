import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateZApiReturnsTable1704481234568 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Running CreateZApiReturnsTable1704481234568...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "z_api_returns" (
        "message_id" uuid NOT NULL,
        "zaap_id" character varying NOT NULL,
        "id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_z_api_returns" PRIMARY KEY ("message_id")
      )
    `);

    console.log('Table z_api_returns created (or exists). Creating FK...');

    // Check if FK exists to avoid error if re-running
    // But since we use a specific name, we can try to drop it first if we want, or just create.
    // However, clean creation is better.
    // If table existed, FK might exist.
    // Let's assume clean slate or robust handling.
    // Since we use IF NOT EXISTS for table, if table exists, we assume FK exists?
    // Not necessarily.
    // Let's just try to create it. If it fails, it fails.
    // But to be safe, we can check.
    // Actually, simple is better. If table was just created, FK doesn't exist.

    // Using queryRunner.query avoids TypeORM metadata inspection overhead/issues
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_z_api_returns_message') THEN
          ALTER TABLE "z_api_returns"
          ADD CONSTRAINT "FK_z_api_returns_message"
          FOREIGN KEY ("message_id")
          REFERENCES "messages"("id")
          ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    console.log('FK created. Creating indexes...');

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Z_API_RETURNS_ZAAP_ID" ON "z_api_returns" ("zaap_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Z_API_RETURNS_ID" ON "z_api_returns" ("id")`,
    );

    console.log('CreateZApiReturnsTable1704481234568 finished.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "z_api_returns"`);
  }
}
