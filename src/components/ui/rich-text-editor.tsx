import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
// @ts-ignore – tiptap task list extensions missing type declarations
import TaskList from '@tiptap/extension-task-list';
// @ts-ignore – tiptap task item extension missing type declarations
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline as UnderlineIcon, Link2 as LinkIcon, Image as ImageIcon, X, List, CheckSquare } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Import CSS for proper list rendering
import './rich-text-editor.css';

type RichTextEditorProps = {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
  hideToolbar?: boolean;
};

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Write something...',
  className,
  onImageUpload,
  hideToolbar = false,
}: RichTextEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);



  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list',
          },
        },
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (hideToolbar) {
        return;
      }
      onChange(editor.getHTML());
    },
    editorProps: {
      handlePaste: (view, event) => handlePaste(view, event),
    },      
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!hideToolbar);
    }
  }, [editor, hideToolbar]);

  const handlePaste = useCallback(async (view: any, event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return false;

    let hasHandled = false;

    // Check for image files in the clipboard
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 && onImageUpload) {
        const file = items[i].getAsFile();
        if (file) {
          event.preventDefault();
          hasHandled = true;

          try {
            const url = await onImageUpload(file);
            if (url) {
              editor?.chain().focus().setImage({ src: url }).run();
            }
          } catch (error) {
            console.error('Error pasting image:', error);
          }
          return true; // We've handled this paste event
        }
      }
    }

    // Handle HTML/text content if no images were found
    if (!hasHandled && editor && event.clipboardData) {
      const html = event.clipboardData.getData('text/html');
      const text = event.clipboardData.getData('text/plain');

      if (html) {
        // Handle HTML content
        event.preventDefault();
        const pastedHTML = new DOMParser().parseFromString(html, 'text/html');

        // Clean up the pasted HTML (optional, you can customize this)
        const cleanHTML = pastedHTML.body.innerHTML
          .replace(/<\/?span[^>]*>/g, '') // Remove spans
          .replace(/style="[^"]*"/g, ''); // Remove inline styles

        editor.commands.insertContent(cleanHTML);
        return true;
      } else if (text) {
        // Handle plain text
        event.preventDefault();
        editor.commands.insertContent(text);
        return true;
      }
    }

    return hasHandled;
  }, [editor, onImageUpload]);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setIsLinkModalOpen(true);
  }, [editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }

    setIsLinkModalOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const handleImageUpload = async () => {
    if (!selectedFile || !onImageUpload) return;

    try {
      setIsUploading(true);
      const url = await onImageUpload(selectedFile);

      if (editor && url) {
        editor.chain().focus().setImage({ src: url }).run();
      }

      setSelectedFile(null);
      setImageUrl('');
      setIsImageModalOpen(false);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {!hideToolbar && <div className="border-b p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'h-8 w-8 p-0", rounded',
            editor.isActive('bold') ? 'bg-accent text-accent-foreground' : ''
          )}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'h-8 w-8 p-0 rounded',
            editor.isActive('italic') ? 'bg-accent text-accent-foreground' : ''
          )}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            'h-8 w-8 p-0 rounded',
            editor.isActive('underline') ? 'bg-accent text-accent-foreground' : ''
          )}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <div className="h-8 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('h-8 w-8 p-0 rounded', editor.isActive('bulletList') ? 'bg-accent text-accent-foreground' : '')}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn('h-8 w-8 p-0 rounded', editor.isActive('taskList') ? 'bg-accent text-accent-foreground' : '')}
          title="Task checklist"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
        <div className="h-8 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={setLink}
          className={cn(
            'h-8 w-8 p-0 rounded',
            editor.isActive('link') ? 'bg-accent text-accent-foreground' : ''
          )}
          title="Add link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        {onImageUpload && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsImageModalOpen(true)}
            className="h-8 w-8 p-0 rounded"
            title="Add image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        )}
      </div>}

      <div className="p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
        <EditorContent
          editor={editor}
          className="prose max-w-none focus:outline-none rich-text-content"
          disabled={hideToolbar}
          readOnly={hideToolbar}
        />
      </div>

      {!hideToolbar && editor && (
        // <BubbleMenu 
        //   editor={editor} 
        //   tippyOptions={{ duration: 100 }}
        //   className="bg-background border rounded-md shadow-lg p-1 flex gap-1"
        // >
        <div className="bg-background border rounded-md shadow-lg p-1 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'h-8 w-8 p-0 rounded',
              editor.isActive('bold') ? 'bg-accent text-accent-foreground' : ''
            )}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'h-8 w-8 p-0 rounded',
              editor.isActive('italic') ? 'bg-accent text-accent-foreground' : ''
            )}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={cn(
              'h-8 w-8 p-0 rounded',
              editor.isActive('link') ? 'bg-accent text-accent-foreground' : ''
            )}
            title="Add link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-background p-4 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Link</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setLinkUrl('');
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Enter URL"
                className="w-full p-2 border rounded"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSetLink();
                  } else if (e.key === 'Escape') {
                    setIsLinkModalOpen(false);
                    setLinkUrl('');
                  }
                }}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    setLinkUrl('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSetLink}>Apply</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {isImageModalOpen && onImageUpload && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-background p-4 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Upload Image</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsImageModalOpen(false);
                  setSelectedFile(null);
                  setImageUrl('');
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {imageUrl ? (
                <div className="relative">
                  <img src={imageUrl} alt="Preview" className="max-h-48 w-auto mx-auto rounded" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedFile(null);
                      setImageUrl('');
                    }}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </label>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsImageModalOpen(false);
                    setSelectedFile(null);
                    setImageUrl('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImageUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
