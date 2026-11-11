/** Releases a request-owned busy state only while that request is still current. */
export function releaseBusyForCurrentRequest(
  requestId: number,
  currentRequestId: number,
  release: () => void,
): boolean {
  if (requestId !== currentRequestId) return false;
  release();
  return true;
}
