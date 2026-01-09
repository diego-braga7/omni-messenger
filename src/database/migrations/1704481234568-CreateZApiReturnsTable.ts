import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateZApiReturnsTable1704481234568 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'z_api_returns',
        columns: [
          {
            name: 'message_id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'zaap_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'z_api_returns',
      new TableForeignKey({
        columnNames: ['message_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'messages',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'z_api_returns',
      new TableIndex({
        name: 'IDX_Z_API_RETURNS_ZAAP_ID',
        columnNames: ['zaap_id'],
      }),
    );

    await queryRunner.createIndex(
      'z_api_returns',
      new TableIndex({
        name: 'IDX_Z_API_RETURNS_ID',
        columnNames: ['id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('z_api_returns');
  }
}
