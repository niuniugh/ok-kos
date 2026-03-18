/*
  Warnings:

  - Added the required column `name` to the `owners` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "owners" ADD COLUMN     "name" TEXT NOT NULL;
