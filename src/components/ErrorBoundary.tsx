import { Box, Text } from 'ink';
import type React from 'react';
import { Component } from 'react';

type ErrorBoundaryProps = {
  readonly children: React.ReactNode;
  readonly fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box flexDirection="column" padding={1}>
          <Text color="red" bold>
            Something went wrong
          </Text>
          <Text color="red">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text dimColor>
            Please try again or check the console for more details
          </Text>
        </Box>
      );
    }

    return this.props.children;
  }
}
