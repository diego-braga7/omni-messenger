import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFilenameToMessageTemplates1736810000000 implements MigrationInterface {
  name = 'AddFilenameToMessageTemplates1736810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message_templates" ADD "filename" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message_templates" DROP COLUMN "filename"`,
    );
  }
}
