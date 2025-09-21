import React from 'react';
import { Button } from '@/components/ui/button';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { generateFeedImage, downloadBlob } from '@/utils/shareHelpers';
import { debugColumnistShare } from '@/utils/shareDebugHelper';
import { useToast } from '@/hooks/use-toast';

export const ColumnistShareTest: React.FC = () => {
  const { articles } = useSupabaseNews();
  const { toast } = useToast();
  
  // Find a columnist article for testing (specifically "mayer" if available)
  const testArticle = articles.find(article => 
    article.columnist_name?.toLowerCase().includes('mayer') ||
    article.author_id === 'mayer' ||
    article.columnist_id === 'mayer'
  ) || articles.find(article => !!article.columnist_name);
  
  const runTest = async () => {
    if (!testArticle) {
      toast({
        title: "Erro",
        description: "Nenhum artigo de colunista encontrado para teste",
        variant: "destructive"
      });
      return;
    }
    
    console.log('🧪 Iniciando teste de compartilhamento de colunista...');
    
    // Run debug analysis
    const debugResult = debugColumnistShare(testArticle.id, testArticle);
    
    try {
      const shareData = debugResult.data;
      
      // Generate image
      const imageBlob = await generateFeedImage({
        title: shareData.title,
        image: shareData.image || '',
        category: shareData.category,
        columnist: shareData.columnist,
        summary: testArticle.excerpt
      });
      
      const fileName = `test-columnist-share-${Date.now()}.jpg`;
      downloadBlob(fileName, imageBlob);
      
      toast({
        title: "Teste concluído!",
        description: `Imagem gerada para ${shareData.columnist?.name || 'colunista'}. Verifique o console para detalhes.`,
      });
      
      console.log('✅ Teste de compartilhamento concluído com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      toast({
        title: "Erro no teste",
        description: "Verifique o console para detalhes do erro",
        variant: "destructive"
      });
    }
  };
  
  if (!testArticle) {
    return (
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">Teste de Compartilhamento de Colunista</h3>
        <p className="text-sm text-muted-foreground">
          Nenhum artigo de colunista encontrado para teste.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="font-semibold mb-2">Teste de Compartilhamento de Colunista</h3>
      <div className="text-sm text-muted-foreground mb-4">
        <p><strong>Artigo de teste:</strong> {testArticle.title.substring(0, 50)}...</p>
        <p><strong>Colunista:</strong> {testArticle.columnist_name}</p>
        <p><strong>Categoria:</strong> {testArticle.category}</p>
      </div>
      
      <Button onClick={runTest} className="w-full">
        🧪 Executar Teste de Compartilhamento
      </Button>
      
      <div className="mt-4 p-3 bg-muted/50 rounded text-xs">
        <p><strong>Este teste irá:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Auditar os dados do colunista</li>
          <li>Gerar uma imagem de compartilhamento</li>
          <li>Baixar o resultado para análise</li>
          <li>Mostrar logs detalhados no console</li>
        </ul>
      </div>
    </div>
  );
};