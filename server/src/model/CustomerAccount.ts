import { Field, ID, Int, ObjectType, registerEnumType } from 'type-graphql';
import {
  CustomerAccount as PrismaCustomerAccount,
  CustomerAccountType,
  BillingAccountStatus,
  BillingAccountRating,
  Prisma,
} from '@prisma/client';
import db from 'util/db';
import Result from 'lib/Result';
import ApplicationError, { DatabaseError } from 'lib/ApplicationError';
import Response from 'endpoint/response/Response';

// Register enums with type-graphql
registerEnumType(CustomerAccountType, { name: 'CustomerAccountType' });
registerEnumType(BillingAccountStatus, { name: 'BillingAccountStatus' });
registerEnumType(BillingAccountRating, { name: 'BillingAccountRating' });

export interface CreateCustomerAccountInput {
  customer_id?: string;
  type: CustomerAccountType;
  balance?: number;
  metadata?: Prisma.JsonValue;
}

export interface UpdateCustomerAccountInput {
  status?: BillingAccountStatus;
  rating?: BillingAccountRating;
  balance?: number;
  balance_due_date?: Date;
  balance_past_due?: number;
  first_delinquent_date?: Date;
  last_successful_payment_amount?: number;
  last_successful_payment_date?: Date;
  last_failed_payment_amount?: number;
  last_failed_payment_date?: Date;
  authorization_rate?: number;
  nsf_count?: number;
  card_block_count?: number;
  payment_history?: string[];
  last_payment_history_update?: Date;
  last_marking_date?: Date;
  metadata?: Prisma.JsonValue;
  closed_on?: Date;
}

@ObjectType()
export default class CustomerAccount implements PrismaCustomerAccount {
  @Field((type) => ID)
  id: string;

  @Field({ nullable: true })
  customer_id: string | null;

  @Field((type) => CustomerAccountType)
  type: CustomerAccountType;

  @Field((type) => BillingAccountStatus)
  status: BillingAccountStatus;

  @Field((type) => BillingAccountRating)
  rating: BillingAccountRating;

  @Field((type) => Int)
  balance: number;

  @Field({ nullable: true })
  balance_due_date: Date | null;

  @Field((type) => Int, { nullable: true })
  balance_past_due: number | null;

  @Field({ nullable: true })
  first_delinquent_date: Date | null;

  @Field((type) => Int, { nullable: true })
  last_successful_payment_amount: number | null;

  @Field({ nullable: true })
  last_successful_payment_date: Date | null;

  @Field((type) => Int, { nullable: true })
  last_failed_payment_amount: number | null;

  @Field({ nullable: true })
  last_failed_payment_date: Date | null;

  @Field({ nullable: true })
  authorization_rate: number | null;

  @Field((type) => Int, { nullable: true })
  nsf_count: number | null;

  @Field((type) => Int, { nullable: true })
  card_block_count: number | null;

  @Field((type) => [String])
  payment_history: string[];

  @Field({ nullable: true })
  last_payment_history_update: Date | null;

  @Field({ nullable: true })
  last_marking_date: Date | null;

  metadata: Prisma.JsonValue;

  @Field({ nullable: true })
  opened_on: Date | null;

  @Field({ nullable: true })
  closed_on: Date | null;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  constructor(account: PrismaCustomerAccount | any) {
    Object.assign(this, account);
  }

  static async create(input: CreateCustomerAccountInput): Promise<Result<CustomerAccount, ApplicationError>> {
    try {
      const account = await db.customerAccount.create({
        data: {
          customer_id: input.customer_id,
          type: input.type,
          balance: input.balance ?? 0,
          metadata: input.metadata,
          opened_on: new Date(),
        },
      });

      return Result.success(new CustomerAccount(account));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to create customer account'));
    }
  }

  static async fetch_by_id(id: string): Promise<Result<CustomerAccount | null, ApplicationError>> {
    try {
      const account = await db.customerAccount.findUnique({
        where: { id },
      });

      return Result.success(account ? new CustomerAccount(account) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch customer account'));
    }
  }

  static async fetch_by_customer_id(customer_id: string): Promise<Result<CustomerAccount[], ApplicationError>> {
    try {
      const accounts = await db.customerAccount.findMany({
        where: { customer_id },
      });

      return Result.success(accounts.map((a) => new CustomerAccount(a)));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch customer accounts'));
    }
  }

  static async update(id: string, input: UpdateCustomerAccountInput): Promise<Result<CustomerAccount, ApplicationError>> {
    try {
      const account = await db.customerAccount.update({
        where: { id },
        data: input,
      });

      return Result.success(new CustomerAccount(account));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to update customer account'));
    }
  }

  static async delete(id: string): Promise<Result<CustomerAccount, ApplicationError>> {
    try {
      const account = await db.customerAccount.delete({
        where: { id },
      });

      return Result.success(new CustomerAccount(account));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to delete customer account'));
    }
  }
}

@ObjectType()
export class CustomerAccountResponse extends Response(CustomerAccount) {}
