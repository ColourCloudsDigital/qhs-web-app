'use client';

export type PosTab = 'current' | 'placed' | 'processed';

interface OrderLineProps {
  selectedTab: PosTab;
  setSelectedTab: (tab: PosTab) => void;
  placedOrdersCount: number;
  processedOrdersCount: number;
}

export default function OrderLine({ selectedTab, setSelectedTab, placedOrdersCount, processedOrdersCount }: OrderLineProps) {
  const tabs: { key: PosTab; label: string; count?: number }[] = [
    { key: 'current', label: 'Current Order' },
    { key: 'placed', label: 'Pending Orders', count: placedOrdersCount },
    { key: 'processed', label: 'Complete Orders', count: processedOrdersCount },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setSelectedTab(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            selectedTab === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
