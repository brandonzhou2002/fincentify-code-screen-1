import express, { Request, Response } from 'express';
import { graphqlHTTP } from 'express-graphql';
import config from 'util/config';
import { schema } from 'endpoint';

const WEB_HOST = config.get('_host') || '*';

export default async function init_app() {
  const app = express();

  // Parse JSON bodies - must be before routes that need it
  app.use(express.json());

  // Build GraphQL schema (type-graphql buildSchema returns a Promise)
  const graphql_schema = await schema;

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.status(202).send('Accepted');
  });

  // Health check endpoint
  app.get('/healthcheck', (req: Request, res: Response) => {
    res.status(200).send('OK');
  });

  // Setup CORS and headers for all API routes
  app.use((req: Request, res: Response, next: any) => {
    res.header('Access-Control-Allow-Origin', WEB_HOST);
    res.header(
      'Access-Control-Allow-Headers',
      'Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With, auth-token, idempotency-key, user-agent'
    );
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Expires', '-1');
    res.setHeader('Cache-Control', 'no-cache');
    if (req.method === 'OPTIONS') {
      return res.status(200).send();
    }
    next();
  });

  // #region v1 API ------------------------------------------------

  // GraphQL endpoint
  app.use(
    '/v1',
    graphqlHTTP(async (request: Request | any, response: Response) => ({
      schema: graphql_schema,
      graphiql: {
        headerEditorEnabled: true,
      } as any,
      context: {
        auth_token: request.headers['auth-token'] || '',
        idempotency_key: request.headers['idempotency-key'] || '',
        ip: request.ip,
        user_agent: request.get('user-agent'),
      },
    }))
  );


  // #endregion REST Auth endpoints ---------------------------------

  app.set('port', config.get('port'));
  app.enable('trust proxy');
  app.disable('x-powered-by');

  return app;
}
