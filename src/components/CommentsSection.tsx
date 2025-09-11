import React, { useState } from 'react';
import { useComments } from '@/contexts/CommentsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, User, Clock } from 'lucide-react';

interface CommentsSectionProps {
  articleId: string;
  articleTitle: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ articleId, articleTitle }) => {
  const { 
    addComment, 
    getApprovedCommentsByArticle, 
    settings 
  } = useComments();
  
  const { toast } = useToast();
  const [commentForm, setCommentForm] = useState({
    name: '',
    email: '',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const approvedComments = getApprovedCommentsByArticle(articleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentForm.name.trim() || !commentForm.email.trim() || !commentForm.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (commentForm.content.length > settings.maxLength) {
      toast({
        title: "Comentário muito longo",
        description: `O comentário deve ter no máximo ${settings.maxLength} caracteres.`,
        variant: "destructive"
      });
      return;
    }

    // Verificar se o email está bloqueado
    if (settings.blockedEmails.includes(commentForm.email.toLowerCase())) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar seu comentário.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      addComment({
        articleId,
        name: commentForm.name.trim(),
        email: commentForm.email.trim().toLowerCase(),
        content: commentForm.content.trim(),
        ip: '127.0.0.1' // Em produção, capturar IP real
      });

      if (settings.moderationRequired) {
        toast({
          title: "Comentário enviado",
          description: "Seu comentário foi enviado e está aguardando moderação.",
        });
      } else {
        toast({
          title: "Comentário publicado",
          description: "Seu comentário foi publicado com sucesso.",
        });
      }

      setCommentForm({ name: '', email: '', content: '' });
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar seu comentário. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Seção de comentários existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Comentários ({approvedComments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Seja o primeiro a comentar este artigo!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedComments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-primary/20 pl-4 py-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{comment.name}</span>
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário para novo comentário */}
      <Card>
        <CardHeader>
          <CardTitle>Deixe seu comentário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="comment-name">Nome *</Label>
                <Input
                  id="comment-name"
                  type="text"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm({...commentForm, name: e.target.value})}
                  placeholder="Seu nome"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="comment-email">Email *</Label>
                <Input
                  id="comment-email"
                  type="email"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm({...commentForm, email: e.target.value})}
                  placeholder="seu@email.com"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O email não será exibido publicamente
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="comment-content">Comentário *</Label>
              <Textarea
                id="comment-content"
                value={commentForm.content}
                onChange={(e) => setCommentForm({...commentForm, content: e.target.value})}
                placeholder="Escreva seu comentário..."
                rows={4}
                disabled={isSubmitting}
                maxLength={settings.maxLength}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {commentForm.content.length}/{settings.maxLength} caracteres
              </p>
            </div>

            {settings.moderationRequired && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Moderação:</strong> Seu comentário será revisado antes de ser publicado.
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting || !commentForm.name.trim() || !commentForm.email.trim() || !commentForm.content.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Comentário
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentsSection;