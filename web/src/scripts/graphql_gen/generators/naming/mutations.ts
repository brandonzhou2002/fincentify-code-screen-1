import { uppercaseFirstLetter } from '../util/string.js';

export const getMutationName = (mutationName: string) => `${mutationName}Mutation`;

export const getMutationSenderName = (mutationName: string) =>
  `send${uppercaseFirstLetter(getMutationName(mutationName))}`;

export const getGqlVariableName = (mutationName: string) => `${mutationName}GqlString`;
