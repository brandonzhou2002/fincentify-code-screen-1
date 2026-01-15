import { IntrospectedObject } from '../../../../introspector/introspectedModel.js';
import hasObjectFields from '../../../util/hasObjectFields.js';
import fragmentNoSubobjects from './fragmentNoSubobjects.js';
import fragmentWithSubobjects from './fragmentWithSubobjects.js';

const generateFragmentsFileText = (objectObjects: IntrospectedObject[]) => {
  let answer = `import { gql } from '@apollo/client';

/*************************************************************************************\

  These are standard gql fragments for querying all the fields on our backend objects

  Note:
  - These are built to have to option to be customized. To override a subfragment,
    make a subfragment with the same name as the one being overridden as a function,
    and pass it in to the parent fragment subfragmentOverrides

    eg. const ErrorFragment = () => gql\`
      fragment ErrorFragment on ErrorResponse {
        code
        // Note we omitted fields to customize this query
      }
    \`

    ParentFragment({errorFragment: ErrorFragment})

\*************************************************************************************/

`;

  objectObjects.forEach((obj) => {
    if (!hasObjectFields(obj)) {
      answer = `${answer}
${fragmentNoSubobjects(obj)}
`;
    }
  });

  objectObjects.forEach((obj) => {
    if (hasObjectFields(obj)) {
      answer = `${answer}
${fragmentWithSubobjects(obj)}
`;
    }
  });

  return answer;
};

export default generateFragmentsFileText;
