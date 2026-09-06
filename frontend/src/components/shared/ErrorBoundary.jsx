import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('SAGIP render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            background: '#f4fbfc',
            color: '#003135',
          }}
        >
          <div
            style={{
              maxWidth: '32rem',
              border: '1px solid #afdde5',
              borderRadius: '1rem',
              background: '#fff',
              padding: '1.5rem',
            }}
          >
            <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.25rem' }}>
              SAGIP Manila failed to load
            </h1>
            <p style={{ margin: '0 0 1rem', lineHeight: 1.5 }}>
              The page hit a JavaScript error. Try a hard refresh (Cmd+Shift+R) or open{' '}
              <a href="http://localhost:5173/" style={{ color: '#024950' }}>
                http://localhost:5173/
              </a>{' '}
              in Chrome or Safari.
            </p>
            <pre
              style={{
                margin: 0,
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: '#f8fafb',
                fontSize: '0.75rem',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {this.state.error.message}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
