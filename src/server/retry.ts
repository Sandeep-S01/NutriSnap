type RetryOptions = {
  attempts: number;
  delayMs: number;
  shouldRetry?: (error: unknown) => boolean;
};

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  { attempts, delayMs, shouldRetry = () => true }: RetryOptions,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !shouldRetry(error)) {
        throw error;
      }

      await wait(delayMs * attempt);
    }
  }

  throw lastError;
}
