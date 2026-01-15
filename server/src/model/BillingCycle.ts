import { Field, ID, Int, ObjectType, registerEnumType } from 'type-graphql';
import { BillingCycle as PrismaBillingCycle, BillingCycleStatus } from '@prisma/client';
import Result from 'lib/Result';
import ApplicationError, { DatabaseError } from 'lib/ApplicationError';
import Response from 'endpoint/response/Response';
import db from 'util/db';

// Register enums with type-graphql
registerEnumType(BillingCycleStatus, { name: 'BillingCycleStatus' });

export interface CreateBillingCycleInput {
  subscription_id?: string;
  start_date: Date;
  end_date: Date;
  status?: BillingCycleStatus;
  payment_amount?: number;
}

export interface UpdateBillingCycleInput {
  status?: BillingCycleStatus;
  days_overdue?: number;
  payment_date?: Date;
  payment_amount?: number;
  memo?: string;
  deleted?: boolean;
  deleted_at?: Date;
}

@ObjectType()
export default class BillingCycle implements PrismaBillingCycle {
  @Field((type) => ID)
  id: string;

  @Field()
  start_date: Date;

  @Field()
  end_date: Date;

  @Field((type) => BillingCycleStatus, { nullable: true })
  status: BillingCycleStatus | null;

  @Field({ nullable: true })
  subscription_id: string | null;

  @Field((type) => Int, { nullable: true })
  days_overdue: number | null;

  @Field({ nullable: true })
  payment_date: Date | null;

  @Field((type) => Int, { nullable: true })
  payment_amount: number | null;

  @Field({ nullable: true })
  memo: string | null;

  @Field()
  deleted: boolean;

  @Field({ nullable: true })
  deleted_at: Date | null;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  constructor(billing_cycle: PrismaBillingCycle | any) {
    Object.assign(this, billing_cycle);
  }

  static async create(input: CreateBillingCycleInput): Promise<Result<BillingCycle, ApplicationError>> {
    try {
      const billing_cycle = await db.billingCycle.create({
        data: {
          subscription_id: input.subscription_id,
          start_date: input.start_date,
          end_date: input.end_date,
          status: input.status ?? BillingCycleStatus.NEW,
          payment_amount: input.payment_amount,
        },
      });

      return Result.success(new BillingCycle(billing_cycle));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to create billing cycle'));
    }
  }

  static async fetch_by_id(id: string): Promise<Result<BillingCycle | null, ApplicationError>> {
    try {
      const billing_cycle = await db.billingCycle.findUnique({
        where: { id },
      });

      return Result.success(billing_cycle ? new BillingCycle(billing_cycle) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch billing cycle'));
    }
  }

  static async fetch_by_subscription_id(subscription_id: string): Promise<Result<BillingCycle[], ApplicationError>> {
    try {
      const billing_cycles = await db.billingCycle.findMany({
        where: { subscription_id, deleted: false },
        orderBy: { start_date: 'desc' },
      });

      return Result.success(billing_cycles.map((bc) => new BillingCycle(bc)));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch billing cycles'));
    }
  }

  static async update(id: string, input: UpdateBillingCycleInput): Promise<Result<BillingCycle, ApplicationError>> {
    try {
      const billing_cycle = await db.billingCycle.update({
        where: { id },
        data: input,
      });

      return Result.success(new BillingCycle(billing_cycle));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to update billing cycle'));
    }
  }

  static async soft_delete(id: string): Promise<Result<BillingCycle, ApplicationError>> {
    try {
      const billing_cycle = await db.billingCycle.update({
        where: { id },
        data: {
          deleted: true,
          deleted_at: new Date(),
        },
      });

      return Result.success(new BillingCycle(billing_cycle));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to delete billing cycle'));
    }
  }
}

@ObjectType()
export class BillingCycleResponse extends Response(BillingCycle) {}
