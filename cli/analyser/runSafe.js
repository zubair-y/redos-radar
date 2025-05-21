import safe from 'safe-regex';
import { performance } from 'perf_hooks';

export function dangerous(pattern, flags = '') {
  try {
    return !safe(new RegExp(pattern, flags));
  } catch {
    return true;         
  }
}

export function worstCaseTime(pattern, flags = '') {
  try {
    const re = new RegExp(pattern, flags);
    const testInput = 'a'.repeat(50);  
    const t0 = performance.now();
    re.test(testInput);
    return performance.now() - t0;     
  } catch {
    return -1;                          
  }
}
