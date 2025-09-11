import React, { useState, useEffect } from 'react';
import { useUsers } from '@/contexts/UsersContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, User as UserIcon, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageUploadColumnist from '@/components/ImageUploadColumnist';

interface ColumnistSelfProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const ColumnistSelfProfileEditor: React.FC<ColumnistSelfProfileEditorProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser } = useAuth();
  const { updateUser } = useUsers();
  const { toast } = useToast();
  
  const [form, setForm] = useState({
    name: currentUser?.columnistProfile?.name || currentUser?.name || '',
    bio: currentUser?.columnistProfile?.bio || '',
    avatar: currentUser?.columnistProfile?.avatar || ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.columnistProfile) {
      setForm({
        name: currentUser.columnistProfile.name || currentUser.name || '',
        bio: currentUser.columnistProfile.bio || '',
        avatar: currentUser.columnistProfile.avatar || ''
      });
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    if (!currentUser) return;

    if (!form.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, preencha o nome do colunista.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const updatedProfile = {
        ...currentUser.columnistProfile,
        name: form.name.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar
      };

      const updatedUser = {
        ...currentUser,
        columnistProfile: updatedProfile
      };

      await updateUser(currentUser.id, updatedUser);

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });

      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'colunista') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Handle dialog state change
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Editar Meu Perfil
          </DialogTitle>
          <DialogDescription>
            Atualize sua foto de perfil e biografia que serão exibidas na sua página de colunista.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={form.avatar} alt={form.name} />
                <AvatarFallback className="text-lg">
                  {form.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-primary/10 rounded-full p-2">
                <Camera className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="w-full">
              <Label htmlFor="avatar-upload">Foto de Perfil</Label>
              <ImageUploadColumnist
                currentImage={form.avatar}
                onImageChange={(imageUrl) => {
                  // Update form with new avatar
                  setForm(prev => ({ ...prev, avatar: imageUrl }));
                  // Opcional: toast quando imagem é alterada
                  if (imageUrl) {
                    toast({
                      title: "Foto carregada",
                      description: "Sua foto de perfil foi carregada. Clique em 'Salvar Perfil' para confirmar as alterações."
                    });
                  }
                }}
                columnistName={form.name}
              />
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Seu nome como colunista"
              className="border-primary/30"
              required
            />
          </div>

          {/* Biografia */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Conte um pouco sobre você..."
              className="border-primary/30 min-h-[100px] resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Esta biografia será exibida na sua página de colunista.
            </p>
          </div>

          {/* Preview */}
          {(form.name || form.bio) && (
            <Card className="p-4 bg-muted/20">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Pré-visualização:</h4>
              <div className="flex items-start space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={form.avatar} alt={form.name} />
                  <AvatarFallback>
                    {form.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h5 className="font-medium text-foreground">{form.name || 'Nome do colunista'}</h5>
                  {form.bio && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {form.bio}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-hero hover:shadow-glow-primary"
            >
              {loading ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Perfil
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnistSelfProfileEditor;