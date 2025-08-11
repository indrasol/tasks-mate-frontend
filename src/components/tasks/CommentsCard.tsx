import { deriveDisplayFromEmail } from "@/lib/projectUtils";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { ChevronDown, Edit, MessageCircle, Send, Trash2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

// Comment Component Type
type CommentType = {
    comment_id: string;
    user_email?: string;
    user?: {
        email: string;
        name?: string;
    };
    text?: string;
    content?: string;
    created_at?: string;
    createdAt?: string;
    replies?: CommentType[];
};

type CommentProps = {
    comment: CommentType;
    user: any;
    onEdit: (commentId: string) => void;
    onDelete: (commentId: string) => void;
    onReply: (commentId: string, reply: string) => void;
    editingComment: string | null;
    editCommentText: string;
    setEditCommentText: (text: string) => void;
    onSaveEdit: (commentId: string) => void;
    onCancelEdit: () => void;
    replyingTo: string | null;
    setReplyingTo: (commentId: string | null) => void;
    replyText: string;
    setReplyText: (text: string) => void;
    task: any;
};

const CommentComponent: React.FC<CommentProps> = ({
    comment,
    user,
    onEdit,
    onDelete,
    onReply,
    editingComment,
    editCommentText,
    setEditCommentText,
    onSaveEdit,
    onCancelEdit,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    task
}) => {
    const isEditing = editingComment === comment.comment_id;
    const isReplying = replyingTo === comment.comment_id;
    const { displayName: authorName } = deriveDisplayFromEmail(comment.user_email || comment.user?.email || '');
    const isCurrentUser = user?.email === (comment.user_email || comment.user?.email);

    return (
        <div className={`rounded-lg border p-4 ${isCurrentUser ? 'bg-blue-50' : 'bg-white'}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{authorName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium text-sm">{authorName}</div>
                        <div className="text-xs text-gray-500">
                            {new Date(comment.created_at || comment.createdAt || '').toLocaleString()}
                        </div>
                    </div>
                </div>

                {isCurrentUser && (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onEdit(comment.comment_id)}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                            title="Edit comment"
                        >
                            <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => onDelete(comment.comment_id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                            title="Delete comment"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-2 text-sm text-gray-800">
                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="min-h-20"
                        />
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onCancelEdit}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => onSaveEdit(comment.comment_id)}
                                disabled={!editCommentText.trim()}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap">{comment.text || comment.content}</div>
                )}
            </div>

            <div className="mt-2 flex items-center justify-between">
                <button
                    onClick={() => setReplyingTo(isReplying ? null : comment.comment_id)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    {isReplying ? 'Cancel' : 'Reply'}
                </button>

                {comment.replies?.length > 0 && (
                    <div className="text-xs text-gray-500">
                        {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </div>
                )}
            </div>

            {isReplying && (
                <div className="mt-3 pl-4 border-l-2 border-gray-200">
                    <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${authorName}...`}
                        className="min-h-16 text-sm"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyingTo(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                onReply(comment.comment_id, replyText);
                                setReplyText('');
                            }}
                            disabled={!replyText.trim()}
                        >
                            Reply
                        </Button>
                    </div>
                </div>
            )}

            {/* Nested Replies */}
            {comment.replies?.length > 0 && (
                <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-200">
                    {comment.replies.map((reply: CommentType) => (
                        <div key={reply.comment_id} className="bg-gray-50 p-3 rounded">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback>
                                            {deriveDisplayFromEmail(reply.user_email || reply.user?.email || '').displayName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium">
                                        {deriveDisplayFromEmail(reply.user_email || reply.user?.email || '').displayName}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {new Date(reply.created_at || reply.createdAt || '').toLocaleString()}
                                </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-800">{reply.text || reply.content}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


export default CommentComponent;