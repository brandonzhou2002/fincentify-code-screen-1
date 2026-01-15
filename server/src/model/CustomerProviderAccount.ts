import { Field, ID, ObjectType } from 'type-graphql';
import {
  CustomerProviderAccount as PrismaCustomerProviderAccount,
  PaymentProvider,
  Prisma,
} from '@prisma/client';
import db from 'util/db';
import Result from 'lib/Result';
import ApplicationError, { DatabaseError } from 'lib/ApplicationError';
import Response from 'endpoint/response/Response';

export interface CreateCustomerProviderAccountInput {
  customer_id: string;
  provider: PaymentProvider;
  provider_account_id: string;
  additional_data?: Prisma.JsonValue;
}

export interface UpdateCustomerProviderAccountInput {
  provider_account_id?: string;
  additional_data?: Prisma.JsonValue;
}

@ObjectType()
export default class CustomerProviderAccount implements PrismaCustomerProviderAccount {
  @Field((type) => ID)
  id: string;

  @Field()
  provider: PaymentProvider;

  @Field()
  provider_account_id: string;

  @Field()
  customer_id: string;

  additional_data: Prisma.JsonValue;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  constructor(provider_account: PrismaCustomerProviderAccount | any) {
    Object.assign(this, provider_account);
  }

  static async create(input: CreateCustomerProviderAccountInput): Promise<Result<CustomerProviderAccount, ApplicationError>> {
    try {
      const provider_account = await db.customerProviderAccount.create({
        data: {
          customer_id: input.customer_id,
          provider: input.provider,
          provider_account_id: input.provider_account_id,
          additional_data: input.additional_data,
        },
      });

      return Result.success(new CustomerProviderAccount(provider_account));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to create customer provider account'));
    }
  }

  static async fetch_by_id(id: string): Promise<Result<CustomerProviderAccount | null, ApplicationError>> {
    try {
      const provider_account = await db.customerProviderAccount.findUnique({
        where: { id },
      });

      return Result.success(provider_account ? new CustomerProviderAccount(provider_account) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch customer provider account'));
    }
  }

  static async fetch_by_customer_and_provider(
    customer_id: string,
    provider: PaymentProvider
  ): Promise<Result<CustomerProviderAccount | null, ApplicationError>> {
    try {
      const provider_account = await db.customerProviderAccount.findFirst({
        where: {
          customer_id,
          provider,
        },
      });

      return Result.success(provider_account ? new CustomerProviderAccount(provider_account) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch customer provider account'));
    }
  }

  static async fetch_by_customer_id(customer_id: string): Promise<Result<CustomerProviderAccount[], ApplicationError>> {
    try {
      const provider_accounts = await db.customerProviderAccount.findMany({
        where: { customer_id },
      });

      return Result.success(provider_accounts.map((pa) => new CustomerProviderAccount(pa)));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch customer provider accounts'));
    }
  }

  static async update(id: string, input: UpdateCustomerProviderAccountInput): Promise<Result<CustomerProviderAccount, ApplicationError>> {
    try {
      const provider_account = await db.customerProviderAccount.update({
        where: { id },
        data: input,
      });

      return Result.success(new CustomerProviderAccount(provider_account));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to update customer provider account'));
    }
  }

  static async delete(id: string): Promise<Result<CustomerProviderAccount, ApplicationError>> {
    try {
      const provider_account = await db.customerProviderAccount.delete({
        where: { id },
      });

      return Result.success(new CustomerProviderAccount(provider_account));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to delete customer provider account'));
    }
  }
}

@ObjectType()
export class CustomerProviderAccountResponse extends Response(CustomerProviderAccount) {}
