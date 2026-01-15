import { uppercaseFirstLetter } from '../util/string.js';

export const getQueryName = (queryName: string) => `${queryName}Query`;

export const getQueryHookName = (queryName: string) =>
  `use${uppercaseFirstLetter(getQueryName(queryName))}`;

export const getGqlVariableName = (queryName: string) => `${queryName}GqlString`;
