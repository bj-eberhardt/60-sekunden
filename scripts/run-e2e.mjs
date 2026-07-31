import { spawnSync } from 'node:child_process';

const [, , mode, ...playwrightArgs] = process.argv;
const composeArgs = ['compose', '-f', 'docker-compose.e2e.yml'];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

function runRequired(command, args) {
  const status = run(command, args);

  if (status !== 0) {
    process.exit(status);
  }
}

if (mode !== 'test' && mode !== 'ui') {
  console.error('Usage: node scripts/run-e2e.mjs <test|ui> [...playwright args]');
  process.exit(1);
}

runRequired('docker', [...composeArgs, 'up', '-d', '--build', 'app-e2e']);
runRequired('docker', [...composeArgs, 'run', '--rm', 'playwright', 'npm', 'ci']);

const testArgs =
  mode === 'ui'
    ? ['test', '--ui', '--ui-host=0.0.0.0', '--ui-port=9324', ...playwrightArgs]
    : ['test', ...playwrightArgs];

const runArgs = [
  ...composeArgs,
  'run',
  '--rm',
  ...(mode === 'ui' ? ['--service-ports'] : []),
  'playwright',
  'npx',
  'playwright',
  ...testArgs,
];

const status = run('docker', runArgs);

if (mode === 'test') {
  run('docker', [...composeArgs, 'down']);
}

process.exit(status);
