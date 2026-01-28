import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeleteDateToProfessional1769469200000 implements MigrationInterface {
  name = 'AddDeleteDateToProfessional1769469200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "professionals" ADD "deleted_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "professionals" DROP COLUMN "deleted_at"`,
    );
  }
}
