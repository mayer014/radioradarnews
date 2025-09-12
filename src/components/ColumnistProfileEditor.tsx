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
import { BASE_NEWS_CATEGORIES } from '@/contexts/NewsContext';
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
    allowedCategories: columnist?.columnistProfile?.allowedCategories || []
  });

  const handleSave = async () => {
    if (!columnist) return;
    
    if (!profileData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    if (profileData.allowedCategories.length === 0) {
      toast({ title: 'Selecione pelo menos uma categoria', variant: 'destructive' });
      return;
    }

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
          allowedCategories: profileData.allowedCategories,
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
          allowed_categories: profileData.allowedCategories,
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

  const addCategory = (category: string) => {
    if (!profileData.allowedCategories.includes(category)) {
      setProfileData({
        ...profileData,
        allowedCategories: [...profileData.allowedCategories, category]
      });
    }
  };

  const removeCategory = (category: string) => {
    setProfileData({
      ...profileData,
      allowedCategories: profileData.allowedCategories.filter(c => c !== category)
    });
  };

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

          {/* Categorias Permitidas */}
          <Card className="bg-gradient-card border-primary/30 p-6">
            <h3 className="text-lg font-semibold mb-4">Categorias Permitidas</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Categorias atuais</Label>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-border/50 rounded-md bg-muted/20">
                  {profileData.allowedCategories.length === 0 ? (
                    <span className="text-muted-foreground text-sm">Nenhuma categoria selecionada</span>
                  ) : (
                    profileData.allowedCategories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                        {cat}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => removeCategory(cat)}
                        />
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div>
                <Label>Adicionar categoria</Label>
                <Select value="" onValueChange={addCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria para adicionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASE_NEWS_CATEGORIES
                      .filter(c => !profileData.allowedCategories.includes(c))
                      .map((c) => (
                        <SelectItem key={c} value={c}>
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            {c}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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