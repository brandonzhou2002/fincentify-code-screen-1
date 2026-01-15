import Api from './api/api.js';
import CodeGenerator from './generators/web/codeGenerator.js';
import { IntrospectedSchema } from './introspector/introspectedModel.js';

const main = async () => {
  const endpoint = 'http://localhost:3200/v1';
  const api = new Api(endpoint);
  const introspectedSchema = new IntrospectedSchema(api);

  await introspectedSchema.create();

  const codeGenerator = new CodeGenerator(introspectedSchema);
  codeGenerator.generate();
};

main();
