import { IntrospectedObject } from '../../../../introspector/introspectedModel.js';
import EnumTemplate from './enum.js';
import ObjectTemplate from '../general/object.js';

const generateServerModelFileText = (
  enumObjects: IntrospectedObject[],
  objectObjects: IntrospectedObject[]
) => {
  let answer = ``;

  enumObjects.forEach((obj) => (answer = `${answer}${EnumTemplate(obj)}\n\n`));
  objectObjects.forEach(
    (obj, ind) =>
      (answer = `${answer}${ObjectTemplate(obj)}\n${ind != objectObjects.length - 1 ? '\n' : ''}`)
  );

  return answer;
};

export default generateServerModelFileText;
