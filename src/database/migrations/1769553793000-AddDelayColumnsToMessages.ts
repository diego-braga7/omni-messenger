import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDelayColumnsToMessages1769553793000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'messages',
      new TableColumn({
        name: 'delay_message',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'messages',
      new TableColumn({
        name: 'delay_typing',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('messages', 'delay_typing');
    await queryRunner.dropColumn('messages', 'delay_message');
  }
}
