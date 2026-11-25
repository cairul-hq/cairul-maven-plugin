import { stripVTControlCharacters } from 'node:util';
import { z } from '@cairul/plugin-kit';
import { counts, option, selectors, stdout, list } from '@cairul/plugin-kit/runner';

function summarize(output, lifecycle) {
  const result = counts();
  let selected = false;
  for (const line of stripVTControlCharacters(output).split(/\r?\n/)) {
    if (line.includes(' --- ')) {
      selected =
        lifecycle === 'integration'
          ? /(?:maven-)?failsafe(?:-plugin)?:\S+:integration-test\b/.test(line)
          : /(?:maven-)?surefire(?:-plugin)?:\S+:test\b/.test(line);
    }
    if (!selected) continue;
    const summary = /Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+)/.exec(line);
    if (!summary) continue;
    const [, total, failures, errors, skips] = summary.map(Number);
    const failed = failures + errors;
    result.failed = Math.max(result.failed, failed);
    result.skipped = Math.max(result.skipped, skips);
    result.passed = Math.max(result.passed, total - skips - failed);
  }
  return result;
}

export default {
  command: ['mvn'],
  select: selectors({ modules: list, tests: list, lifecycle: z.enum(['unit', 'integration']).default('unit') }, [
    'modules',
    'tests',
  ]),
  build({ modules, tests, lifecycle }) {
    const property = lifecycle === 'integration' ? 'it.test' : 'test';
    return {
      args: [
        '-B',
        '-Dstyle.color=never',
        ...option('-pl', modules?.join(',')),
        ...(tests ? ['-D' + property + '=' + tests.join(',')] : []),
        lifecycle === 'integration' ? 'verify' : 'test',
      ],
      capture: true,
      read: stdout((output) => summarize(output, lifecycle)),
    };
  },
};
