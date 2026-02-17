'use client';
import { useThemeConfig } from '@/contexts/ThemeConfigContext';
import React from 'react';

const MainContainer = ({ children }: { children: React.ReactNode }) => {
    const { themeConfig } = useThemeConfig();
    return <div className={`${themeConfig.navbar} main-container min-h-screen text-black dark:text-white-dark`}> {children}</div>;
};

export default MainContainer;
