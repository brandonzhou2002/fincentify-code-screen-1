import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from 'type-graphql';
import login from 'service/auth/login';
import Response from 'endpoint/response/Response';
import Result from 'lib/Result';

@InputType()
export class LoginInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

@ObjectType()
export class Token {
  constructor(token: string) {
    this.token = token;
  }

  @Field()
  token: string;
}

@ObjectType()
export class LoginResponse extends Response(Token) {}

@Resolver()
export default class Login {
  @Mutation(() => LoginResponse)
  async login(@Arg('data') data: LoginInput, @Ctx() context: any): Promise<LoginResponse> {
    const result = await login({
      email: data.email,
      password: data.password,
    });

    if (!result.ok) {
      return new LoginResponse(Result.fail(result.error));
    }

    return new LoginResponse(Result.success(new Token(result.data.token)));
  }
}
