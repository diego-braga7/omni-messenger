import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserAndRelations1736070000000 implements MigrationInterface {
    name = 'CreateUserAndRelations1736070000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying,
                "phone" character varying NOT NULL,
                "email" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`ALTER TABLE "messages" ADD "user_id" uuid`);
        
        await queryRunner.query(`
            ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_user"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "user_id"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
