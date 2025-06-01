import safe from "safe-regex2";
import { performance } from "perf_hooks";

export function dangerous(pattern, flags = "") {
  try {
    return !safe(pattern, flags);
  } catch {
    return true;
  }
}

function pickProbeChar(pattern) {
  if (/(\\d|\[0-9])/.test(pattern)) return "1";
  if (/(\\s|\[\\s])/.test(pattern)) return " ";
  if (/(\\w|\[A-Za-z0-9_])/.test(pattern)) return "a";
  return "a";
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
    const probeChar = pickProbeChar(pattern);
    const probe = probeChar.repeat(len) + "!";
    const t0 = performance.now();
    re.test(probe);
    const dt = performance.now() - t0;

    if (dt > slow.ms) slow = { ms: dt, inputLen: len };
    if (dt >= 500) break;
    len <<= 1;
  }
  return slow;
}
