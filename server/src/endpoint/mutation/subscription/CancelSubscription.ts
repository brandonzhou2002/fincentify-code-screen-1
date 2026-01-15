import { Mutation, Resolver, UseMiddleware } from 'type-graphql';
import User from 'model/User';
import { SubscriptionResponse } from 'model/Subscription';
import Result from 'lib/Result';
import Authenticate, { ValidatedUser } from 'endpoint/middleware/Authenticate';
import EnsureCustomer from 'endpoint/middleware/EnsureCustomer';
import cancel_subscription from 'service/subscription/cancel_subscription';

@Resolver()
export default class CancelSubscription {
  @Mutation(() => SubscriptionResponse)
  @UseMiddleware(Authenticate)
  @UseMiddleware(EnsureCustomer)
  async cancel_subscription(@ValidatedUser() user: User): Promise<SubscriptionResponse> {
    const result = await cancel_subscription({ user });

    if (!result.ok) {
      return new SubscriptionResponse(Result.fail(result.error));
    }

    return new SubscriptionResponse(Result.success(result.data.subscription));
  }
}
