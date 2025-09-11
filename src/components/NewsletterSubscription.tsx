import React, { useState } from 'react';
import { useNewsletter } from '@/contexts/NewsletterContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Check, X } from 'lucide-react';

interface NewsletterSubscriptionProps {
  variant?: 'inline' | 'popup' | 'sidebar';
  source?: string;
  className?: string;
}

const NewsletterSubscription: React.FC<NewsletterSubscriptionProps> = ({ 
  variant = 'inline', 
  source = 'general',
  className = ''
}) => {
  const { addSubscriber, settings } = useNewsletter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  if (!settings.subscriptionFormEnabled) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, digite seu email.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = addSubscriber(email.trim(), name.trim() || undefined, source);
      
      if (success) {
        setIsSubscribed(true);
        toast({
          title: "Inscrição realizada!",
          description: "Você receberá nossas melhores notícias por email.",
        });
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setEmail('');
          setName('');
          setIsSubscribed(false);
        }, 3000);
      } else {
        toast({
          title: "Email já cadastrado",
          description: "Este email já está inscrito em nossa newsletter.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao inscrever",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Variante inline (para usar em páginas)
  if (variant === 'inline') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Receba nossas notícias</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre-se e seja o primeiro a saber das principais notícias
            </p>
          </div>
          
          {isSubscribed ? (
            <div className="text-center py-4">
              <Check className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">Inscrição realizada com sucesso!</p>
              <p className="text-sm text-muted-foreground">
                Verifique seu email para confirmar
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="newsletter-name" className="sr-only">Nome</Label>
                <Input
                  id="newsletter-name"
                  type="text"
                  placeholder="Seu nome (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="newsletter-email" className="sr-only">Email</Label>
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Inscrevendo...' : 'Inscrever-se'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Não enviamos spam. Cancele quando quiser.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  // Variante sidebar (compacta)
  if (variant === 'sidebar') {
    return (
      <div className={`bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg ${className}`}>
        <div className="flex items-center mb-3">
          <Mail className="h-5 w-5 text-primary mr-2" />
          <h4 className="font-medium text-sm">Newsletter</h4>
        </div>
        
        {isSubscribed ? (
          <div className="text-center py-2">
            <Check className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-green-800">Inscrito com sucesso!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="text-xs"
            />
            <Button 
              type="submit" 
              size="sm"
              className="w-full text-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Inscrevendo...' : 'Inscrever'}
            </Button>
          </form>
        )}
      </div>
    );
  }

  // Variante popup (modal/overlay)
  if (variant === 'popup') {
    return (
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Mail className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-lg font-semibold">Não perca nenhuma notícia!</h3>
                <p className="text-sm text-muted-foreground">
                  Receba as principais notícias diretamente no seu email
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsSubscribed(true)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {isSubscribed ? (
              <div className="text-center py-4">
                <Check className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">Obrigado pela inscrição!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Seu nome (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Inscrevendo...' : 'Inscrever-se'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsSubscribed(true)}
                  >
                    Agora não
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default NewsletterSubscription;