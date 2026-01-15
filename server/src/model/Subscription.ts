import { Field, ID, Int, ObjectType, registerEnumType } from 'type-graphql';
import {
  Subscription as PrismaSubscription,
  SubscriptionStatus,
  SubscriptionType,
  SubscriptionProcessingStatus,
} from '@prisma/client';
import db from 'util/db';
import Result from 'lib/Result';
import ApplicationError, { DatabaseError } from 'lib/ApplicationError';
import Response from 'endpoint/response/Response';
import CustomerAccount from './CustomerAccount';
import BillingCycle from './BillingCycle';

// Register enums with type-graphql
registerEnumType(SubscriptionStatus, { name: 'SubscriptionStatus' });
registerEnumType(SubscriptionType, { name: 'SubscriptionType' });
registerEnumType(SubscriptionProcessingStatus, { name: 'SubscriptionProcessingStatus' });

export interface CreateSubscriptionInput {
  customer_id: string;
  account_id: string;
  type?: SubscriptionType;
  amount: number;
  start_date?: Date;
}

export interface UpdateSubscriptionInput {
  status?: SubscriptionStatus;
  processing_status?: SubscriptionProcessingStatus;
  inactive_after?: Date;
  current_billing_cycle_id?: string;
  amount?: number;
  payment_failure_cnt?: number;
  last_marking_start?: Date;
  last_marking_end?: Date;
}

@ObjectType()
export default class Subscription implements PrismaSubscription {
  @Field((type) => ID)
  id: string;

  @Field()
  customer_id: string;

  @Field()
  account_id: string;

  @Field((type) => SubscriptionType)
  type: SubscriptionType;

  @Field((type) => SubscriptionStatus, { nullable: true })
  status: SubscriptionStatus | null;

  @Field((type) => SubscriptionProcessingStatus)
  processing_status: SubscriptionProcessingStatus;

  @Field()
  start_date: Date;

  @Field({ nullable: true })
  inactive_after: Date | null;

  @Field({ nullable: true })
  current_billing_cycle_id: string | null;

  @Field((type) => Int)
  amount: number;

  @Field((type) => Int)
  payment_failure_cnt: number;

  @Field({ nullable: true })
  last_marking_start: Date | null;

  @Field({ nullable: true })
  last_marking_end: Date | null;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  // Relations (populated when included in queries)
  @Field((type) => CustomerAccount, { nullable: true })
  account?: CustomerAccount;

  @Field((type) => BillingCycle, { nullable: true })
  current_billing_cycle?: BillingCycle;

  constructor(subscription: PrismaSubscription | any) {
    Object.assign(this, subscription);
  }

  static async create(input: CreateSubscriptionInput): Promise<Result<Subscription, ApplicationError>> {
    try {
      const subscription = await db.subscription.create({
        data: {
          customer_id: input.customer_id,
          account_id: input.account_id,
          type: input.type ?? SubscriptionType.MEMBERSHIP,
          amount: input.amount,
          start_date: input.start_date ?? new Date(),
        },
      });

      return Result.success(new Subscription(subscription));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to create subscription'));
    }
  }

  static async fetch_by_id(id: string): Promise<Result<Subscription | null, ApplicationError>> {
    try {
      const subscription = await db.subscription.findUnique({
        where: { id },
        include: {
          account: true,
          current_billing_cycle: true,
        },
      });

      return Result.success(subscription ? new Subscription(subscription) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch subscription'));
    }
  }

  static async fetch_by_customer_id(customer_id: string): Promise<Result<Subscription | null, ApplicationError>> {
    try {
      const subscription = await db.subscription.findUnique({
        where: { customer_id },
        include: {
          account: true,
          current_billing_cycle: true,
        },
      });

      return Result.success(subscription ? new Subscription(subscription) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch subscription'));
    }
  }

  static async update(id: string, input: UpdateSubscriptionInput): Promise<Result<Subscription, ApplicationError>> {
    try {
      const subscription = await db.subscription.update({
        where: { id },
        data: input,
      });

      return Result.success(new Subscription(subscription));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to update subscription'));
    }
  }

  static async delete(id: string): Promise<Result<Subscription, ApplicationError>> {
    try {
      const subscription = await db.subscription.delete({
        where: { id },
      });

      return Result.success(new Subscription(subscription));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to delete subscription'));
    }
  }
}

@ObjectType()
export class SubscriptionResponse extends Response(Subscription) {}
