import Api from '../api';
import { __Schema } from '../model';

const query = `
  query Queries {
    __schema {
      queryType {
        name
        fields {
          name
          type {
            name
            ofType {
              kind
              name
            }
          }
          args {
            name
            defaultValue
            type {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
`;

const getQueries = (api: Api): Promise<{ __schema: __Schema }> => {
  return api
    .sendQuery(query)
    .then((resp) => {
      return resp.json();
    })
    .then((text) => {
      return text.data;
    });
};

export default getQueries;
