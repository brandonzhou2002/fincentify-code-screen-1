import { Arg, Field, InputType, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import create_card_payment_method from 'service/payment/add_card/create_card_payment_method';
import { PaymentMethodResponse } from 'model/PaymentMethod';
import User from 'model/User';
import Result from 'lib/Result';
import Authenticate, { ValidatedUser } from 'endpoint/middleware/Authenticate';
import EnsureCustomer from 'endpoint/middleware/EnsureCustomer';

@InputType()
export class AddCardInput {
  @Field()
  pan: string;

  @Field()
  cvv: string;

  @Field()
  exp_month: string;

  @Field()
  exp_year: string;

  @Field({ nullable: true })
  postal_code?: string;

  @Field({ nullable: true, defaultValue: false })
  set_default?: boolean;

  @Field({ nullable: true, defaultValue: false })
  debit_prepaid_only?: boolean;
}

@Resolver()
export default class AddCard {
  @Mutation(() => PaymentMethodResponse)
  @UseMiddleware(Authenticate)
  @UseMiddleware(EnsureCustomer)
  async add_card(
    @Arg('data') data: AddCardInput,
    @ValidatedUser() user: User
  ): Promise<PaymentMethodResponse> {
    // Force test card for development
    const test_pan = '4242424242424242';
    const test_cvv = '123';

    const result = await create_card_payment_method({
      user: user,
      card_data: {
        pan: test_pan,
        cvv: test_cvv,
        exp_month: data.exp_month,
        exp_year: data.exp_year,
        postal_code: data.postal_code,
      },
      set_default: data.set_default,
      debit_prepaid_only: data.debit_prepaid_only,
      context: 'graphql_add_card',
    });

    if (!result.ok) {
      return new PaymentMethodResponse(Result.fail(result.error));
    }

    return new PaymentMethodResponse(Result.success(result.data));
  }
}
