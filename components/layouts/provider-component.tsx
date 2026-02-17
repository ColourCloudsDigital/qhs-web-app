'use client';
import App from '@/App';
import { ThemeConfigProvider } from '@/contexts/ThemeConfigContext';
import React, { ReactNode, Suspense } from 'react';
import { appWithI18Next } from 'ni18n';
import { ni18nConfig } from 'ni18n.config.ts';
import Loading from '@/components/layouts/loading';

interface IProps {
    children?: ReactNode;
}

const ProviderComponent = ({ children }: IProps) => {
    return (
        <ThemeConfigProvider>
            <Suspense fallback={<Loading />}>
                <App>{children} </App>
            </Suspense>
        </ThemeConfigProvider>
    );
};

export default ProviderComponent;
