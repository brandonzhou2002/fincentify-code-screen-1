import { __TypeKind } from '../../api/model.js';
import { IntrospectedField, IntrospectedObject } from '../../introspector/introspectedModel.js';

export const doesFieldContainObject = (field: IntrospectedField) => {
  if (field.type.kind == __TypeKind.OBJECT) {
    return true;
  }
  if (field.type.kind == __TypeKind.LIST) {
    let containedObj = field.type.subObjects[0];
    while (containedObj.kind == __TypeKind.LIST) {
      containedObj = containedObj.subObjects[0];
    }
    if (containedObj.kind == __TypeKind.OBJECT) {
      return true;
    }
  }
  return false;
};

const hasObjectFields = (obj: IntrospectedObject): boolean => {
  if (!obj.fields) {
    return false;
  }
  let answer = false;
  obj.fields.forEach((field) => {
    if (doesFieldContainObject(field)) {
      answer = true;
    }
  });
  return answer;
};

export default hasObjectFields;
