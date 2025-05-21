import safe from 'safe-regex';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter regex pattern (without slashes): ', (pattern) => {
  rl.question('Enter flags (optional): ', (flags) => {
    try {
      const regex = new RegExp(pattern, flags);
      const isSafe = safe(regex);
      if (isSafe) {
        console.log('This regex is SAFE.');
      } else {
        console.log('This regex is UNSAFE (may be vulnerable to ReDoS).');
      }
    } catch (err) {
      console.error('Invalid regex:', err.message);
    }
    rl.close();
  });
});
