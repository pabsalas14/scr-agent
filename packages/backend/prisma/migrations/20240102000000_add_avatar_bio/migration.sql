-- AlterTable: add avatar and bio fields to users
ALTER TABLE "users" ADD COLUMN "avatar" VARCHAR(500);
ALTER TABLE "users" ADD COLUMN "bio" VARCHAR(500);
