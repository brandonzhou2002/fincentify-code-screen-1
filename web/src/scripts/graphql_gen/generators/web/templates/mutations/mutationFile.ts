import { relative } from 'path';
import { __TypeKind } from '../../../../api/model.js';
import {
  IntrospectedMutation,
  IntrospectedObject,
} from '../../../../introspector/introspectedModel.js';
import { getFragmentObjectName, getFragmentObjectVariableName } from '../../../naming/fragments.js';
import { getMutationSenderName, getGqlVariableName } from '../../../naming/mutations.js';
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
  let importSectionText = `import { ApolloClient, gql } from '@apollo/client';`;
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

const getGqlText = (mutation: IntrospectedMutation, outputUsedRecognizedObjects: Set<string>) => {
  const mutationInputDeclaration =
    mutation.args.length > 0 ? `($data: ${getTypeString(mutation.args[0].type)}!)` : '';
  const mutationInputDataAssignment =
    mutation.args.length > 0 ? `(${mutation.args[0].name}: $data)` : '';

  const gqlSectionFragmentsText = Array.from(outputUsedRecognizedObjects)
    .reduce((acc, currName) => {
      acc = `${acc}  \${${getFragmentObjectName(currName)}()}\n`;
      return acc;
    }, '')
    .slice(0, -1);

  const queryFields = mutation.responseType.fields
    .reduce((acc, field) => {
      if (doesFieldContainObject(field)) {
        acc = `${acc}      ${field.name} {
        ...${getFragmentObjectName(getFirstObjectType(field).name)}
      }\n`;
      } else {
        acc = `${acc}      ${field.name}\n`;
      }
      return acc;
    }, '')
    .slice(0, -1);

  const gqlSectionText = `const ${getGqlVariableName(mutation.name)} = gql\`
${gqlSectionFragmentsText}
  mutation ${uppercaseFirstLetter(mutation.name)}${mutationInputDeclaration} {
    ${mutation.name}${mutationInputDataAssignment} {
${queryFields}
    }
  }
\`;`;

  return gqlSectionText;
};

const getSendFunctionSectionText = (
  mutation: IntrospectedMutation,
  typeDict: { [key: string]: IntrospectedObject }
) => {
  const returnSectionText = `return apolloClient.mutate({
    mutation: ${getGqlVariableName(mutation.name)},${
    mutation.args.length > 0 ? `\n    variables: { data: { ...inputData } },` : ''
  }
  }) as Promise<{ data: { ${mutation.name}: ${getTypeString({
    kind: mutation.responseType.kind,
    object: mutation.responseType,
  })}} }>;`;

  const mutationInputMaybe =
    mutation.args.length > 0 ? `\n  inputData: ${getTypeString(mutation.args[0].type)},` : '';

  const answer = `const ${getMutationSenderName(mutation.name)} = (
  apolloClient: ApolloClient<object>,${mutationInputMaybe}
): Promise<{ data: { ${mutation.name}: ${getTypeString({
    kind: mutation.responseType.kind,
    object: mutation.responseType,
  })}} }> => {
  ${returnSectionText}
};`;

  return answer;
};

const generateMutationFileText = (
  mutation: IntrospectedMutation,
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
    mutation.args.length > 0 &&
    (mutation.args[0].type.kind == __TypeKind.OBJECT ||
      mutation.args[0].type.kind == __TypeKind.INPUT_OBJECT)
  ) {
    inputObjectText = ObjectTemplate(mutation.args[0].type.object, {
      recognizedObjects,
      usedRecognizedObjects: inputUsedRecognizedObjects,
      usedRecognizedEnums: inputUsedRecognizedEnums,
    });
  }

  /* Create response object type */
  let outputUsedRecognizedObjects: Set<string> = new Set();
  let outputUsedRecognizedEnums: Set<string> = new Set();
  const outputObjectText = ObjectTemplate(mutation.responseType, {
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

  const gqlSectionText = getGqlText(mutation, outputUsedRecognizedObjects);

  const sendFunctionSection = getSendFunctionSectionText(mutation, typeDict);

  /* Create file */
  const answer = `${importSectionText}${outputObjectText}
${inputObjectText ? `${inputObjectText}\n` : ''}

${gqlSectionText}
${sendFunctionSection}

export default ${getMutationSenderName(mutation.name)}
`;

  return answer;
};

export default generateMutationFileText;
