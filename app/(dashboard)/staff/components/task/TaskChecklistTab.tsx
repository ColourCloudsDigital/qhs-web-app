'use client';

import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ListChecks } from 'lucide-react';

interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  order: number;
}

interface TaskChecklistTabProps {
  checklist: ChecklistItem[];
  isUpdatingChecklist: boolean;
  onChecklistItemUpdate: (itemId: string, isCompleted: boolean) => void;
}

export default function TaskChecklistTab({
  checklist,
  isUpdatingChecklist,
  onChecklistItemUpdate,
}: TaskChecklistTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <ListChecks className="mr-2 h-5 w-5" />
          Task Checklist
        </CardTitle>
        <CardDescription>
          Complete all steps required for this task
        </CardDescription>
      </CardHeader>
      <CardContent>
        {checklist.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No checklist items have been added to this task.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {checklist
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded-md border flex items-start gap-3 ${
                    item.isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={(e) => onChecklistItemUpdate(item.id, e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                      disabled={isUpdatingChecklist}
                    />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                      {item.description}
                    </p>
                    {item.isCompleted && item.completedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completed {format(new Date(item.completedAt), 'PPp')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}