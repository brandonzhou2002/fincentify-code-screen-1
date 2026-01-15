import path from 'path';
import cfg from 'nconf';

const root = path.resolve(path.join(__dirname, '..', '..'));

const config = cfg
  .argv()
  .env({ lowerCase: true, separator: '__' })
  .file('defaults', {
    file: path.join(root, 'config', 'config.json'),
  });

export default config;
