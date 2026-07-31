const marker = '<!-- pr-ci-comment -->';

const checks = [
  ['Typecheck', process.env.TYPECHECK_OUTCOME],
  ['Lint', process.env.LINT_OUTCOME],
  ['Format', process.env.PRETTIER_OUTCOME],
  ['Unit tests', process.env.TEST_OUTCOME],
  ['Build', process.env.BUILD_OUTCOME],
  ['E2E', process.env.E2E_OUTCOME],
];

const artifacts = [
  ['Build artifact', process.env.DIST_URL],
  ['Playwright report', process.env.PLAYWRIGHT_REPORT_URL],
  ['Test results', process.env.TEST_RESULTS_URL],
].filter(([, url]) => Boolean(url));

function icon(outcome) {
  switch (outcome) {
    case 'success':
      return 'PASS';
    case 'failure':
      return 'FAIL';
    case 'cancelled':
      return 'CANCELLED';
    case 'skipped':
      return 'SKIPPED';
    default:
      return 'UNKNOWN';
  }
}

const lines = [
  marker,
  '## Pull Request CI',
  '',
  '| Check | Result |',
  '| --- | --- |',
  ...checks.map(([name, outcome]) => `| ${name} | ${icon(outcome)} (${outcome ?? 'unknown'}) |`),
  '',
  `Run: ${process.env.RUN_URL ?? 'unavailable'}`,
];

if (artifacts.length > 0) {
  lines.push('', '### Artifacts', '');
  lines.push(...artifacts.map(([name, url]) => `- [${name}](${url})`));
}

console.log(lines.join('\n'));
