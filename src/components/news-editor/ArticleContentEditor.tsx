import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/RichTextEditor';
import { FileText } from 'lucide-react';

interface ArticleContentEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

const ArticleContentEditor: React.FC<ArticleContentEditorProps> = ({
  content,
  onContentChange,
}) => {
  return (
    <Card className="bg-gradient-card border-primary/30 p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-5 w-5 text-primary" />
        <Label className="text-lg font-semibold">
          Conteúdo do Artigo
        </Label>
      </div>
      
      <div className="prose-editor-container">
        <RichTextEditor
          content={content}
          onChange={onContentChange}
        />
      </div>
    </Card>
  );
};

export default ArticleContentEditor;