import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtensionToMessageTemplates1768272500000 implements MigrationInterface {
  name = 'AddExtensionToMessageTemplates1768272500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message_templates" ADD "extension" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message_templates" DROP COLUMN "extension"`,
    );
  }
}
