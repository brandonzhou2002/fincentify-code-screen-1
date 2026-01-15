import { lowercaseFirstLetter } from '../util/string.js';

export const getFragmentObjectName = (objectName: string) => `${objectName}Fragment`;

export const getFragmentName = (objectName: string) => getFragmentObjectName(objectName);

export const getFragmentObjectVariableName = (objectName: string) =>
  lowercaseFirstLetter(getFragmentObjectName(objectName));
