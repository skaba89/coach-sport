import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message?: string
}

/**
 * Captures render-time errors anywhere in the children subtree
 * and displays a friendly fallback UI instead of a white screen.
 *
 * Note: ErrorBoundary catches only errors thrown during render,
 * lifecycle methods, and in constructors. It does NOT catch errors
 * in event handlers, async code, or setTimeout — wrap those in try/catch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 pb-24 pt-20 text-center">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">Une erreur est survenue</h1>
          <p className="text-sm text-slate-400">
            L'application a rencontre un probleme inattendu. Vous pouvez recharger la page pour
            reprendre.
          </p>
          {this.state.message && (
            <pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-slate-800/60 p-2 text-xs text-slate-500">
              {this.state.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Recharger la page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
