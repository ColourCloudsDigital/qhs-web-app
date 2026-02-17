'use client';
import { useThemeConfig } from '@/contexts/ThemeConfigContext';

const Overlay = () => {
    const { themeConfig, toggleSidebar } = useThemeConfig();
    return (
        <>
            {/* sidebar menu overlay */}
            <div className={`${(!themeConfig.sidebar && 'hidden') || ''} fixed inset-0 z-50 bg-[black]/60 lg:hidden`} onClick={() => toggleSidebar()}></div>
        </>
    );
};

export default Overlay;
