// Catches a render crash and shows a short recovery message.
// main.jsx wraps the whole app in this boundary.
// It does not read a data module. The message is the error text.

import { Component } from 'react'

// If a child throws, we store the error and replace the page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  // React calls this to record the error on the next render.
  static getDerivedStateFromError(error) {
    return { error }
  }

  // Log the stack so we can see it in the browser console.
  componentDidCatch(error, info) {
    console.error('AGOS render error:', error, info)
  }

  // Recovery card when there is an error, otherwise the children.
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
              AGOS Manila failed to load
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
