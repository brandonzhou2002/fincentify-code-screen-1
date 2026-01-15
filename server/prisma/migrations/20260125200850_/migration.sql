/*
  Warnings:

  - The values [BANK] on the enum `PaymentMethodType` will be removed. If these variants are still used in the database, this will fail.
  - The values [NUVEI,ZUMRAILS,BRAINTREE,BERKELEY,STRIPE] on the enum `PaymentProvider` will be removed. If these variants are still used in the database, this will fail.
  - The values [BANK_ACH,BANK_RTP,BANK_CARD_VD] on the enum `PaymentTrack` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethodType_new" AS ENUM ('CARD');
ALTER TABLE "PaymentMethod" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "PaymentMethod" ALTER COLUMN "type" TYPE "PaymentMethodType_new" USING ("type"::text::"PaymentMethodType_new");
ALTER TYPE "PaymentMethodType" RENAME TO "PaymentMethodType_old";
ALTER TYPE "PaymentMethodType_new" RENAME TO "PaymentMethodType";
DROP TYPE "PaymentMethodType_old";
ALTER TABLE "PaymentMethod" ALTER COLUMN "type" SET DEFAULT 'CARD';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentProvider_new" AS ENUM ('PROVIDER_1', 'PROVIDER_2', 'PROVIDER_3', 'PROVIDER_4');
ALTER TABLE "PaymentMethodProcessor" ALTER COLUMN "provider_name" TYPE "PaymentProvider_new" USING ("provider_name"::text::"PaymentProvider_new");
ALTER TABLE "CustomerProviderAccount" ALTER COLUMN "provider" TYPE "PaymentProvider_new" USING ("provider"::text::"PaymentProvider_new");
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
DROP TYPE "PaymentProvider_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentTrack_new" AS ENUM ('BANK_CARD', 'ANY_CARD');
ALTER TABLE "Payment" ALTER COLUMN "track" TYPE "PaymentTrack_new" USING ("track"::text::"PaymentTrack_new");
ALTER TYPE "PaymentTrack" RENAME TO "PaymentTrack_old";
ALTER TYPE "PaymentTrack_new" RENAME TO "PaymentTrack";
DROP TYPE "PaymentTrack_old";
COMMIT;

-- AlterTable
ALTER TABLE "PaymentMethod" ALTER COLUMN "type" SET DEFAULT 'CARD';
