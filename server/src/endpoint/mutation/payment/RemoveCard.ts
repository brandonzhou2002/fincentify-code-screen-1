import { Arg, Field, InputType, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import PaymentMethod, { PaymentMethodResponse } from 'model/PaymentMethod';
import User from 'model/User';
import Result from 'lib/Result';
import { UnauthorizedError, ValidationError } from 'common/errors';
import Authenticate, { ValidatedUser } from 'endpoint/middleware/Authenticate';
import EnsureCustomer from 'endpoint/middleware/EnsureCustomer';

@InputType()
export class RemoveCardInput {
  @Field()
  payment_method_id: string;
}

@Resolver()
export default class RemoveCard {
  @Mutation(() => PaymentMethodResponse)
  @UseMiddleware(Authenticate)
  @UseMiddleware(EnsureCustomer)
  async remove_card(
    @Arg('data') data: RemoveCardInput,
    @ValidatedUser() user: User
  ): Promise<PaymentMethodResponse> {
    // Fetch payment method
    const payment_method_result = await PaymentMethod.fetch_by_id(data.payment_method_id);
    if (!payment_method_result.ok || !payment_method_result.data) {
      return new PaymentMethodResponse(Result.fail(new ValidationError(null, 'Payment method not found')));
    }

    const payment_method_data = payment_method_result.data;

    // Verify ownership
    if (payment_method_data.customer_id !== user.id) {
      return new PaymentMethodResponse(Result.fail(new UnauthorizedError(null, 'Payment method does not belong to user')));
    }

    // Soft delete the payment method
    const delete_result = await PaymentMethod.soft_delete(data.payment_method_id, user.id);

    if (!delete_result.ok) {
      return new PaymentMethodResponse(Result.fail(delete_result.error));
    }

    return new PaymentMethodResponse(Result.success(delete_result.data));
  }
}
