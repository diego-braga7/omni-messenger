import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMessagesTables1704481234567 implements MigrationInterface {
    name = 'CreateMessagesTables1704481234567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Message Templates
        await queryRunner.query(`
            CREATE TYPE "public"."message_templates_type_enum" AS ENUM('TEXT', 'DOCUMENT')
        `);
        await queryRunner.query(`
            CREATE TABLE "message_templates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "content" text NOT NULL,
                "type" "public"."message_templates_type_enum" NOT NULL DEFAULT 'TEXT',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_message_templates" PRIMARY KEY ("id")
            )
        `);

        // Messages
        await queryRunner.query(`
            CREATE TYPE "public"."messages_type_enum" AS ENUM('TEXT', 'DOCUMENT')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."messages_status_enum" AS ENUM('PENDING', 'QUEUED', 'SENT', 'FAILED')
        `);
        await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "to" character varying NOT NULL,
                "content" text NOT NULL,
                "type" "public"."messages_type_enum" NOT NULL DEFAULT 'TEXT',
                "status" "public"."messages_status_enum" NOT NULL DEFAULT 'PENDING',
                "external_id" character varying,
                "template_id" uuid,
                "file_name" character varying,
                "extension" character varying,
                "caption" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_messages" PRIMARY KEY ("id")
            )
        `);

        // Foreign Keys & Indexes
        await queryRunner.query(`
            ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_template" FOREIGN KEY ("template_id") REFERENCES "message_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_messages_status" ON "messages" ("status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_messages_to" ON "messages" ("to")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_messages_created_at" ON "messages" ("created_at")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_messages_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_messages_to"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_messages_status"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_template"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."messages_type_enum"`);
        await queryRunner.query(`DROP TABLE "message_templates"`);
        await queryRunner.query(`DROP TYPE "public"."message_templates_type_enum"`);
    }
}
