-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CustomerAccountType" AS ENUM ('SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "BillingAccountStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "BillingAccountRating" AS ENUM ('NA', 'NEW', 'OK', 'MISSED', 'D30', 'D60', 'D90', 'D120', 'D150', 'D180', 'WRITTEN_OFF', 'PAID_PREV_WRITE_OFF');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAYMENT_FAILED', 'OVERDUE', 'SCHEDULED_CANCELLATION', 'CANCELLED', 'DEACTIVATED', 'WRITTEN_OFF', 'AWAITING_PAYMENT_CONFIRMATION');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('MEMBERSHIP');

-- CreateEnum
CREATE TYPE "SubscriptionProcessingStatus" AS ENUM ('NONE', 'PROCESSING');

-- CreateEnum
CREATE TYPE "SubscriptionCancellationReason" AS ENUM ('TECHNICAL_ISSUE', 'MEMBERSHIP_TOO_EXPENSIVE', 'NOT_USING_SERVICE', 'FOUND_BETTER_ALTERNATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriptionCancellationRequestStatus" AS ENUM ('CONTACT_SUPPORT', 'NEED_REASON', 'INITIAL', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "BillingCycleStatus" AS ENUM ('NEW', 'UNPAID', 'REFUNDED', 'TRIAL', 'PAID', 'FREE_CREDIT', 'CANCELLED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SCHEDULED', 'PENDING', 'SENT', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'BATCH_PROCESSING', 'BATCH_FILE_ADDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SUBSCRIPTION', 'SUBSCRIPTION_RETRY', 'SUBSCRIPTION_RETRY_LATER', 'SUBSCRIPTION_MANUAL', 'SUBSCRIPTION_ADMIN', 'SUBSCRIPTION_FUNDING_SETTLEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentTrack" AS ENUM ('BANK_ACH', 'BANK_RTP', 'BANK_CARD', 'BANK_CARD_VD', 'ANY_CARD');

-- CreateEnum
CREATE TYPE "PaymentDirectionType" AS ENUM ('ACCOUNT_PAYABLE', 'ACCOUNT_RECEIVABLE');

-- CreateEnum
CREATE TYPE "PaymentAsyncProcessingStatus" AS ENUM ('READY', 'IN_PROGRESS', 'ADDED_TO_FILE', 'SENT_TO_PROCESSOR');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('BANK', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentMethodStatus" AS ENUM ('PROCESSING', 'VALID', 'INVALID', 'DELETED', 'EXPIRED', 'BLOCKED', 'ADD_FAILED');

-- CreateEnum
CREATE TYPE "CardNetwork" AS ENUM ('VISA', 'MASTERCARD', 'AMERICAN_EXPRESS', 'DISCOVER', 'UNIONPAY', 'JCB');

-- CreateEnum
CREATE TYPE "CardFundingType" AS ENUM ('CREDIT', 'DEBIT', 'PREPAID');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('NUVEI', 'ZUMRAILS', 'BRAINTREE', 'BERKELEY', 'STRIPE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAccount" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "type" "CustomerAccountType" NOT NULL,
    "status" "BillingAccountStatus" NOT NULL DEFAULT 'OPEN',
    "rating" "BillingAccountRating" NOT NULL DEFAULT 'NA',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "balance_due_date" TIMESTAMP(3),
    "balance_past_due" INTEGER DEFAULT 0,
    "first_delinquent_date" TIMESTAMP(3),
    "last_successful_payment_amount" INTEGER,
    "last_successful_payment_date" TIMESTAMP(3),
    "last_failed_payment_amount" INTEGER,
    "last_failed_payment_date" TIMESTAMP(3),
    "authorization_rate" DOUBLE PRECISION,
    "nsf_count" INTEGER,
    "card_block_count" INTEGER,
    "payment_history" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_payment_history_update" TIMESTAMP(3),
    "last_marking_date" TIMESTAMP(3),
    "metadata" JSONB,
    "opened_on" TIMESTAMP(3),
    "closed_on" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" "SubscriptionType" NOT NULL DEFAULT 'MEMBERSHIP',
    "status" "SubscriptionStatus" DEFAULT 'TRIAL',
    "processing_status" "SubscriptionProcessingStatus" NOT NULL DEFAULT 'NONE',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inactive_after" TIMESTAMP(3),
    "current_billing_cycle_id" TEXT,
    "amount" INTEGER NOT NULL,
    "payment_failure_cnt" INTEGER NOT NULL DEFAULT 0,
    "last_marking_start" TIMESTAMP(3),
    "last_marking_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCycle" (
    "id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "BillingCycleStatus" DEFAULT 'NEW',
    "subscription_id" TEXT,
    "days_overdue" INTEGER DEFAULT 0,
    "payment_date" TIMESTAMP(3),
    "payment_amount" INTEGER,
    "memo" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionCancellationRequest" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "reason" "SubscriptionCancellationReason",
    "status" "SubscriptionCancellationRequestStatus" NOT NULL DEFAULT 'INITIAL',
    "memo" TEXT,
    "requested_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionCancellationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL DEFAULT 'BANK',
    "status" "PaymentMethodStatus" NOT NULL DEFAULT 'PROCESSING',
    "customer_id" TEXT,
    "issuer" TEXT,
    "iin" TEXT,
    "last4" TEXT,
    "exp_month" TEXT,
    "exp_year" TEXT,
    "card_network" "CardNetwork",
    "card_brand" TEXT,
    "card_pan" TEXT,
    "card_cvv" TEXT,
    "card_hash" TEXT,
    "card_postal_code" TEXT,
    "account_nb" TEXT,
    "routing_nb" TEXT,
    "account_name" TEXT,
    "account_type" TEXT,
    "funding_type" "CardFundingType",
    "default" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "memo" TEXT,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethodProcessor" (
    "id" TEXT NOT NULL,
    "processor_external_id" TEXT,
    "provider_name" "PaymentProvider" NOT NULL,
    "payment_method_id" TEXT NOT NULL,
    "provider_account_id" TEXT,
    "is_recurring" BOOLEAN DEFAULT false,
    "processor_external_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethodProcessor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProviderAccount" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "additional_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProviderAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "code" INTEGER,
    "direction" "PaymentDirectionType",
    "track" "PaymentTrack",
    "type" "PaymentType" NOT NULL DEFAULT 'OTHER',
    "date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "transaction_id" TEXT,
    "account_id" TEXT NOT NULL,
    "payment_method_id" TEXT,
    "payment_method_processor_id" TEXT,
    "subscription_id" TEXT,
    "billing_cycle_id" TEXT,
    "retry_routing_ctx" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retry_sequence_nb" INTEGER NOT NULL DEFAULT 0,
    "retry_prev_payment_id" TEXT,
    "retry_annotation" TEXT,
    "retry_trace_data" JSONB,
    "retry_logic_version" INTEGER,
    "memo" TEXT,
    "fail_reason" TEXT,
    "processing_split_key" INTEGER,
    "async_processing_status" "PaymentAsyncProcessingStatus",
    "async_processing_reference_id" TEXT,
    "async_processing_input_file_id" TEXT,
    "async_processing_output_file_id" TEXT,
    "gateway_context_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "CustomerAccount_customer_id_idx" ON "CustomerAccount"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_customer_id_key" ON "Subscription"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_account_id_key" ON "Subscription"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_current_billing_cycle_id_key" ON "Subscription"("current_billing_cycle_id");

-- CreateIndex
CREATE INDEX "Subscription_customer_id_idx" ON "Subscription"("customer_id");

-- CreateIndex
CREATE INDEX "Subscription_account_id_idx" ON "Subscription"("account_id");

-- CreateIndex
CREATE INDEX "BillingCycle_subscription_id_idx" ON "BillingCycle"("subscription_id");

-- CreateIndex
CREATE INDEX "SubscriptionCancellationRequest_subscription_id_idx" ON "SubscriptionCancellationRequest"("subscription_id");

-- CreateIndex
CREATE INDEX "PaymentMethod_customer_id_idx" ON "PaymentMethod"("customer_id");

-- CreateIndex
CREATE INDEX "PaymentMethodProcessor_payment_method_id_idx" ON "PaymentMethodProcessor"("payment_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProviderAccount_provider_account_id_key" ON "CustomerProviderAccount"("provider_account_id");

-- CreateIndex
CREATE INDEX "CustomerProviderAccount_customer_id_idx" ON "CustomerProviderAccount"("customer_id");

-- CreateIndex
CREATE INDEX "Payment_date_status_idx" ON "Payment"("date", "status");

-- CreateIndex
CREATE INDEX "Payment_account_id_idx" ON "Payment"("account_id");

-- CreateIndex
CREATE INDEX "Payment_subscription_id_idx" ON "Payment"("subscription_id");

-- CreateIndex
CREATE INDEX "Payment_billing_cycle_id_idx" ON "Payment"("billing_cycle_id");

-- CreateIndex
CREATE INDEX "Payment_async_processing_reference_id_idx" ON "Payment"("async_processing_reference_id");

-- AddForeignKey
ALTER TABLE "CustomerAccount" ADD CONSTRAINT "CustomerAccount_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "CustomerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_current_billing_cycle_id_fkey" FOREIGN KEY ("current_billing_cycle_id") REFERENCES "BillingCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCycle" ADD CONSTRAINT "BillingCycle_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionCancellationRequest" ADD CONSTRAINT "SubscriptionCancellationRequest_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethodProcessor" ADD CONSTRAINT "PaymentMethodProcessor_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethodProcessor" ADD CONSTRAINT "PaymentMethodProcessor_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "CustomerProviderAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProviderAccount" ADD CONSTRAINT "CustomerProviderAccount_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "CustomerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payment_method_processor_id_fkey" FOREIGN KEY ("payment_method_processor_id") REFERENCES "PaymentMethodProcessor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billing_cycle_id_fkey" FOREIGN KEY ("billing_cycle_id") REFERENCES "BillingCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
