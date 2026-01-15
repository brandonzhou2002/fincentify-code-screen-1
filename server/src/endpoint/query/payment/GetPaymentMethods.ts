import { Query, Resolver, UseMiddleware } from 'type-graphql';
import PaymentMethod, { PaymentMethodList, PaymentMethodListResponse } from 'model/PaymentMethod';
import User from 'model/User';
import Result from 'lib/Result';
import Authenticate, { ValidatedUser } from 'endpoint/middleware/Authenticate';
import EnsureCustomer from 'endpoint/middleware/EnsureCustomer';

@Resolver()
export default class GetPaymentMethods {
  @Query(() => PaymentMethodListResponse)
  @UseMiddleware(Authenticate)
  @UseMiddleware(EnsureCustomer)
  async get_payment_methods(@ValidatedUser() user: User): Promise<PaymentMethodListResponse> {
    const result = await PaymentMethod.fetch_by_user_id(user.id);

    if (!result.ok) {
      return new PaymentMethodListResponse(Result.fail(result.error));
    }

    return new PaymentMethodListResponse(Result.success(new PaymentMethodList(result.data)));
  }
}
