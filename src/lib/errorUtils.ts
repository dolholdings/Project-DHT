/**
 * Helper to determine if an error is an AbortError / cancelled request
 */
export function isAbortError(err: any): boolean {
  if (!err) return false;
  if (err?.name === 'AbortError') return true;
  if (err?.code === 20) return true;
  if (err?.name === 'DOMException' && (err?.code === 20 || String(err?.message || '').toLowerCase().includes('abort'))) {
    return true;
  }
  if (typeof err === 'string') {
    const lower = err.toLowerCase();
    return lower.includes('aborted') || lower.includes('abort') || lower.includes('cancelled') || lower.includes('canceled');
  }
  if (typeof err?.message === 'string') {
    const lower = err.message.toLowerCase();
    return (
      lower.includes('aborted') ||
      lower.includes('abort') ||
      lower.includes('the user aborted a request') ||
      lower.includes('request was aborted') ||
      lower.includes('operation was aborted') ||
      lower.includes('user cancelled') ||
      lower.includes('user canceled')
    );
  }
  if (typeof err?.toString === 'function') {
    const str = String(err).toLowerCase();
    if (str.includes('aborted') || str.includes('abort') || str.includes('the user aborted a request')) {
      return true;
    }
  }
  return false;
}
