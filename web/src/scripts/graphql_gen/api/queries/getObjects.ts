import Api from '../api';
import { __Schema } from '../model';

const query = `
  query Objects {
    __schema {
      types {
        kind
        name
        fields {
          name
          type {
            kind
            name
            ofType {
              kind
              name
              ofType {
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
        enumValues {
          name
        }
        inputFields {
          name
          type {
            kind
            name
            ofType {
              kind
              name
              ofType {
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
  }
`;

const getObjects = (api: Api): Promise<{ __schema: __Schema }> => {
  return api
    .sendQuery(query)
    .then((resp) => {
      return resp.json();
    })
    .then((text) => {
      return text.data;
    });
};

export default getObjects;
