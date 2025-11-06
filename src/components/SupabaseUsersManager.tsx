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
  UserCheck,
  Copy,
  KeyRound,
  UserPlus,
  UserIcon
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
    password: '123456',
    username: '',
    name: '',
    role: 'colunista' as 'admin' | 'colunista'
  });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({});
  const { profile: currentProfile } = useSupabaseAuth();
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false});

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const profilesWithRoles = (profilesData || []).map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'colunista' as 'admin' | 'colunista'
        };
      });

      setProfiles(profilesWithRoles);
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
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

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
        // Add role to user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: newUser.role });

        if (roleError) throw roleError;

        // Store password temporarily for display
        setVisiblePasswords(prev => ({
          ...prev,
          [authData.user.id]: newUser.password
        }));
      }

      toast({
        title: "Usuário criado",
        description: `Usuário ${newUser.name} criado com sucesso`,
      });

      setNewUser({
        email: '',
        password: '123456',
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

  const handleResetPassword = async (profileId: string, userName: string) => {
    const newPassword = prompt(`Nova senha para ${userName}:`, '123456');
    if (!newPassword) return;

    try {
      // Update password in Supabase Auth
      const { error } = await supabase.auth.admin.updateUserById(profileId, {
        password: newPassword
      });

      if (error) throw error;

      // Store temporarily for display
      setVisiblePasswords(prev => ({
        ...prev,
        [profileId]: newPassword
      }));

      toast({
        title: "Senha redefinida",
        description: `Nova senha para ${userName}: ${newPassword}`,
      });

      // Clear displayed password after 30 seconds
      setTimeout(() => {
        setVisiblePasswords(prev => {
          const updated = { ...prev };
          delete updated[profileId];
          return updated;
        });
      }, 30000);

    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erro",
        description: "Erro ao redefinir senha",
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = (profileId: string) => {
    if (visiblePasswords[profileId]) {
      setVisiblePasswords(prev => {
        const updated = { ...prev };
        delete updated[profileId];
        return updated;
      });
    }
  };

  const copyCredentials = (username: string, password: string) => {
    const credentials = `Usuário: ${username}\nSenha: ${password}`;
    navigator.clipboard.writeText(credentials);
    toast({ 
      title: 'Credenciais copiadas!', 
      description: 'Login e senha copiados para a área de transferência' 
    });
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

  const admins = profiles.filter(p => p.role === 'admin');
  const columnists = profiles.filter(p => p.role === 'colunista');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Criação */}
        <Card className="bg-gradient-card border-primary/30 p-6 lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo usuário
          </h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as any })}>
                <SelectTrigger className="border-primary/30">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="colunista">Colunista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome</Label>
              <Input 
                value={newUser.name} 
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} 
                placeholder="Nome completo"
                required
              />
            </div>
            <div>
              <Label>Usuário (login)</Label>
              <Input 
                value={newUser.username} 
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} 
                placeholder="Nome de usuário"
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                type="email"
                value={newUser.email} 
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} 
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input 
                type="text"
                value={newUser.password} 
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} 
                placeholder="Senha inicial"
                required
              />
            </div>
            {newUser.role === 'colunista' && (
              <div className="p-4 bg-muted/20 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Após criar o colunista:</strong> Configure categorias, biografia e foto no perfil.
                </p>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-gradient-hero">
              {loading ? 'Criando...' : 'Adicionar'}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Administradores */}
          <Card className="bg-gradient-card border-primary/30 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" /> Administradores ({admins.length})
            </h3>
            <div className="space-y-3">
              {admins.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-4">
                    <Badge>Admin</Badge>
                    <div className="space-y-1">
                      <span className="font-medium">{user.name}</span>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Login:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">{user.username}</code>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Senha:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {visiblePasswords[user.id] ? visiblePasswords[user.id] : '••••••••'}
                          </code>
                          {visiblePasswords[user.id] && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0" 
                                onClick={() => togglePasswordVisibility(user.id)}
                              >
                                <EyeOff className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0" 
                                onClick={() => copyCredentials(user.username, visiblePasswords[user.id])}
                                title="Copiar credenciais"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleResetPassword(user.id, user.name)}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {user.username !== 'admin' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive border-destructive/40" 
                        onClick={() => handleDeleteProfile(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {admins.length === 0 && <p className="text-sm text-muted-foreground">Nenhum admin cadastrado.</p>}
            </div>
          </Card>

          {/* Colunistas */}
          <Card className="bg-gradient-card border-primary/30 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5" /> Colunistas ({columnists.length})
            </h3>
            <div className="space-y-3">
              {columnists.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Login:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">{user.username}</code>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Senha:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {visiblePasswords[user.id] ? visiblePasswords[user.id] : '••••••••'}
                          </code>
                          {visiblePasswords[user.id] && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0" 
                                onClick={() => togglePasswordVisibility(user.id)}
                              >
                                <EyeOff className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0" 
                                onClick={() => copyCredentials(user.username, visiblePasswords[user.id])}
                                title="Copiar credenciais"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={user.is_active ? "outline" : "default"} 
                      size="sm" 
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      title={user.is_active ? "Desativar" : "Ativar"}
                    >
                      {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleResetPassword(user.id, user.name)}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive border-destructive/40" 
                      onClick={() => handleDeleteProfile(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {columnists.length === 0 && <p className="text-sm text-muted-foreground">Nenhum colunista cadastrado.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupabaseUsersManager;