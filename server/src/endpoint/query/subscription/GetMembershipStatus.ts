import { Field, Int, ObjectType, Query, Resolver, UseMiddleware } from 'type-graphql';
import User from 'model/User';
import Subscription from 'model/Subscription';
import BillingCycle from 'model/BillingCycle';
import CustomerAccount from 'model/CustomerAccount';
import Result from 'lib/Result';
import Response from 'endpoint/response/Response';
import Authenticate, { ValidatedUser } from 'endpoint/middleware/Authenticate';
import EnsureCustomer from 'endpoint/middleware/EnsureCustomer';
import get_membership_status from 'service/subscription/get_membership_status';

@ObjectType()
export class MembershipStatus {
  @Field()
  has_subscription: boolean;

  @Field(() => Subscription, { nullable: true })
  subscription?: Subscription;

  @Field(() => BillingCycle, { nullable: true })
  current_billing_cycle?: BillingCycle;

  @Field(() => CustomerAccount, { nullable: true })
  account?: CustomerAccount;

  @Field(() => Int)
  account_balance: number;

  @Field({ nullable: true })
  next_billing_date?: Date;

  @Field()
  is_trial: boolean;

  @Field(() => Int)
  days_remaining_in_cycle: number;

  constructor(data: any) {
    this.has_subscription = data.has_subscription;
    this.subscription = data.subscription;
    this.current_billing_cycle = data.current_billing_cycle;
    this.account = data.account;
    this.account_balance = data.account_balance;
    this.next_billing_date = data.next_billing_date;
    this.is_trial = data.is_trial;
    this.days_remaining_in_cycle = data.days_remaining_in_cycle;
  }
}

@ObjectType()
export class MembershipStatusResponse extends Response(MembershipStatus) {}

@Resolver()
export default class GetMembershipStatus {
  @Query(() => MembershipStatusResponse)
  @UseMiddleware(Authenticate)
  @UseMiddleware(EnsureCustomer)
  async get_membership_status(@ValidatedUser() user: User): Promise<MembershipStatusResponse> {
    const result = await get_membership_status({ user });

    if (!result.ok) {
      return new MembershipStatusResponse(Result.fail(result.error));
    }

    return new MembershipStatusResponse(Result.success(new MembershipStatus(result.data)));
  }
}
