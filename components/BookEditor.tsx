'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Highlighter,
  Link as LinkIcon,
  BookOpen,
  Eye,
  Save,
  Loader2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

// Define the form schema
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  content: z.string().min(1, 'Content is required'),
});

interface BookEditorProps {
  onUploadComplete?: (bookId: string) => void;
  initialContent?: string;
  initialTitle?: string;
  initialAuthor?: string;
  isEditing?: boolean;
}

export function BookEditor({ 
  onUploadComplete, 
  initialContent = '', 
  initialTitle = '', 
  initialAuthor = '',
  isEditing = false
}: BookEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [author, setAuthor] = useState(initialAuthor);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [wordCount, setWordCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialTitle,
      author: initialAuthor,
      content: initialContent,
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your book here...',
      }),
      Underline,
    ],
    content: initialContent,
    onUpdate: ({ editor: editorInstance }: { editor: ReturnType<typeof useEditor> }) => {
      const text = editorInstance.getText();
      const words = text.split(/\s+/).filter(Boolean).length;
      setWordCount(words);
      setPageCount(Math.ceil(words / 250)); // Assuming 250 words per page

      // Auto-save after 5 seconds of inactivity
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      const timer = setTimeout(() => {
        handleAutoSave(editorInstance);
      }, 5000);
      setAutoSaveTimer(timer);
    }
  });

  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  const handleAutoSave = useCallback(async (editor: ReturnType<typeof useEditor>) => {
    if (!editor?.getText() || !title) return;

    try {
      const response = await fetch('/api/books/autosave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          author,
          content: editor?.getHTML(),
          wordCount,
          pageCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Auto-save failed');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [title, author, isEditing, wordCount, pageCount]);

  const addLink = useCallback(() => {
    const url = window.prompt('URL');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleSubmit = async () => {
    if (!title || !editor?.getText()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch('/api/books/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          author,
          content: editor?.getHTML(),
          wordCount,
          pageCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Book uploaded successfully!"
      });
      onUploadComplete?.(data.bookId);
      
      // Reset form
      setTitle('');
      setAuthor('');
      editor?.commands.setContent('');
      setWordCount(0);
      setPageCount(0);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload book"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Book' : 'Create New Book'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Book Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter book title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Enter author name"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">
              <BookOpen className="w-4 h-4 mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={editor?.isActive('bold') ? 'bg-gray-200' : ''}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={editor?.isActive('italic') ? 'bg-gray-200' : ''}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={editor?.isActive('underline') ? 'bg-gray-200' : ''}
                >
                  <UnderlineIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  className={editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  className={editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  className={editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const color = window.prompt('Enter color (e.g., #ff0000)');
                    if (color) {
                      editor?.chain().focus().setColor(color).run();
                    }
                  }}
                >
                  <Palette className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const color = window.prompt('Enter highlight color (e.g., #ff0000)');
                    if (color) {
                      editor?.chain().focus().toggleHighlight({ color }).run();
                    }
                  }}
                >
                  <Highlighter className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addLink}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 min-h-[400px] prose max-w-none">
                <EditorContent editor={editor} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="border rounded-lg p-4 min-h-[400px] prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {wordCount} words • {pageCount} pages
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isUploading || !title || !editor?.getText()}
            className="ml-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update Book' : 'Save Book'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 