import React, { Component, ErrorInfo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { spacing, fontSize, borderRadius } from '../constants/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>!</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            The app encountered an unexpected error. Your data is safe — try
            restarting.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#f5f8fc',
  },
  icon: {
    fontSize: 48,
    fontWeight: '800',
    color: '#c0392b',
    width: 80,
    height: 80,
    lineHeight: 80,
    textAlign: 'center',
    borderRadius: 40,
    backgroundColor: '#c0392b15',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.md,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: '#1a5276',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
