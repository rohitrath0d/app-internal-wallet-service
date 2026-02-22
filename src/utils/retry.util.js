

async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      // pg db codes
      // 40P01 - deadlock detected
      // 40001 - Serialization failure
      if ((err.code === '40P01' || err.code === '40001') && i < retries - 1) {
        console.log('Deadlock detected. Retrying...');
        continue;
      }
      throw err;
    }
  }
}

export {withRetry};