import { relative } from 'path';
import { __TypeKind } from '../../../../api/model.js';
import {
  IntrospectedObject,
  IntrospectedQuery,
} from '../../../../introspector/introspectedModel.js';
import { getFragmentObjectName, getFragmentObjectVariableName } from '../../../naming/fragments.js';
import { getGqlVariableName, getQueryHookName, getQueryName } from '../../../naming/queries.js';
import { getFirstObjectType } from '../../../util/field.js';
import { doesFieldContainObject } from '../../../util/hasObjectFields.js';
import { uppercaseFirstLetter } from '../../../util/string.js';
import ObjectTemplate, { getTypeString } from '../general/object.js';

const getImportSectionText = (
  serverModelImportPath: string,
  fragmentsImportPath: string,
  objectsUsed: Set<string>,
  outputUsedRecognizedObjects: Set<string>
) => {
  let importSectionText = `import { gql, QueryResult, useQuery } from '@apollo/client';`;
  if (objectsUsed.size > 0) {
    importSectionText = `${importSectionText}
import { ${Array.from(objectsUsed).join(', ')} } from '${serverModelImportPath}';`;
  }
  if (outputUsedRecognizedObjects.size > 0) {
    importSectionText = `${importSectionText}
import { ${Array.from(outputUsedRecognizedObjects)
      .map((objName) => `${getFragmentObjectName(objName)}`)
      .join(', ')} } from '${fragmentsImportPath}';`;
  }

  importSectionText = `${importSectionText}\n\n`;
  return importSectionText;
};

const getHookSectionGqlText = (
  query: IntrospectedQuery,
  outputUsedRecognizedObjects: Set<string>
) => {
  const gqlSectionFragmentsText = Array.from(outputUsedRecognizedObjects)
    .reduce((acc, currName) => {
      acc = `${acc}    \${${getFragmentObjectVariableName(currName)}()}\n`;
      return acc;
    }, '')
    .slice(0, -1);

  const queryInputDeclaration =
    query.args.length > 0 ? `($data: ${getTypeString(query.args[0].type)}!)` : '';
  const queryInputDataAssignment = query.args.length > 0 ? `(${query.args[0].name}: $data)` : '';
  const queryFields = query.responseType.fields
    .reduce((acc, field) => {
      if (doesFieldContainObject(field)) {
        acc = `${acc}        ${field.name} {
          ...${getFragmentObjectName(getFirstObjectType(field).name)}
        }\n`;
      } else {
        acc = `${acc}${field.name}\n`;
      }
      return acc;
    }, '')
    .slice(0, -1);

  const gqlSectionText = `const ${getGqlVariableName(query.name)} = gql\`
${gqlSectionFragmentsText}
    query ${uppercaseFirstLetter(query.name)}${queryInputDeclaration} {
      ${query.name}${queryInputDataAssignment} {
        ${queryFields}
      }
    }
  \``;

  return gqlSectionText;
};

const getHookSectionText = (
  query: IntrospectedQuery,
  typeDict: { [key: string]: IntrospectedObject },
  outputUsedRecognizedObjects: Set<string>
) => {
  const argsSectionText = Array.from(outputUsedRecognizedObjects)
    .reduce(
      (acc, currName) => {
        acc = `${acc}  ${getFragmentObjectVariableName(currName)} = ${getFragmentObjectName(
          currName
        )},\n`;
        return acc;
      },
      query.args.length > 0 ? `  inputData: ${getTypeString(query.args[0].type)},\n` : ''
    )
    .slice(0, -1);

  const gqlSectionText = getHookSectionGqlText(query, outputUsedRecognizedObjects);

  const returnSectionText = `return useQuery<{${query.name}: ${getTypeString({
    kind: query.responseType.kind,
    object: query.responseType,
  })}}>(${getGqlVariableName(query.name)}, {${
    query.args.length > 0 ? `\n    variables: { data: inputData },` : ''
  }
    fetchPolicy: 'no-cache',
  });`;

  const answer = `const ${getQueryHookName(query.name)} = (
${argsSectionText}
): QueryResult<{${query.name}: ${getTypeString({
    kind: query.responseType.kind,
    object: query.responseType,
  })}}> => {
  ${gqlSectionText}

  ${returnSectionText}
};`;

  return answer;
};

const generateQueryFileText = (
  query: IntrospectedQuery,
  typeDict: { [key: string]: IntrospectedObject },
  queriesFolderPath: string,
  fragmentsFilePath: string,
  serverModelFilePath: string,
  recognizedObjects: Set<string>
) => {
  /* Create input object type */
  let inputUsedRecognizedObjects: Set<string> = new Set();
  let inputUsedRecognizedEnums: Set<string> = new Set();
  let inputObjectText = null;

  if (
    query.args.length > 0 &&
    (query.args[0].type.kind == __TypeKind.OBJECT ||
      query.args[0].type.kind == __TypeKind.INPUT_OBJECT)
  ) {
    inputObjectText = ObjectTemplate(query.args[0].type.object, {
      recognizedObjects,
      usedRecognizedObjects: inputUsedRecognizedObjects,
      usedRecognizedEnums: inputUsedRecognizedEnums,
    });
  }

  /* Create response object type */
  let outputUsedRecognizedObjects: Set<string> = new Set();
  let outputUsedRecognizedEnums: Set<string> = new Set();
  const outputObjectText = ObjectTemplate(query.responseType, {
    usedRecognizedObjects: outputUsedRecognizedObjects,
    usedRecognizedEnums: outputUsedRecognizedEnums,
  });

  /* Create import section */
  const fragmentsImportPath = relative(queriesFolderPath, fragmentsFilePath).slice(0, -3);
  const serverModelImportPath = relative(queriesFolderPath, serverModelFilePath).slice(0, -3);
  const objectsUsed = new Set([
    ...Array.from(inputUsedRecognizedObjects),
    ...Array.from(inputUsedRecognizedEnums),
    ...Array.from(outputUsedRecognizedObjects),
    ...Array.from(outputUsedRecognizedEnums),
  ]);

  const importSectionText = getImportSectionText(
    serverModelImportPath,
    fragmentsImportPath,
    objectsUsed,
    outputUsedRecognizedObjects
  );

  const hookSectionText = getHookSectionText(query, typeDict, outputUsedRecognizedObjects);

  /* Create file */
  const answer = `${importSectionText}${outputObjectText}
${inputObjectText ? `${inputObjectText}\n` : ''}
${hookSectionText}

export default ${getQueryHookName(query.name)}
`;

  return answer;
};

export default generateQueryFileText;
