import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';
import {
  PaymentMethodProcessor as PrismaPaymentMethodProcessor,
  PaymentProvider,
  Prisma,
} from '@prisma/client';
import db from 'util/db';
import Result from 'lib/Result';
import ApplicationError, { DatabaseError } from 'lib/ApplicationError';
import Response from 'endpoint/response/Response';

// Register enums with type-graphql
registerEnumType(PaymentProvider, { name: 'PaymentProvider' });

export interface CreatePaymentMethodProcessorInput {
  payment_method_id: string;
  provider_name: PaymentProvider;
  processor_external_id?: string;
  provider_account_id?: string;
  is_recurring?: boolean;
  processor_external_data?: Prisma.JsonValue;
}

export interface UpdatePaymentMethodProcessorInput {
  processor_external_id?: string;
  provider_account_id?: string;
  is_recurring?: boolean;
  processor_external_data?: Prisma.JsonValue;
}

@ObjectType()
export default class PaymentMethodProcessor implements PrismaPaymentMethodProcessor {
  @Field((type) => ID)
  id: string;

  @Field({ nullable: true })
  processor_external_id: string | null;

  @Field((type) => PaymentProvider)
  provider_name: PaymentProvider;

  @Field()
  payment_method_id: string;

  @Field({ nullable: true })
  provider_account_id: string | null;

  @Field({ nullable: true })
  is_recurring: boolean | null;

  processor_external_data: Prisma.JsonValue;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  constructor(processor: PrismaPaymentMethodProcessor | any) {
    Object.assign(this, processor);
  }

  static async create(input: CreatePaymentMethodProcessorInput): Promise<Result<PaymentMethodProcessor, ApplicationError>> {
    try {
      const processor = await db.paymentMethodProcessor.create({
        data: {
          payment_method_id: input.payment_method_id,
          provider_name: input.provider_name,
          processor_external_id: input.processor_external_id,
          provider_account_id: input.provider_account_id,
          is_recurring: input.is_recurring ?? false,
          processor_external_data: input.processor_external_data,
        },
      });

      return Result.success(new PaymentMethodProcessor(processor));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to create payment method processor'));
    }
  }

  static async fetch_by_id(id: string): Promise<Result<PaymentMethodProcessor | null, ApplicationError>> {
    try {
      const processor = await db.paymentMethodProcessor.findUnique({
        where: { id },
      });

      return Result.success(processor ? new PaymentMethodProcessor(processor) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch payment method processor'));
    }
  }

  static async fetch_by_payment_method_id(payment_method_id: string): Promise<Result<PaymentMethodProcessor[], ApplicationError>> {
    try {
      const processors = await db.paymentMethodProcessor.findMany({
        where: { payment_method_id },
      });

      return Result.success(processors.map((p) => new PaymentMethodProcessor(p)));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch payment method processors'));
    }
  }

  static async update(id: string, input: UpdatePaymentMethodProcessorInput): Promise<Result<PaymentMethodProcessor, ApplicationError>> {
    try {
      const processor = await db.paymentMethodProcessor.update({
        where: { id },
        data: input,
      });

      return Result.success(new PaymentMethodProcessor(processor));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to update payment method processor'));
    }
  }

  static async delete(id: string): Promise<Result<PaymentMethodProcessor, ApplicationError>> {
    try {
      const processor = await db.paymentMethodProcessor.delete({
        where: { id },
      });

      return Result.success(new PaymentMethodProcessor(processor));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to delete payment method processor'));
    }
  }
}

@ObjectType()
export class PaymentMethodProcessorResponse extends Response(PaymentMethodProcessor) {}
