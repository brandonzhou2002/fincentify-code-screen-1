import { Arg, Field, InputType, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import pull_funds from 'service/payment/pull_funds/pull_funds';
import Payment, { PaymentResponse } from 'model/Payment';
import User from 'model/User';
import Result from 'lib/Result';
import { ValidationError } from 'common/errors';
import Authenticate, { ValidatedUser } from 'endpoint/middleware/Authenticate';
import EnsureCustomer from 'endpoint/middleware/EnsureCustomer';

@InputType()
export class ProcessPaymentInput {
  @Field()
  payment_id: string;
}

@Resolver()
export default class ProcessPayment {
  @Mutation(() => PaymentResponse)
  @UseMiddleware(Authenticate)
  @UseMiddleware(EnsureCustomer)
  async process_payment(
    @Arg('data') data: ProcessPaymentInput,
    @ValidatedUser() user: User
  ): Promise<PaymentResponse> {
    // Fetch payment
    const payment_result = await Payment.fetch_by_id(data.payment_id);
    if (!payment_result.ok || !payment_result.data) {
      return new PaymentResponse(Result.fail(new ValidationError(null, 'Payment not found')));
    }

    const result = await pull_funds({
      payment: payment_result.data,
      user: user,
      ref_date: new Date(),
    });

    if (!result.ok) {
      return new PaymentResponse(Result.fail(result.error));
    }

    return new PaymentResponse(Result.success(result.data));
  }
}
