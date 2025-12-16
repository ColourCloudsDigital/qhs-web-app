'use client';

import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChartComponentProps {
  title: string;
  subtitle?: string;
  chartOptions: ApexOptions;
  series: ApexNonAxisChartSeries | ApexAxisChartSeries;
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radar' | 'polarArea';
  height?: number | string;
  tabs?: string[];
  onTabChange?: (tab: string) => void;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  title,
  subtitle,
  chartOptions,
  series,
  type,
  height = 350,
  tabs,
  onTabChange,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs ? tabs[0] : '');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h5>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>

        {tabs && (
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      <div>
        {isMounted && (
          <ReactApexChart
            options={chartOptions}
            series={series}
            type={type}
            height={height}
            width="100%"
          />
        )}
      </div>
    </div>
  );
};

export default ChartComponent;