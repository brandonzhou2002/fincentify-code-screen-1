import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';
import {
  PaymentMethod as PrismaPaymentMethod,
  PaymentMethodType,
  PaymentMethodStatus,
  CardNetwork,
  CardFundingType,
  Prisma,
} from '@prisma/client';
import db from 'util/db';
import Result from 'lib/Result';
import ApplicationError, { DatabaseError } from 'lib/ApplicationError';
import Response from 'endpoint/response/Response';
import PaymentMethodProcessor from './PaymentMethodProcessor';

// Register enums with type-graphql
registerEnumType(PaymentMethodType, { name: 'PaymentMethodType' });
registerEnumType(PaymentMethodStatus, { name: 'PaymentMethodStatus' });
registerEnumType(CardNetwork, { name: 'CardNetwork' });
registerEnumType(CardFundingType, { name: 'CardFundingType' });

export interface CreatePaymentMethodInput {
  customer_id?: string;
  type?: PaymentMethodType;
  status?: PaymentMethodStatus;
  // Bank fields
  account_nb?: string;
  routing_nb?: string;
  account_name?: string;
  account_type?: string;
  // Card fields
  iin?: string;
  last4?: string;
  exp_month?: string;
  exp_year?: string;
  card_network?: CardNetwork;
  card_brand?: string;
  card_pan?: string;
  card_cvv?: string;
  card_hash?: string;
  card_postal_code?: string;
  funding_type?: CardFundingType;
  issuer?: string;
  data?: Prisma.JsonValue;
}

export interface UpdatePaymentMethodInput {
  status?: PaymentMethodStatus;
  exp_month?: string;
  exp_year?: string;
  default?: boolean;
  deleted?: boolean;
  deleted_at?: Date;
  deleted_by?: string;
  memo?: string;
  issuer?: string;
  funding_type?: CardFundingType;
  card_network?: CardNetwork;
  data?: Prisma.JsonValue;
}

@ObjectType()
export default class PaymentMethod implements PrismaPaymentMethod {
  @Field((type) => ID)
  id: string;

  @Field((type) => PaymentMethodType)
  type: PaymentMethodType;

  @Field((type) => PaymentMethodStatus)
  status: PaymentMethodStatus;

  @Field({ nullable: true })
  customer_id: string | null;

  @Field({ nullable: true })
  issuer: string | null;

  @Field({ nullable: true })
  iin: string | null;

  @Field({ nullable: true })
  last4: string | null;

  @Field({ nullable: true })
  exp_month: string | null;

  @Field({ nullable: true })
  exp_year: string | null;

  @Field((type) => CardNetwork, { nullable: true })
  card_network: CardNetwork | null;

  @Field({ nullable: true })
  card_brand: string | null;

  // Sensitive fields - not exposed via GraphQL
  card_pan: string | null;
  card_cvv: string | null;
  card_hash: string | null;
  card_postal_code: string | null;
  account_nb: string | null;

  @Field({ nullable: true })
  routing_nb: string | null;

  @Field({ nullable: true })
  account_name: string | null;

  @Field({ nullable: true })
  account_type: string | null;

  @Field((type) => CardFundingType, { nullable: true })
  funding_type: CardFundingType | null;

  @Field()
  default: boolean;

  @Field()
  deleted: boolean;

  @Field({ nullable: true })
  deleted_at: Date | null;

  @Field({ nullable: true })
  deleted_by: string | null;

  @Field({ nullable: true })
  memo: string | null;

  data: Prisma.JsonValue;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  // Relations
  @Field((type) => [PaymentMethodProcessor], { nullable: true })
  processors?: PaymentMethodProcessor[];

  constructor(payment_method: PrismaPaymentMethod | any) {
    Object.assign(this, payment_method);
  }

  static async create(input: CreatePaymentMethodInput): Promise<Result<PaymentMethod, ApplicationError>> {
    try {
      const payment_method = await db.paymentMethod.create({
        data: {
          customer_id: input.customer_id,
          type: input.type ?? PaymentMethodType.CARD,
          account_nb: input.account_nb,
          routing_nb: input.routing_nb,
          account_name: input.account_name,
          account_type: input.account_type,
          iin: input.iin,
          last4: input.last4,
          exp_month: input.exp_month,
          exp_year: input.exp_year,
          card_network: input.card_network,
          card_brand: input.card_brand,
          card_pan: input.card_pan,
          card_cvv: input.card_cvv,
          card_hash: input.card_hash,
          card_postal_code: input.card_postal_code,
          funding_type: input.funding_type,
          issuer: input.issuer,
          data: input.data,
        },
      });

      return Result.success(new PaymentMethod(payment_method));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to create payment method'));
    }
  }

  static async fetch_by_id(id: string): Promise<Result<PaymentMethod | null, ApplicationError>> {
    try {
      const payment_method = await db.paymentMethod.findUnique({
        where: { id },
        include: {
          processors: true,
        },
      });

      return Result.success(payment_method ? new PaymentMethod(payment_method) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch payment method'));
    }
  }

  static async fetch_by_customer_id(customer_id: string, include_deleted = false): Promise<Result<PaymentMethod[], ApplicationError>> {
    try {
      const payment_methods = await db.paymentMethod.findMany({
        where: {
          customer_id,
          deleted: include_deleted ? undefined : false,
        },
        include: {
          processors: true,
        },
      });

      return Result.success(payment_methods.map((pm) => new PaymentMethod(pm)));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch payment methods'));
    }
  }

  // Alias for fetch_by_customer_id for compatibility
  static async fetch_by_user_id(user_id: string, include_deleted = false): Promise<Result<PaymentMethod[], ApplicationError>> {
    return PaymentMethod.fetch_by_customer_id(user_id, include_deleted);
  }

  static async remove_existing_defaults(customer_id: string): Promise<Result<void, ApplicationError>> {
    try {
      await db.paymentMethod.updateMany({
        where: {
          customer_id,
          default: true,
          deleted: false,
        },
        data: {
          default: false,
        },
      });

      return Result.success(undefined);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to remove existing defaults'));
    }
  }

  static async update(id: string, input: UpdatePaymentMethodInput): Promise<Result<PaymentMethod, ApplicationError>> {
    try {
      const payment_method = await db.paymentMethod.update({
        where: { id },
        data: input,
      });

      return Result.success(new PaymentMethod(payment_method));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to update payment method'));
    }
  }

  static async soft_delete(id: string, deleted_by?: string): Promise<Result<PaymentMethod, ApplicationError>> {
    try {
      const payment_method = await db.paymentMethod.update({
        where: { id },
        data: {
          deleted: true,
          deleted_at: new Date(),
          deleted_by,
          status: PaymentMethodStatus.DELETED,
        },
      });

      return Result.success(new PaymentMethod(payment_method));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to delete payment method'));
    }
  }

  /**
   * Fetch a non-deleted card with the given hash that does NOT belong to the specified customer.
   * Used for KYC cross-user duplicate detection.
   */
  static async fetch_not_expired_by_card_hash({
    card_hash,
    not_customer_id,
  }: {
    card_hash: string;
    not_customer_id: string;
  }): Promise<Result<PaymentMethod | null, ApplicationError>> {
    try {
      const payment_method = await db.paymentMethod.findFirst({
        where: {
          card_hash,
          customer_id: { not: not_customer_id },
          deleted: false,
          type: PaymentMethodType.CARD,
          status: { in: [PaymentMethodStatus.VALID, PaymentMethodStatus.PROCESSING] },
        },
      });

      return Result.success(payment_method ? new PaymentMethod(payment_method) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch payment method by card hash'));
    }
  }

  /**
   * Soft-delete all other cards with the same hash for the same customer.
   * Used for within-user duplicate cleanup when adding a new card.
   */
  static async soft_delete_duplicates_by_hash({
    customer_id,
    card_hash,
    exclude_id,
  }: {
    customer_id: string;
    card_hash: string;
    exclude_id: string;
  }): Promise<Result<number, ApplicationError>> {
    try {
      const result = await db.paymentMethod.updateMany({
        where: {
          customer_id,
          card_hash,
          id: { not: exclude_id },
          deleted: false,
          type: PaymentMethodType.CARD,
        },
        data: {
          status: PaymentMethodStatus.DELETED,
          deleted: true,
          deleted_at: new Date(),
          deleted_by: 'system on same card hash add',
        },
      });

      return Result.success(result.count);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to delete duplicate payment methods'));
    }
  }
}

@ObjectType()
export class PaymentMethodResponse extends Response(PaymentMethod) {}

@ObjectType()
export class PaymentMethodList {
  @Field((type) => [PaymentMethod])
  items: PaymentMethod[];

  constructor(items: PaymentMethod[]) {
    this.items = items;
  }
}

@ObjectType()
export class PaymentMethodListResponse extends Response(PaymentMethodList) {}
