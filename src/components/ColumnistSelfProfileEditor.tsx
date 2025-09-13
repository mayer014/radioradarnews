import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Save, Upload, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageUploadColumnist from './ImageUploadColumnist';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUsers } from '@/contexts/UsersContext';

interface ColumnistSelfProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColumnistSelfProfileEditor: React.FC<ColumnistSelfProfileEditorProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { user: authUser } = useSupabaseAuth();
  const { users, updateUser } = useUsers();
  const { toast } = useToast();

  const currentUser = users.find(u => u.id === authUser?.id);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setBio(currentUser.columnistProfile?.bio || '');
      setSpecialty(currentUser.columnistProfile?.specialty || '');
      setAvatar(currentUser.columnistProfile?.avatar || '');
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await updateUser(currentUser.id, {
        name,
        columnistProfile: {
          ...currentUser.columnistProfile!,
          name,
          bio,
          specialty,
          avatar,
        }
      });

      if (error) throw new Error(error);
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Meu Perfil
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidade</Label>
            <Input
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Foto de Perfil</Label>
            <ImageUploadColumnist
              currentImage={avatar}
              onImageChange={setAvatar}
              columnistName={name}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnistSelfProfileEditor;