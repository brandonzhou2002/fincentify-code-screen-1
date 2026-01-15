export type __Schema = {
  types: [__Type];
  queryType: __Type;
  mutationType?: __Type;
  subscriptionType?: __Type;
  directives: [__Directive];
};

export type __Type = {
  kind: keyof typeof __TypeKind;
  name?: string;
  description?: string;

  // OBJECT and INTERFACE only
  fields?: [__Field];

  // OBJECT only
  interfaces?: [__Type];

  // INTERFACE and UNION only
  possibleTypes?: [__Type];

  // ENUM only
  enumValues?: [__EnumValue];

  // INPUT_OBJECT only
  inputFields?: [__InputValue];

  // NON_NULL and LIST only
  ofType: __Type;
};

export type __Field = {
  name: string;
  description?: string;
  args: [__InputValue];
  type: __Type;
  isDeprecated: Boolean;
  deprecationReason?: string;
};

export type __InputValue = {
  name: string;
  description?: string;
  type: __Type;
  defaultValue?: string;
};

export type __EnumValue = {
  name: string;
  description?: string;
  isDeprecated: Boolean;
  deprecationReason?: string;
};

export enum __TypeKind {
  SCALAR,
  OBJECT,
  INTERFACE,
  UNION,
  ENUM,
  INPUT_OBJECT,
  LIST,
  NON_NULL,
}

export type __Directive = {
  name: string;
  description?: string;
  locations: [__DirectiveLocation];
  args: [__InputValue];
};

export enum __DirectiveLocation {
  QUERY,
  MUTATION,
  SUBSCRIPTION,
  FIELD,
  FRAGMENT_DEFINITION,
  FRAGMENT_SPREAD,
  INLINE_FRAGMENT,
  SCHEMA,
  SCALAR,
  OBJECT,
  FIELD_DEFINITION,
  ARGUMENT_DEFINITION,
  INTERFACE,
  UNION,
  ENUM,
  ENUM_VALUE,
  INPUT_OBJECT,
  INPUT_FIELD_DEFINITION,
}
