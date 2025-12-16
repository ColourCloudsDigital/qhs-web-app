'use client';

import React from 'react';
import IconInfoCircle from '../icon/icon-info-circle';

interface PerformanceItem {
  id: string;
  name: string;
  value: number;
  percentOfTotal: number;
  color: string;
}

interface PerformanceListProps {
  title: string;
  items: PerformanceItem[];
  valuePrefix?: string;
  valueSuffix?: string;
}

const PerformanceList: React.FC<PerformanceListProps> = ({
  title,
  items,
  valuePrefix = '',
  valueSuffix = '',
}) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <div className="mb-5 flex items-center justify-between">
        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h5>
      </div>
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center">
            <div className="h-9 w-9 ltr:mr-3 rtl:ml-3">
              <div 
                className={`grid h-9 w-9 place-content-center rounded-full text-white`}
                style={{ backgroundColor: item.color }}
              >
                <IconInfoCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-2 flex font-semibold">
                <h6 className="text-gray-700 dark:text-gray-300">{item.name}</h6>
                <p className="ml-auto text-gray-900 dark:text-white">
                  {valuePrefix}{(item.value || 0).toLocaleString()}{valueSuffix}
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${item.percentOfTotal}%`,
                    backgroundColor: item.color,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceList;