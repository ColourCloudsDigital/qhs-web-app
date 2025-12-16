import React from 'react';
import { Text, Button, Section, Row, Column } from '@react-email/components';
import EmailLayout from '../templates/layout';

interface TaskAssignedProps {
  name: string;
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  hotelName: string;
  priority: string;
  dueDate: string;
  assignedBy: string;
  taskDetailsUrl: string;
}

export default function TaskAssigned({
  name,
  taskId,
  taskTitle,
  taskDescription,
  hotelName,
  priority,
  dueDate,
  assignedBy,
  taskDetailsUrl,
}: TaskAssignedProps) {
  // Function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <EmailLayout
      preview={`New Task Assigned: ${taskTitle}`}
      heading="New Task Assigned"
    >
      <Section>
        <Text className="text-base text-gray-700">
          Hello {name},
        </Text>
        
        <Text className="text-base text-gray-700">
          You have been assigned a new task at {hotelName} by {assignedBy}.
        </Text>
        
        <Section className="my-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <Text className="text-lg font-bold text-gray-800">{taskTitle}</Text>
          
          <Text className="mb-4 mt-2 text-base text-gray-700">
            {taskDescription}
          </Text>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Task ID:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{taskId}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Hotel:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{hotelName}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Priority:</Text>
            </Column>
            <Column>
              <Text className={`text-sm font-medium ${getPriorityColor(priority)}`}>
                {priority}
              </Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Due Date:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{dueDate}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Assigned By:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{assignedBy}</Text>
            </Column>
          </Row>
        </Section>
        
        <Section className="my-8 text-center">
          <Button
            href={taskDetailsUrl}
            className="rounded-md bg-primary px-6 py-3 text-center text-base font-medium text-white"
          >
            View Task Details
          </Button>
        </Section>
        
        <Text className="text-base text-gray-700">
          Please review the task details and update the status as you progress. If you have any questions or need clarification about this task, please reach out to {assignedBy}.
        </Text>
        
        <Text className="mt-8 text-base text-gray-700">
          Best regards,<br />
          The Qaras Hotels Team
        </Text>
      </Section>
    </EmailLayout>
  );
}