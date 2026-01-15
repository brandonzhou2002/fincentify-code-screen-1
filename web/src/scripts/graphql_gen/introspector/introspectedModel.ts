import { object } from 'prop-types';
import Api from '../api/api.js';
import { __Field, __InputValue, __Type, __TypeKind } from '../api/model.js';
import getMutations from '../api/queries/getMutations.js';
import getObjects from '../api/queries/getObjects.js';
import getQueries from '../api/queries/getQueries.js';

/* Describe a type by name */
export class TypeDescriptor {
  typeName: string; // Null if kind is list
  typeKind: __TypeKind;
  contents?: TypeDescriptor[];

  constructor(rawType: __Type) {
    this.contents = null;
    this.parseRawType(rawType);
  }

  parseRawType = (rawType: __Type) => {
    if (__TypeKind[rawType.kind] == __TypeKind.NON_NULL) {
      this.parseRawType(rawType.ofType);
    } else if (__TypeKind[rawType.kind] == __TypeKind.LIST) {
      this.typeName = null;
      this.typeKind = __TypeKind[rawType.kind];
      this.contents = [new TypeDescriptor(rawType.ofType)];
    } else {
      this.typeName = rawType.name;
      this.typeKind = __TypeKind[rawType.kind];
    }
  };
}

/* Object representing a type */
export class TypeObject {
  // If kind is array
  subObjects?: TypeObject[];
  kind: __TypeKind;
  // If kind is not array
  object?: IntrospectedObject;

  constructor(typeDescriptor: TypeDescriptor, typeDict: { [key: string]: IntrospectedObject }) {
    this.kind = typeDescriptor.typeKind;
    if (typeDescriptor.typeKind == __TypeKind.LIST) {
      this.object = null;
      this.subObjects = [new TypeObject(typeDescriptor.contents[0], typeDict)];
    } else {
      this.object = typeDict[typeDescriptor.typeName];
      this.subObjects = null;
    }
  }
}

/* Represents one field in a type */
export class IntrospectedField {
  name: string;
  description: string;
  nullable: boolean;
  typeDescriptor: TypeDescriptor;
  type: TypeObject;

  constructor(rawField: __Field | __InputValue) {
    this.name = rawField.name;
    this.description = rawField.description;
    this.nullable = !(__TypeKind[rawField.type.kind] == __TypeKind.NON_NULL);
    this.typeDescriptor = new TypeDescriptor(rawField.type);
  }

  // Link typeName to actual type
  link = (typeDict: { [key: string]: IntrospectedObject }) => {
    this.type = new TypeObject(this.typeDescriptor, typeDict);
  };
}

/* Represents one user defined object (object or enum) */
export class IntrospectedObject {
  name: string;
  description: string;
  // OBJECT and INTERFACE only
  fields?: IntrospectedField[] = null;
  // ENUM only
  enumValues?: string[] = null;
  // INPUT_OBJECT only
  inputFields?: IntrospectedField[] = null;

  kind: __TypeKind;

  constructor(rawType: __Type) {
    this.name = rawType.name;
    this.description = rawType.description;
    this.kind = __TypeKind[rawType.kind];
    switch (this.kind) {
      case __TypeKind.OBJECT:
      case __TypeKind.INTERFACE:
        this.fields = [];
        break;
      case __TypeKind.ENUM:
        this.enumValues = [];
        break;
      case __TypeKind.INPUT_OBJECT:
        this.inputFields = [];
        break;
    }

    if (rawType.fields) {
      rawType.fields.forEach((rawField) => {
        this.fields.push(new IntrospectedField(rawField));
      });
    }

    if (rawType.enumValues) {
      rawType.enumValues.forEach((enumValue) => {
        this.enumValues.push(enumValue.name);
      });
    }

    if (rawType.inputFields) {
      rawType.inputFields.forEach((rawInputField) => {
        this.inputFields.push(new IntrospectedField(rawInputField));
      });
    }
  }

  // Link fields
  link = (typeDict: { [key: string]: IntrospectedObject }) => {
    if (this.fields) {
      this.fields.forEach((field) => field.link(typeDict));
    }
    if (this.inputFields) {
      this.inputFields.forEach((inputField) => inputField.link(typeDict));
    }
  };
}

/* Represents a query */
export class IntrospectedQuery {
  name: string;
  responseTypeName: string;
  responseType: IntrospectedObject;
  args: IntrospectedField[];

  constructor(rawQuery: __Field) {
    this.name = rawQuery.name;
    this.responseTypeName = rawQuery.type.ofType.name;
    this.args = [];

    rawQuery.args.forEach((rawArg) => {
      this.args.push(new IntrospectedField(rawArg));
    });
  }

  // Link args
  link = (typeDict: { [key: string]: IntrospectedObject }) => {
    this.args.forEach((arg) => arg.link(typeDict));
    this.responseType = typeDict[this.responseTypeName];
  };
}

/* Represents a mutation */
export class IntrospectedMutation {
  name: string;
  responseTypeName: string;
  responseType: IntrospectedObject;
  args: IntrospectedField[];

  constructor(rawMutation: __Field) {
    this.name = rawMutation.name;
    this.responseTypeName = rawMutation.type.ofType.name;
    this.args = [];

    rawMutation.args.forEach((rawArg) => {
      this.args.push(new IntrospectedField(rawArg));
    });
  }

  // Link args
  link = (typeDict: { [key: string]: IntrospectedObject }) => {
    this.args.forEach((arg) => arg.link(typeDict));
    this.responseType = typeDict[this.responseTypeName];
  };
}

/* Represents an entire introspected schema*/
export class IntrospectedSchema {
  api: Api;
  QUERY_NAME: string;
  MUTATION_NAME: string;

  allObjects: IntrospectedObject[];
  queries: IntrospectedQuery[];
  mutations: IntrospectedMutation[];

  typeDict: { [key: string]: IntrospectedObject };
  // Response objects returned by queries and mutations
  initialResponseObjects: Set<string>;
  // Objects used as arguments by queries and mutations
  argumentObjects: Set<string>;

  // All objects/enums we'd have to generate interfaces/objects for
  dataObjects: Set<string>;

  constructor(api: Api) {
    this.api = api;
    this.QUERY_NAME = 'Query';
    this.MUTATION_NAME = 'Mutation';

    this.initialResponseObjects = new Set();
    this.argumentObjects = new Set();
    this.dataObjects = new Set();
  }

  create = async () => {
    this.allObjects = await getObjects(this.api).then((data) => {
      return data.__schema.types
        .filter((type) => type.name != this.QUERY_NAME && type.name != this.MUTATION_NAME)
        .map((rawObject) => new IntrospectedObject(rawObject));
    });

    this.typeDict = this.allObjects.reduce((acc: { [key: string]: IntrospectedObject }, curr) => {
      acc[curr.name] = curr;
      return acc;
    }, {});
    this.allObjects.forEach((objectType) => objectType.link(this.typeDict));

    this.queries = await getQueries(this.api).then((data) => {
      return data.__schema.queryType.fields.map((rawQuery) => new IntrospectedQuery(rawQuery));
    });
    this.queries.forEach((query) => query.link(this.typeDict));

    this.mutations = await getMutations(this.api).then((data) => {
      return data.__schema.mutationType.fields.map(
        (rawMutation) => new IntrospectedMutation(rawMutation)
      );
    });
    this.mutations.forEach((mutation) => mutation.link(this.typeDict));

    // Add response objects
    this.queries.forEach((query) => this.initialResponseObjects.add(query.responseTypeName));
    this.mutations.forEach((mutation) =>
      this.initialResponseObjects.add(mutation.responseTypeName)
    );
    this.initialResponseObjects.forEach((typeName) => this.addResponseObjectTypesFrom(typeName));

    // Add input objects
    this.queries.forEach((query) =>
      query.args.forEach((arg) => {
        if (arg.type.kind == __TypeKind.INPUT_OBJECT || arg.type.kind == __TypeKind.OBJECT) {
          this.argumentObjects.add(arg.type.object.name);
        }
      })
    );
    this.mutations.forEach((mutation) =>
      mutation.args.forEach((arg) => {
        if (arg.type.kind == __TypeKind.INPUT_OBJECT || arg.type.kind == __TypeKind.OBJECT) {
          this.argumentObjects.add(arg.type.object.name);
        }
      })
    );
    this.argumentObjects.forEach((typeName) => this.addResponseObjectTypesFrom(typeName));

    this.allObjects.forEach((object) => {
      if (object.kind == __TypeKind.ENUM && !object.name.startsWith('__')) {
        this.dataObjects.add(object.name);
      }
    });
  };

  addResponseObjectTypesFrom = (typeName: string) => {
    const object = this.typeDict[typeName];
    if (object.fields) {
      object.fields.forEach((field) => this.recursiveAddDataObjectsFromTypeObject(field.type));
    }
    if (object.inputFields) {
      object.inputFields.forEach((field) => this.recursiveAddDataObjectsFromTypeObject(field.type));
    }
  };

  recursiveAddDataObjectsFromTypeObject = (typeObject: TypeObject) => {
    switch (typeObject.kind) {
      case __TypeKind.LIST:
        this.recursiveAddDataObjectsFromTypeObject(typeObject.subObjects[0]);
        break;
      case __TypeKind.OBJECT:
      case __TypeKind.INPUT_OBJECT:
        const objectToAdd = typeObject.object;
        if (this.dataObjects.has(objectToAdd.name)) return;
        this.dataObjects.add(objectToAdd.name);
        if (objectToAdd.fields) {
          objectToAdd.fields.forEach((field) =>
            this.recursiveAddDataObjectsFromTypeObject(field.type)
          );
        }
        break;
      case __TypeKind.ENUM:
        this.dataObjects.add(typeObject.object.name);
    }
  };
}
