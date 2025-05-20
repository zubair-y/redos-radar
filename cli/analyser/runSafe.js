import safe from 'safe-regex';
import { performance } from 'perf_hooks';

/* -------------------------------------------------
 * tiny helpers:  (1) static safe-regex verdict
 *                (2) worst-case runtime probe
 * ------------------------------------------------- */

export function dangerous(pattern, flags = '') {
  try {
    return !safe(new RegExp(pattern, flags));
  } catch {
    return true;          // if it fails to compile, treat as dangerous
  }
}

export function worstCaseTime(pattern, flags = '') {
  try {
    const re = new RegExp(pattern, flags);
    const testInput = 'a'.repeat(50);   // coarse workload
    const t0 = performance.now();
    re.test(testInput);
    return performance.now() - t0;      // milliseconds
  } catch {
    return -1;                          // invalid regex
  }
}
