import { Mutation, Resolver, UseMiddleware } from 'type-graphql';
import User from 'model/User';
import { SubscriptionResponse } from 'model/Subscription';
import Result from 'lib/Result';
import Authenticate, { ValidatedUser } from 'endpoint/middleware/Authenticate';
import EnsureCustomer from 'endpoint/middleware/EnsureCustomer';
import restart_membership from 'service/subscription/restart_membership';

@Resolver()
export default class RestartMembership {
  @Mutation(() => SubscriptionResponse)
  @UseMiddleware(Authenticate)
  @UseMiddleware(EnsureCustomer)
  async restart_membership(@ValidatedUser() user: User): Promise<SubscriptionResponse> {
    const result = await restart_membership({ user });

    if (!result.ok) {
      return new SubscriptionResponse(Result.fail(result.error));
    }

    return new SubscriptionResponse(Result.success(result.data.subscription));
  }
}
