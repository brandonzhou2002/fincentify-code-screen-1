import { IntrospectedObject } from '../../../../introspector/introspectedModel.js';
import {
  getFragmentName,
  getFragmentObjectName,
  getFragmentObjectVariableName,
} from '../../../naming/fragments.js';
import { getFirstObjectType } from '../../../util/field.js';
import { doesFieldContainObject } from '../../../util/hasObjectFields.js';
import { lowercaseFirstLetter } from '../../../util/string.js';

const defaultSubfragmentsTemplate = (obj: IntrospectedObject) => {
  let answer = `const ${lowercaseFirstLetter(obj.name)}FragmentDefaultSubfragments = {`;

  obj.fields.forEach((field) => {
    if (doesFieldContainObject(field)) {
      answer = `${answer}
  ${getFragmentObjectVariableName(getFirstObjectType(field).name)}: ${
        getFirstObjectType(field).name
      }Fragment,`;
    }
  });

  answer = `${answer}
};`;
  return answer;
};

const fragmentWithSubobjects = (obj: IntrospectedObject) => {
  let answer = defaultSubfragmentsTemplate(obj);

  const subFragmentsPortion = `const subfragments = {
    ...${lowercaseFirstLetter(obj.name)}FragmentDefaultSubfragments,
    ...subfragmentOverrides,
  }`;

  const subFragmentsUsedPortion = obj.fields.reduce((acc, field) => {
    if (doesFieldContainObject(field)) {
      acc = `${acc}
    \${subfragments.${getFragmentObjectVariableName(getFirstObjectType(field).name)}()}`;
    }
    return acc;
  }, '');

  answer = `${answer}

export function ${getFragmentObjectName(obj.name)}(subfragmentOverrides = {}) {
  ${subFragmentsPortion}

  return gql\`
    ${subFragmentsUsedPortion}

    fragment ${getFragmentName(obj.name)} on ${obj.name} {`;

  obj.fields.forEach((field) => {
    if (doesFieldContainObject(field)) {
      answer = `${answer}
      ${field.name} {
        ...${getFragmentObjectName(getFirstObjectType(field).name)}
      }`;
    } else {
      answer = `${answer}
      ${field.name}`;
    }
  });

  answer = `${answer}
    }
  \`;
};`;

  return answer;
};

export default fragmentWithSubobjects;
