import { __TypeKind } from '../../../../api/model.js';
import { IntrospectedObject, TypeObject } from '../../../../introspector/introspectedModel.js';
import { getEnumTypeName } from '../../../naming/enums.js';
import scalarNameToType from '../../scalarNameToType.js';

export interface StandardObjectGenRelatedProps {
  // Not passing recognizedObjects makes template recognize all subObjects
  // If subObject is not recognized, it will be expanded
  recognizedObjects?: Set<string>;

  // If template uses a recognized subObject, it'll put it into this array
  usedRecognizedObjects?: Set<string>;
  // If template uses a recognized enum, it'll put it into this array
  usedRecognizedEnums?: Set<string>;

  indent?: string;
}

export interface TypeStringOptionsPropsType extends StandardObjectGenRelatedProps {}

export const getTypeString = (
  typeObject: TypeObject,
  options: TypeStringOptionsPropsType = {}
): string => {
  switch (typeObject.kind) {
    case __TypeKind.OBJECT:
    case __TypeKind.INPUT_OBJECT:
      if (!options.recognizedObjects || options.recognizedObjects.has(typeObject.object.name)) {
        if (options.usedRecognizedObjects) {
          options.usedRecognizedObjects.add(typeObject.object.name);
        }
        return typeObject.object.name;
      }
      const newIndent = `${options.indent ? options.indent : ''}  `;
      return ObjectInnerTemplate(typeObject.object, { ...options, indent: newIndent });
    case __TypeKind.ENUM:
      if (options.usedRecognizedEnums) {
        options.usedRecognizedEnums.add(getEnumTypeName(typeObject.object.name));
      }
      return `keyof ${getEnumTypeName(typeObject.object.name)}`;
    case __TypeKind.SCALAR:
      return scalarNameToType[typeObject.object.name];
    case __TypeKind.LIST:
      return `${getTypeString(typeObject.subObjects[0], options)}[]`;
    default:
      return 'any';
  }
};

export interface ObjectInnerTemplateOptionsPropsType extends StandardObjectGenRelatedProps {}

export const ObjectInnerTemplate = (
  obj: IntrospectedObject,
  options: ObjectInnerTemplateOptionsPropsType = {}
) => {
  const indent = options.indent ? options.indent : '';

  let fields = obj.fields;
  if (!fields) {
    fields = obj.inputFields;
  }

  // Handle scalar types or objects without fields
  if (!fields || fields.length === 0) {
    return `{}`;
  }

  let answer = `{`;
  answer = fields.reduce((acc, curr) => {
    acc = `${acc}
  ${indent}${curr.name}: ${getTypeString(curr.type, options)};`;
    return acc;
  }, answer);

  answer = `${answer}
${indent}}`;
  return answer;
};

export interface ObjectTemplateOptionsPropsType extends StandardObjectGenRelatedProps {}

const ObjectTemplate = (obj: IntrospectedObject, options: ObjectTemplateOptionsPropsType = {}) => {
  // Handle null/undefined object (e.g., scalar types)
  if (!obj) {
    return `export interface Unknown {}`;
  }

  let answer = `export interface ${obj.name} {`;

  let fields = obj.fields;
  if (!fields) {
    fields = obj.inputFields;
  }

  // Handle scalar types or objects without fields
  if (!fields || fields.length === 0) {
    return `${answer}\n}`;
  }

  answer = fields.reduce((acc, curr) => {
    acc = `${acc}
  ${curr.name}${curr.nullable ? '?' : ''}: ${getTypeString(curr.type, options)};`;
    return acc;
  }, answer);

  answer = `${answer}
}`;
  return answer;
};

export default ObjectTemplate;
