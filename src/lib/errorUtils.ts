/**
 * Helper to determine if an error is an AbortError / cancelled request
 */
export function isAbortError(err: any): boolean {
  if (!err) return false;
  if (err?.name === 'AbortError') return true;
  if (err?.code === 20) return true;
  if (typeof err === 'string') {
    const lower = err.toLowerCase();
    return lower.includes('aborted') || lower.includes('abort');
  }
  if (typeof err?.message === 'string') {
    const lower = err.message.toLowerCase();
    return (
      lower.includes('aborted') ||
      lower.includes('abort') ||
      lower.includes('the user aborted a request')
    );
  }
  return false;
}
