import safe from "safe-regex2";
import { performance } from "perf_hooks";

export function dangerous(pattern, flags = "") {
  try {
    return !safe(pattern, flags);
  } catch {
    return true;
  }
}

export function worstCaseTime(pattern, flags = "") {
  let re;
  try {
    re = new RegExp(pattern, flags);
  } catch {
    return { ms: -1, inputLen: 0 };
  }

  let len = 8;
  let slow = { ms: 0, inputLen: 0 };

  while (len <= 2 ** 18) {
    const probe = "a".repeat(len) + "!";
    const t0 = performance.now();
    re.test(probe);
    const dt = performance.now() - t0;

    if (dt > slow.ms) slow = { ms: dt, inputLen: len };
    if (dt >= 500) break;
    len <<= 1;
  }
  return slow;
}
