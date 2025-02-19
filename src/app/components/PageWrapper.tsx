'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import dynamic from 'next/dynamic';

const TreeDataProvider = dynamic(() => import('./TreeDataProvider'), {
    loading: () => (
        <div className="animate-pulse p-4">Loading tree data provider...</div>
    ),
});

const MultiParameterTemporalAnalysis = dynamic(
    () => import('./MultiParameterTemporalAnalysis'),
    {
        loading: () => (
            <div className="animate-pulse p-4">Loading analysis component...</div>
        ),
    }
);

const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = React.useState(false);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const handleError = (error) => {
            console.error('Caught error:', error);
            setHasError(true);
            setError(error);
        };

        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    if (hasError) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>
                    {error?.message || 'An unexpected error occurred'}
                </AlertDescription>
            </Alert>
        );
    }

    return children;
};

const PageWrapper = () => {
    return (
        <div className="min-h-screen bg-white">
            <ErrorBoundary>
                <div className="container mx-auto py-8">
                    <TreeDataProvider>
                        <MultiParameterTemporalAnalysis />
                    </TreeDataProvider>
                </div>
            </ErrorBoundary>
        </div>
    );
};

export default PageWrapper;