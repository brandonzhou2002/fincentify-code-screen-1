import { Query, Resolver, UseMiddleware } from 'type-graphql';
import User, { UserResponse } from 'model/User';
import Result from 'lib/Result';
import Authenticate, { ValidatedUser } from 'endpoint/middleware/Authenticate';

@Resolver()
export default class MeQuery {
  @Query(() => UserResponse)
  @UseMiddleware(Authenticate)
  async me(@ValidatedUser() user: User): Promise<UserResponse> {
    return new UserResponse(Result.success(user));
  }
}
