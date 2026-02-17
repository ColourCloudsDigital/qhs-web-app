'use client';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useThemeConfig } from '@/contexts/ThemeConfigContext';
import Loading from '@/components/layouts/loading';
import { getTranslation } from '@/i18n';

function App({ children }: PropsWithChildren) {
    const { themeConfig } = useThemeConfig();
    const { initLocale } = getTranslation();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // locale
        initLocale(themeConfig.locale);
        setIsLoading(false);
    }, [initLocale, themeConfig.locale]);

    return (
        <div
            className={`${(themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${
                themeConfig.rtlClass
            } main-section relative font-nunito text-sm font-normal antialiased`}
        >
            {isLoading ? <Loading /> : children}
        </div>
    );
}

export default App;
