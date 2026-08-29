/**
 * Tiny toast / inline error helper for IndexedDB write failures.
 *
 * The app is offline-first and never had user-visible error feedback for
 * persistence failures. This is a minimal stop-gap before a proper toast
 * library is introduced. Works by mounting a fixed-position div and
 * removing it after `duration` ms.
 */

const TOAST_ID = 'calisthenies-toast'

export function showToast(message: string, kind: 'error' | 'success' = 'error', duration = 4000) {
  if (typeof document === 'undefined') return
  const existing = document.getElementById(TOAST_ID)
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = TOAST_ID
  toast.setAttribute('role', 'alert')
  toast.setAttribute('aria-live', 'assertive')
  toast.textContent = message
  toast.style.cssText = [
    'position: fixed',
    'left: 50%',
    'top: 1rem',
    'transform: translateX(-50%)',
    'z-index: 1000',
    'max-width: calc(100vw - 2rem)',
    'padding: 0.75rem 1rem',
    'border-radius: 0.75rem',
    'font-size: 0.875rem',
    'font-weight: 500',
    'color: white',
    'background: ' + (kind === 'error' ? '#9c4a43' : '#428258'),
    'box-shadow: 0 8px 24px rgba(0,0,0,0.3)',
    'pointer-events: none',
  ].join(';')
  document.body.appendChild(toast)
  window.setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast)
  }, duration)
}

/**
 * Run an async DB operation; on failure, show a user-visible toast
 * and rethrow so the caller can decide whether to also revert UI state.
 */
export async function withToast<T>(promise: Promise<T>, errorMessage: string): Promise<T> {
  try {
    return await promise
  } catch (err) {
    console.error(errorMessage, err)
    showToast(errorMessage)
    throw err
  }
}
