import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, FileText, Shield, Info } from 'lucide-react';
import { useLegalContent } from '@/contexts/LegalContentContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from '@/components/accessibility/LoadingState';

const LegalContentManager = () => {
  const { contents, loading, getContent, updateContent } = useLegalContent();
  const { toast } = useToast();
  
  const [privacyData, setPrivacyData] = useState({
    title: '',
    content: ''
  });
  
  const [termsData, setTermsData] = useState({
    title: '',
    content: ''
  });
  
  const [saving, setSaving] = useState<{privacy: boolean, terms: boolean}>({
    privacy: false,
    terms: false
  });

  useEffect(() => {
    const privacyContent = getContent('privacy_policy');
    const termsContent = getContent('terms_of_service');
    
    if (privacyContent) {
      setPrivacyData({
        title: privacyContent.title,
        content: privacyContent.content
      });
    }
    
    if (termsContent) {
      setTermsData({
        title: termsContent.title,
        content: termsContent.content
      });
    }
  }, [contents, getContent]);

  const handleSavePrivacy = async () => {
    if (!privacyData.title.trim() || !privacyData.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSaving(prev => ({ ...prev, privacy: true }));
    
    try {
      const result = await updateContent('privacy_policy', privacyData.title, privacyData.content);
      
      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive"
        });
      }
    } finally {
      setSaving(prev => ({ ...prev, privacy: false }));
    }
  };

  const handleSaveTerms = async () => {
    if (!termsData.title.trim() || !termsData.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSaving(prev => ({ ...prev, terms: true }));
    
    try {
      const result = await updateContent('terms_of_service', termsData.title, termsData.content);
      
      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive"
        });
      }
    } finally {
      setSaving(prev => ({ ...prev, terms: false }));
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Informações Legais
          </h2>
          <p className="text-muted-foreground">
            Gerencie o conteúdo das páginas de Política de Privacidade e Termos de Uso
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          As alterações aqui feitas serão refletidas automaticamente nas páginas públicas do site.
          Use formatação Markdown para melhor apresentação do conteúdo.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="privacy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Política de Privacidade
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Termos de Uso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="bg-gradient-card border-primary/20 p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="privacy-title">Título da Página</Label>
                <Input
                  id="privacy-title"
                  value={privacyData.title}
                  onChange={(e) => setPrivacyData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Política de Privacidade"
                />
              </div>
              
              <div>
                <Label htmlFor="privacy-content">Conteúdo (Markdown)</Label>
                <Textarea
                  id="privacy-content"
                  value={privacyData.content}
                  onChange={(e) => setPrivacyData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite o conteúdo da política de privacidade usando formatação Markdown..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSavePrivacy}
                  disabled={saving.privacy}
                  className="bg-gradient-hero"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving.privacy ? 'Salvando...' : 'Salvar Política de Privacidade'}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="space-y-6">
          <Card className="bg-gradient-card border-primary/20 p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="terms-title">Título da Página</Label>
                <Input
                  id="terms-title"
                  value={termsData.title}
                  onChange={(e) => setTermsData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Termos de Uso"
                />
              </div>
              
              <div>
                <Label htmlFor="terms-content">Conteúdo (Markdown)</Label>
                <Textarea
                  id="terms-content"
                  value={termsData.content}
                  onChange={(e) => setTermsData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite o conteúdo dos termos de uso usando formatação Markdown..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveTerms}
                  disabled={saving.terms}
                  className="bg-gradient-hero"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving.terms ? 'Salvando...' : 'Salvar Termos de Uso'}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalContentManager;