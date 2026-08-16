let mutationTail: Promise<void> = Promise.resolve();

export function enqueueStorageMutation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const result = mutationTail.then(operation);
  mutationTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export function waitForStorageMutations(): Promise<void> {
  return mutationTail;
}
