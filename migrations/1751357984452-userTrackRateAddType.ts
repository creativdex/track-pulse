import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTrackRateAddType1751357984452 implements MigrationInterface {
  name = 'UserTrackRateAddType1751357984452';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_tracker_rates" ADD "context_value" character varying`);
    await queryRunner.query(`ALTER TABLE "user_tracker_rates" ADD "is_active" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(
      `CREATE TYPE "public"."user_tracker_rates_type_enum" AS ENUM('project', 'queue', 'global')`,
    );
    // Сначала добавляем колонку с возможностью NULL
    await queryRunner.query(`ALTER TABLE "user_tracker_rates" ADD "type" "public"."user_tracker_rates_type_enum"`);
    // Устанавливаем значение по умолчанию для существующих записей
    await queryRunner.query(`UPDATE "user_tracker_rates" SET "type" = 'global' WHERE "type" IS NULL`);
    // Теперь делаем колонку NOT NULL
    await queryRunner.query(`ALTER TABLE "user_tracker_rates" ALTER COLUMN "type" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_tracker_rates" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."user_tracker_rates_type_enum"`);
    await queryRunner.query(`ALTER TABLE "user_tracker_rates" ADD "type" character varying`);
    await queryRunner.query(`ALTER TABLE "user_tracker_rates" DROP COLUMN "is_active"`);
    await queryRunner.query(`ALTER TABLE "user_tracker_rates" DROP COLUMN "context_value"`);
    await queryRunner.query(`ALTER TABLE "user_tracker_rates" ADD "queue_key" character varying`);
  }
}
