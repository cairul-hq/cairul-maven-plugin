import { testRunner } from '@cairul/pdk/runner';
import adapter from './run.mjs';
import { junit, testPlugin } from '@cairul/pdk/reports';

const reports = testPlugin('maven.passed', { junit });

export default testRunner(reports, 'maven.run', adapter);
