import React, { useState } from 'react';
import { useUsers, type User } from '@/contexts/UsersContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BASE_NEWS_CATEGORIES } from '@/contexts/SupabaseNewsContext';
import { Save, X, Plus, User as UserIcon, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageUploadColumnist from '@/components/ImageUploadColumnist';
import { supabase } from '@/integrations/supabase/client';

interface ColumnistProfileEditorProps {
  columnistId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ColumnistProfileEditor: React.FC<ColumnistProfileEditorProps> = ({
  columnistId,
  isOpen,
  onClose
}) => {
  const { users, updateUser } = useUsers();
  const { toast } = useToast();
  
  const columnist = users.find(u => u.id === columnistId && u.role === 'colunista');
  
  const [profileData, setProfileData] = useState({
    name: columnist?.columnistProfile?.name || columnist?.name || '',
    bio: columnist?.columnistProfile?.bio || 'Colunista do portal.',
    specialty: columnist?.columnistProfile?.specialty || 'Colunista',
    avatar: columnist?.columnistProfile?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    allowedCategories: [] // Colunistas não usam categorias
  });

  const handleSave = async () => {
    if (!columnist) return;
    
    if (!profileData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    // Colunistas não necessitam de categorias - removida validação

    try {
      // Atualizar no localStorage (UsersContext)
      updateUser(columnistId, {
        name: profileData.name,
        columnistProfile: {
          id: columnistId,
          name: profileData.name,
          bio: profileData.bio,
          specialty: profileData.specialty,
          avatar: profileData.avatar,
          allowedCategories: [], // Colunistas não usam categorias
          isActive: columnist.columnistProfile?.isActive ?? true,
        }
      });

      // Sincronizar com Supabase (tabela profiles)
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          bio: profileData.bio,
          specialty: profileData.specialty,
          avatar: profileData.avatar,
          allowed_categories: [], // Colunistas não usam categorias
          updated_at: new Date().toISOString()
        })
        .eq('id', columnistId);

      if (error) {
        console.error('Error updating profile in Supabase:', error);
        toast({ 
          title: 'Erro na sincronização',
          description: 'Perfil atualizado localmente, mas houve erro na sincronização com o servidor.',
          variant: 'destructive'
        });
      } else {
        toast({ 
          title: 'Perfil atualizado',
          description: `Perfil de ${profileData.name} foi atualizado com sucesso.`
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ 
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o perfil.',
        variant: 'destructive'
      });
    }
    
    onClose();
  };

  // Funções de categoria removidas - colunistas não usam categorias

  if (!columnist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Perfil do Colunista
          </DialogTitle>
          <DialogDescription>
            Configure as informações e permissões do colunista.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-gradient-card border-primary/30 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Informações Básicas
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label>Nome do Colunista</Label>
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Nome completo do colunista"
                />
              </div>

              <div>
                <Label>Especialidade</Label>
                <Input
                  value={profileData.specialty}
                  onChange={(e) => setProfileData({ ...profileData, specialty: e.target.value })}
                  placeholder="Ex: Política e Questões Sociais"
                />
              </div>

              <div>
                <Label>Biografia</Label>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Descreva a experiência e background do colunista..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Upload de Foto */}
          <ImageUploadColumnist
            currentImage={profileData.avatar}
            onImageChange={(imageData) => setProfileData({ ...profileData, avatar: imageData })}
            columnistName={profileData.name}
          />

          {/* Informação sobre categoria - removida seção de categorias para colunistas */}
          <Card className="bg-gradient-card border-primary/30 p-6">
            <h3 className="text-lg font-semibold mb-4">Informações do Colunista</h3>
            <p className="text-muted-foreground text-sm">
              Colunistas publicam artigos de opinião independentes de categorias. 
              Seus textos aparecem na seção "Últimos Artigos dos Colunistas" e na página pessoal do colunista.
            </p>
          </Card>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-gradient-hero">
              <Save className="h-4 w-4 mr-2" />
              Salvar Perfil
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnistProfileEditor;