import { IntrospectedObject } from '../../../../introspector/introspectedModel.js';
import { getFragmentName, getFragmentObjectName } from '../../../naming/fragments.js';

const fragmentNoSubobjects = (obj: IntrospectedObject) => {
  let answer = `export const ${getFragmentObjectName(obj.name)} = () => gql\`
  fragment ${getFragmentName(obj.name)} on ${obj.name} {`;

  obj.fields.forEach((field) => {
    answer = `${answer}
    ${field.name}`;
  });

  answer = `${answer}
  }
\`;`;
  return answer;
};

export default fragmentNoSubobjects;
