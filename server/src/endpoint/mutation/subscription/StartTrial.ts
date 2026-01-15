import { Mutation, Resolver, UseMiddleware } from 'type-graphql';
import User from 'model/User';
import { SubscriptionResponse } from 'model/Subscription';
import Result from 'lib/Result';
import Authenticate, { ValidatedUser } from 'endpoint/middleware/Authenticate';
import EnsureCustomer from 'endpoint/middleware/EnsureCustomer';
import start_trial from 'service/subscription/start_trial';

@Resolver()
export default class StartTrial {
  @Mutation(() => SubscriptionResponse)
  @UseMiddleware(Authenticate)
  @UseMiddleware(EnsureCustomer)
  async start_trial(@ValidatedUser() user: User): Promise<SubscriptionResponse> {
    const result = await start_trial({ user });

    if (!result.ok) {
      return new SubscriptionResponse(Result.fail(result.error));
    }

    return new SubscriptionResponse(Result.success(result.data.subscription));
  }
}
