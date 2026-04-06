'use client';

interface OrderLineProps {
  selectedTab: 'current' | 'processed';
  setSelectedTab: (tab: 'current' | 'processed') => void;
  processedOrdersCount: number;
}

export default function OrderLine({ selectedTab, setSelectedTab, processedOrdersCount }: OrderLineProps) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setSelectedTab('current')}
        className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
          selectedTab === 'current'
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
        }`}
      >
        Current Order
      </button>
      <button
        onClick={() => setSelectedTab('processed')}
        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
          selectedTab === 'processed'
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
        }`}
      >
        Processed Orders
        {processedOrdersCount > 0 && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
            {processedOrdersCount}
          </span>
        )}
      </button>
    </div>
  );
}
