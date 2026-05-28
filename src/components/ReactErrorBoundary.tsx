import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { GlobalErrorBoundary } from '../pages/GlobalErrorBoundary';

interface ReactErrorBoundaryProps {
    children: ReactNode;
}

interface ReactErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ReactErrorBoundary extends Component<ReactErrorBoundaryProps, ReactErrorBoundaryState> {
    constructor(props: ReactErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): ReactErrorBoundaryState {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ReactErrorBoundary caught runtime rendering crash:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <GlobalErrorBoundary error={this.state.error} />;
        }
        return this.props.children;
    }
}
