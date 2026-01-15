import { mkdirSync, rmdirSync, writeFileSync } from 'fs';
import { __TypeKind } from '../../api/model.js';
import { IntrospectedSchema } from '../../introspector/introspectedModel.js';
import { getMutationName } from '../naming/mutations.js';
import { getQueryName } from '../naming/queries.js';
import generateFragmentsFileText from './templates/fragments/fragmentsFile.js';
import generateMutationFileText from './templates/mutations/mutationFile.js';
import generateQueryFileText from './templates/queries/queryFile.js';
import generateServerModelFileText from './templates/serverModel/serverModelFile.js';

class CodeGenerator {
  introspectedSchema: IntrospectedSchema;
  resultsRelativePath: string;

  queriesFolderPath: string;
  mutationsFolderPath: string;
  serverModelFilePath: string;
  fragmentsFilePath: string;

  constructor(
    introspectedSchema: IntrospectedSchema,
    resultsRelativePath: string = '../../graphql/generated'
  ) {

    this.introspectedSchema = introspectedSchema;
    this.resultsRelativePath = resultsRelativePath;

    this.queriesFolderPath = `${this.resultsRelativePath}/queries`;
    this.mutationsFolderPath = `${this.resultsRelativePath}/mutations`;
    this.serverModelFilePath = `${this.resultsRelativePath}/serverModel.ts`;
    this.fragmentsFilePath = `${this.resultsRelativePath}/fragments.ts`;
  }

  generate = () => {
    rmdirSync(this.resultsRelativePath, { recursive: true });
    mkdirSync(this.queriesFolderPath, { recursive: true });
    mkdirSync(this.mutationsFolderPath, { recursive: true });
    this.generateResponseObjectTypes();
    this.generateFragments();
    this.generateQueries();
    this.generateMutations();
  };

  generateResponseObjectTypes = () => {
    const enumObjects = Array.from(this.introspectedSchema.dataObjects).filter(
      (objName) => this.introspectedSchema.typeDict[objName].kind == __TypeKind.ENUM
    );
    const objectObjects = Array.from(this.introspectedSchema.dataObjects).filter(
      (objName) =>
        this.introspectedSchema.typeDict[objName].kind == __TypeKind.OBJECT ||
        this.introspectedSchema.typeDict[objName].kind == __TypeKind.INPUT_OBJECT
    );

    const answer = generateServerModelFileText(
      enumObjects.map((objName) => this.introspectedSchema.typeDict[objName]),
      objectObjects.map((objName) => this.introspectedSchema.typeDict[objName])
    );

    writeFileSync(this.serverModelFilePath, answer);
  };

  generateFragments = () => {
    const objectObjects = Array.from(this.introspectedSchema.dataObjects).filter(
      (objName) => this.introspectedSchema.typeDict[objName].kind == __TypeKind.OBJECT
    );
    const answer = generateFragmentsFileText(
      objectObjects.map((objName) => this.introspectedSchema.typeDict[objName])
    );
    writeFileSync(this.fragmentsFilePath, answer);
  };

  generateQueries = () => {
    this.introspectedSchema.queries
      .filter((queryObj) => {
        // Skip queries that return scalar types (no responseType object with fields)
        return queryObj.responseType &&
          (queryObj.responseType.kind === __TypeKind.OBJECT ||
           queryObj.responseType.kind === __TypeKind.INPUT_OBJECT);
      })
      .forEach((queryObj) => {
        const currFileName = `${getQueryName(queryObj.name)}.ts`;
        const currFilePath = `${this.queriesFolderPath}/${currFileName}`;
        const answer = generateQueryFileText(
          queryObj,
          this.introspectedSchema.typeDict,
          this.queriesFolderPath,
          this.fragmentsFilePath,
          this.serverModelFilePath,
          this.introspectedSchema.dataObjects
        );

        writeFileSync(currFilePath, answer);
      });
  };

  generateMutations = () => {
    this.introspectedSchema.mutations.forEach((mutationObj) => {
      const currFileName = `${getMutationName(mutationObj.name)}.ts`;
      const currFilePath = `${this.mutationsFolderPath}/${currFileName}`;
      const answer = generateMutationFileText(
        mutationObj,
        this.introspectedSchema.typeDict,
        this.queriesFolderPath,
        this.fragmentsFilePath,
        this.serverModelFilePath,
        this.introspectedSchema.dataObjects
      );

      writeFileSync(currFilePath, answer);
    });
  };
}

export default CodeGenerator;
