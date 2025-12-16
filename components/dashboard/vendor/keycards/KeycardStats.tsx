'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Key, KeyRound, Lock, CheckCircle } from 'lucide-react';

interface KeycardStatsProps {
  stats: {
    totalKeycards: number;
    activeKeycards: number;
    configuredKeycards: number;
    assignedKeycards: number;
  };
}

export default function KeycardStats({ stats }: KeycardStatsProps) {
  const { totalKeycards, activeKeycards, configuredKeycards, assignedKeycards } = stats;
  
  // Calculate percentages
  const activePercent = totalKeycards > 0 ? Math.round((activeKeycards / totalKeycards) * 100) : 0;
  const configuredPercent = totalKeycards > 0 ? Math.round((configuredKeycards / totalKeycards) * 100) : 0;
  const assignedPercent = totalKeycards > 0 ? Math.round((assignedKeycards / totalKeycards) * 100) : 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Keycards</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalKeycards}</div>
          <p className="text-xs text-muted-foreground">
            Available keycards in your system
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Keycards</CardTitle>
          <KeyRound className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeKeycards}</div>
          <p className="text-xs text-muted-foreground">
            {activePercent}% of total keycards are active
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Configured Keycards</CardTitle>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{configuredKeycards}</div>
          <p className="text-xs text-muted-foreground">
            {configuredPercent}% of total keycards are configured
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assigned Keycards</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{assignedKeycards}</div>
          <p className="text-xs text-muted-foreground">
            {assignedPercent}% of total keycards are assigned
          </p>
        </CardContent>
      </Card>
    </div>
  );
}