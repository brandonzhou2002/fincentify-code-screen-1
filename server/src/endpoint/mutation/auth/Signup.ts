import { Arg, Field, InputType, Mutation, ObjectType, Resolver } from 'type-graphql';
import signup from 'service/auth/signup';
import Response from 'endpoint/response/Response';
import Result from 'lib/Result';
import { Token } from './Login';

@InputType()
export class SignupInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  first_name?: string;

  @Field({ nullable: true })
  last_name?: string;
}

@ObjectType()
export class SignupResponse extends Response(Token) {}

@Resolver()
export default class Signup {
  @Mutation(() => SignupResponse)
  async signup(@Arg('data') data: SignupInput): Promise<SignupResponse> {
    const result = await signup({
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
    });

    if (!result.ok) {
      return new SignupResponse(Result.fail(result.error));
    }

    return new SignupResponse(Result.success(new Token(result.data.token)));
  }
}
