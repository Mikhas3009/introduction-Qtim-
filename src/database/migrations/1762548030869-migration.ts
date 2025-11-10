import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1762548030869 implements MigrationInterface {
  name = 'Migration1762548030869';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("user_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_login" character varying NOT NULL, "user_password" character varying NOT NULL, "user_name" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_b594fa42404cdfe257bb72a582b" UNIQUE ("user_login"), CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "articles" ("article_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "article_name" character varying NOT NULL, "article_description" text, "author_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_b9a16e8d0dc20426e1611e560bc" PRIMARY KEY ("article_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_articles_author_id" ON "articles" ("author_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_articles_author_created_at" ON "articles" ("author_id", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "FK_6515da4dff8db423ce4eb841490" FOREIGN KEY ("author_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "FK_6515da4dff8db423ce4eb841490"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_articles_author_created_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_articles_author_id"`);
    await queryRunner.query(`DROP TABLE "articles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
