import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCog, 
  Crown, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Shield,
  UserX,
  UserCheck
} from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'colunista';
  avatar?: string;
  bio?: string;
  specialty?: string;
  allowed_categories?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SupabaseUsersManager = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    username: '',
    name: '',
    role: 'colunista' as 'admin' | 'colunista'
  });
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const { profile: currentProfile } = useSupabaseAuth();
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: newUser.username,
            name: newUser.name,
            role: newUser.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the profile with the correct role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: newUser.role })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Usuário criado",
        description: `Usuário ${newUser.name} criado com sucesso`,
      });

      setNewUser({
        email: '',
        password: '',
        username: '',
        name: '',
        role: 'colunista'
      });

      fetchProfiles();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (profileId: string, newRole: 'admin' | 'colunista') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Função atualizada",
        description: `Usuário promovido para ${newRole}`,
      });

      fetchProfiles();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar função do usuário",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (profileId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Usuário ${!isActive ? 'ativado' : 'desativado'}`,
      });

      fetchProfiles();
    } catch (error: any) {
      console.error('Error toggling active status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      // Delete from auth (this will cascade to profiles due to FK constraint)
      const { error } = await supabase.auth.admin.deleteUser(profileId);

      if (error) throw error;

      toast({
        title: "Usuário deletado",
        description: "Usuário removido com sucesso",
      });

      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar usuário",
        variant: "destructive",
      });
    }
  };

  if (currentProfile?.role !== 'admin') {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4" />
          <p>Acesso negado. Apenas administradores podem gerenciar usuários.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create User Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Criar Novo Usuário
        </h3>
        
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome completo"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="username">Nome de Usuário</Label>
            <Input
              id="username"
              value={newUser.username}
              onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Digite o nome de usuário"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Digite o email"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Digite a senha"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <Label htmlFor="role">Função</Label>
            <Select 
              value={newUser.role} 
              onValueChange={(value: 'admin' | 'colunista') => setNewUser(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="colunista">Colunista</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Users List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Usuários do Sistema
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Carregando usuários...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                    {profile.role === 'admin' ? (
                      <Crown className="h-5 w-5 text-white" />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium">{profile.name}</h4>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role === 'admin' ? 'Admin' : 'Colunista'}
                    </Badge>
                    <Badge variant={profile.is_active ? 'default' : 'destructive'}>
                      {profile.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {profile.id !== currentProfile?.id && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(profile.id, profile.is_active)}
                      >
                        {profile.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateRole(
                          profile.id, 
                          profile.role === 'admin' ? 'colunista' : 'admin'
                        )}
                      >
                        {profile.role === 'admin' ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProfile(profile.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SupabaseUsersManager;