const fs = require('fs');
const path = require('path');

// Function to read .env file manually
function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  return env;
}

const localEnv = readEnv(path.join(__dirname, '.env'));
const apiBaseUrl = process.env.API_BASE_URL || localEnv.API_BASE_URL || '/api';

const envFile = `export const environment = {
  production: true,
  apiBaseUrl: '${apiBaseUrl}'
};
`;

const targetPath = path.join(__dirname, './src/app/environments/environment.prod.ts');
const targetPathDev = path.join(__dirname, './src/app/environments/environment.ts');

fs.writeFileSync(targetPath, envFile);
fs.writeFileSync(targetPathDev, envFile.replace('production: true', 'production: false'));

console.log(`Environment files generated with API_BASE_URL: ${apiBaseUrl}`);
