'use client';

import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Loader2 } from 'lucide-react';

interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface TaskCommentsTabProps {
  comments: TaskComment[];
  comment: string;
  setComment: (value: string) => void;
  isSubmittingComment: boolean;
  onSubmitComment: () => void;
}

export default function TaskCommentsTab({
  comments,
  comment,
  setComment,
  isSubmittingComment,
  onSubmitComment,
}: TaskCommentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end mt-2">
              <Button 
                onClick={onSubmitComment} 
                disabled={!comment.trim() || isSubmittingComment}
              >
                {isSubmittingComment ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="mr-2 h-4 w-4" />
                )}
                Add Comment
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {comments.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No comments yet. Be the first to add a comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((comment) => (
                  <div key={comment.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                          {comment.user.name.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <p className="text-sm font-medium">{comment.user.name}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'PPp')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-line">{comment.content}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}