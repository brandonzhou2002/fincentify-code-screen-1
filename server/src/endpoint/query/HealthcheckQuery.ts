import { Query, Resolver } from 'type-graphql';

@Resolver()
export default class HealthcheckQuery {
  @Query(() => String)
  healthcheck(): string {
    return 'OK';
  }
}
