import { IntrospectedObject } from '../../../../introspector/introspectedModel.js';

const EnumTemplate = (obj: IntrospectedObject) => {
  let answer = `export const ${obj.name} = {`;

  answer = obj.enumValues.reduce((acc, curr) => {
    acc = `${acc}
  ${curr}: '${curr}' as '${curr}',`;
    return acc;
  }, answer);

  answer = `${answer}
};`;

  answer = `${answer}
export type ${obj.name}Type = typeof ${obj.name};`;

  return answer;
};

export default EnumTemplate;
