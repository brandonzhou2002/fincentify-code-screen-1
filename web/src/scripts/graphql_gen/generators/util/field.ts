import { __TypeKind } from '../../api/model.js';
import { IntrospectedField } from '../../introspector/introspectedModel.js';

// A field can be an array so we need to "dig" through those
export const getFirstObjectType = (field: IntrospectedField) => {
  let obj = field.type;
  while (obj.kind == __TypeKind.LIST) {
    obj = obj.subObjects[0];
  }
  return obj.object;
};
