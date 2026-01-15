import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';
import {
  SubscriptionCancellationRequest as PrismaSubscriptionCancellationRequest,
  SubscriptionCancellationReason,
  SubscriptionCancellationRequestStatus,
} from '@prisma/client';
import db from 'util/db';
import Result from 'lib/Result';
import ApplicationError, { DatabaseError } from 'lib/ApplicationError';
import Response from 'endpoint/response/Response';

// Register enums with type-graphql
registerEnumType(SubscriptionCancellationReason, { name: 'SubscriptionCancellationReason' });
registerEnumType(SubscriptionCancellationRequestStatus, { name: 'SubscriptionCancellationRequestStatus' });

export interface CreateSubscriptionCancellationRequestInput {
  customer_id: string;
  subscription_id: string;
  status?: SubscriptionCancellationRequestStatus;
  reason?: SubscriptionCancellationReason;
  memo?: string;
}

export interface UpdateSubscriptionCancellationRequestInput {
  status?: SubscriptionCancellationRequestStatus;
  reason?: SubscriptionCancellationReason;
  memo?: string;
  processed_at?: Date;
}

@ObjectType()
export default class SubscriptionCancellationRequest implements PrismaSubscriptionCancellationRequest {
  @Field((type) => ID)
  id: string;

  @Field()
  customer_id: string;

  @Field()
  subscription_id: string;

  @Field((type) => SubscriptionCancellationReason, { nullable: true })
  reason: SubscriptionCancellationReason | null;

  @Field((type) => SubscriptionCancellationRequestStatus)
  status: SubscriptionCancellationRequestStatus;

  @Field({ nullable: true })
  memo: string | null;

  @Field({ nullable: true })
  requested_at: Date | null;

  @Field({ nullable: true })
  processed_at: Date | null;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  constructor(request: PrismaSubscriptionCancellationRequest | any) {
    Object.assign(this, request);
  }

  static async create(input: CreateSubscriptionCancellationRequestInput): Promise<Result<SubscriptionCancellationRequest, ApplicationError>> {
    try {
      const request = await db.subscriptionCancellationRequest.create({
        data: {
          customer_id: input.customer_id,
          subscription_id: input.subscription_id,
          status: input.status,
          reason: input.reason,
          memo: input.memo,
          requested_at: new Date(),
        },
      });

      return Result.success(new SubscriptionCancellationRequest(request));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to create subscription cancellation request'));
    }
  }

  static async fetch_by_id(id: string): Promise<Result<SubscriptionCancellationRequest | null, ApplicationError>> {
    try {
      const request = await db.subscriptionCancellationRequest.findUnique({
        where: { id },
      });

      return Result.success(request ? new SubscriptionCancellationRequest(request) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch subscription cancellation request'));
    }
  }

  static async fetch_by_subscription_id(subscription_id: string): Promise<Result<SubscriptionCancellationRequest[], ApplicationError>> {
    try {
      const requests = await db.subscriptionCancellationRequest.findMany({
        where: { subscription_id },
        orderBy: { created_at: 'desc' },
      });

      return Result.success(requests.map((r) => new SubscriptionCancellationRequest(r)));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch subscription cancellation requests'));
    }
  }

  static async fetch_pending_by_subscription_id(subscription_id: string): Promise<Result<SubscriptionCancellationRequest | null, ApplicationError>> {
    try {
      const request = await db.subscriptionCancellationRequest.findFirst({
        where: {
          subscription_id,
          status: {
            in: [
              SubscriptionCancellationRequestStatus.INITIAL,
              SubscriptionCancellationRequestStatus.NEED_REASON,
              SubscriptionCancellationRequestStatus.CONTACT_SUPPORT,
            ],
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return Result.success(request ? new SubscriptionCancellationRequest(request) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch pending subscription cancellation request'));
    }
  }

  static async update(id: string, input: UpdateSubscriptionCancellationRequestInput): Promise<Result<SubscriptionCancellationRequest, ApplicationError>> {
    try {
      const request = await db.subscriptionCancellationRequest.update({
        where: { id },
        data: input,
      });

      return Result.success(new SubscriptionCancellationRequest(request));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to update subscription cancellation request'));
    }
  }

  static async delete(id: string): Promise<Result<SubscriptionCancellationRequest, ApplicationError>> {
    try {
      const request = await db.subscriptionCancellationRequest.delete({
        where: { id },
      });

      return Result.success(new SubscriptionCancellationRequest(request));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to delete subscription cancellation request'));
    }
  }
}

@ObjectType()
export class SubscriptionCancellationRequestResponse extends Response(SubscriptionCancellationRequest) {}
