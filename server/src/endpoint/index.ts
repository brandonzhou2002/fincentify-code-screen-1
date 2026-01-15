import { buildSchema } from 'type-graphql';

// Queries
import HealthcheckQuery from './query/HealthcheckQuery';
import MeQuery from './query/MeQuery';
import GetPaymentMethods from './query/payment/GetPaymentMethods';
import GetMembershipStatus from './query/subscription/GetMembershipStatus';

// Mutations
import Login from './mutation/auth/Login';
import Signup from './mutation/auth/Signup';
import AddCard from './mutation/payment/AddCard';
import RemoveCard from './mutation/payment/RemoveCard';
import ProcessPayment from './mutation/payment/ProcessPayment';
import StartTrial from './mutation/subscription/StartTrial';
import CancelSubscription from './mutation/subscription/CancelSubscription';
import RestartMembership from './mutation/subscription/RestartMembership';

export const resolvers = [
  // Queries
  HealthcheckQuery,
  MeQuery,
  GetPaymentMethods,
  GetMembershipStatus,

  // Mutations
  Login,
  Signup,
  AddCard,
  RemoveCard,
  ProcessPayment,
  StartTrial,
  CancelSubscription,
  RestartMembership,
] as const;

export const schema = buildSchema({
  resolvers,
  validate: { forbidUnknownValues: false },
});

export { Context } from './context';
