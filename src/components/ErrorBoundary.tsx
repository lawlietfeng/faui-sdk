import React from 'react';

interface Props {
  componentId: string;
  componentType: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[FAUI] Component "${this.props.componentId}" (${this.props.componentType}) crashed:`,
      error,
      info.componentStack
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '8px 12px',
          border: '1px dashed #ff4d4f',
          borderRadius: 4,
          color: '#ff4d4f',
          fontSize: 12,
          background: '#fff2f0',
        }}>
          Component error: {this.props.componentId} ({this.props.componentType})
        </div>
      );
    }
    return this.props.children;
  }
}
