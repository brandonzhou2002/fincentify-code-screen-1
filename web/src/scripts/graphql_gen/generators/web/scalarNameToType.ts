import { __TypeKind } from '../../api/model.js';

const scalarNameToType: { [key: string]: string } = {
  Float: 'number',
  Boolean: 'boolean',
  Int: 'number',
  String: 'string',
  ID: 'string',
  Date: 'string',
  DateTime: 'string',
};

export default scalarNameToType;
