import React, { useMemo, useState } from 'react';
import { useUsers, type User } from '@/contexts/UsersContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { NEWS_CATEGORIES, BASE_NEWS_CATEGORIES } from '@/contexts/NewsContext';
import { Trash2, UserPlus, Shield, User as UserIcon, KeyRound, Plus, X, Settings, Eye, EyeOff, Copy, Edit, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ColumnistProfileEditor from '@/components/ColumnistProfileEditor';

const UsersManager: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, resetPassword, isLoading, refreshUsers } = useUsers();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    role: 'colunista' as 'admin' | 'colunista',
    name: '',
    username: '',
    password: '123456',
  });
  const [editingColumnistId, setEditingColumnistId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const admins = useMemo(() => users.filter(u => u.role === 'admin'), [users]);
  const columnists = useMemo(() => users.filter(u => u.role === 'colunista'), [users]);

  const handleAdd = () => {
    if (!form.name || !form.username) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (form.role === 'admin') {
      addUser({
        role: 'admin',
        name: form.name,
        username: form.username,
        password: form.password,
      });
    } else {
      addUser({
        role: 'colunista',
        name: form.name,
        username: form.username,
        password: form.password,
        columnistProfile: {
          id: form.username.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
          name: form.name,
          avatar: '', // Será definido via upload posteriormente
          bio: 'Colunista do portal.',
          specialty: 'Colunista',
          allowedCategories: [BASE_NEWS_CATEGORIES[0]], // Categoria padrão inicial
          isActive: true,
        },
      });
    }
    toast({ 
      title: 'Usuário criado', 
      description: form.role === 'admin' 
        ? `Administrador ${form.username} adicionado.`
        : `Colunista ${form.username} adicionado. Configure o perfil completo clicando em "Editar Perfil".`
    });
    setForm({ role: 'colunista', name: '', username: '', password: '123456' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUser(id);
      toast({ title: 'Usuário excluído' });
    }
  };

  const handleResetPassword = (id: string) => {
    const pwd = prompt('Nova senha para este usuário:', '123456');
    if (pwd) {
      resetPassword(id, pwd);
      toast({ title: 'Senha redefinida' });
    }
  };

  const handleEditColumnist = (id: string) => {
    setEditingColumnistId(id);
  };

  const toggleColumnistStatus = async (id: string) => {
    const columnist = users.find(u => u.id === id && u.role === 'colunista');
    if (columnist?.columnistProfile) {
      const newStatus = !columnist.columnistProfile.isActive;
      
      try {
        const { error } = await updateUser(id, {
          columnistProfile: {
            ...columnist.columnistProfile,
            isActive: newStatus
          }
        });

        if (error) {
          console.error('Erro ao atualizar status do colunista:', error);
          toast({ 
            title: 'Erro ao atualizar status',
            description: 'Não foi possível alterar o status do colunista. Tente novamente.',
            variant: 'destructive'
          });
          return;
        }

        toast({ 
          title: newStatus ? 'Colunista ativado' : 'Colunista desativado',
          description: newStatus 
            ? `${columnist.name} pode fazer login e seus artigos estão visíveis.`
            : `${columnist.name} não pode fazer login e seus artigos estão ocultos.`
        });
      } catch (error) {
        console.error('Erro ao atualizar status do colunista:', error);
        toast({ 
          title: 'Erro ao atualizar status',
          description: 'Ocorreu um erro inesperado. Tente novamente.',
          variant: 'destructive'
        });
      }
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copyCredentials = (username: string, password: string) => {
    const credentials = `Usuário: ${username}\nSenha: ${password}`;
    navigator.clipboard.writeText(credentials);
    toast({ title: 'Credenciais copiadas!', description: 'Login e senha copiados para a área de transferência' });
  };

  const handleMigrateSupabase = async () => {
    try {
      setIsSubmitting(true);
      await refreshUsers();
      toast({
        title: "Migração concluída",
        description: "Usuários atualizados do Supabase.",
      });
    } catch (error) {
      toast({
        title: "Erro na migração",
        description: "Não foi possível migrar os usuários.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        users: users,
        metadata: {
          totalUsers: users.length,
          admins: users.filter(u => u.role === 'admin').length,
          columnists: users.filter(u => u.role === 'colunista').length,
        }
      };

      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup exportado",
        description: "Arquivo de backup baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Migration Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
          <div className="flex gap-2">
            <Button
              onClick={handleMigrateSupabase}
              disabled={isSubmitting}
              variant="outline"
              className="border-primary/50"
            >
              {isSubmitting ? 'Migrando...' : 'Atualizar do Supabase'}
            </Button>
            <Button
              onClick={handleExportBackup}
              variant="outline"
              className="border-secondary/50"
            >
              Exportar Backup
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-primary/30 p-6 lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo usuário
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Tipo</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as any })}>
                  <SelectTrigger className="border-primary/30">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="colunista">Colunista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Usuário (login)</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Senha</Label>
                <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              {form.role === 'colunista' && (
                <div className="col-span-2 p-4 bg-muted/20 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Após criar o colunista:</strong> Use o botão "Editar Perfil" para configurar categorias, biografia, especialidade e foto.
                  </p>
                </div>
              )}
            </div>
            <Button onClick={handleAdd} className="w-full bg-gradient-hero">Adicionar</Button>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-card border-primary/30 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" /> Administradores ({admins.length})
            </h3>
            <div className="space-y-3">
              {admins.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-4">
                    <Badge>Admin</Badge>
                    <div className="space-y-1">
                      <span className="font-medium">{u.name}</span>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Login:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">{u.username}</code>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Senha:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {visiblePasswords[u.id] ? u.password : '••••••••'}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0" 
                            onClick={() => togglePasswordVisibility(u.id)}
                          >
                            {visiblePasswords[u.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0" 
                            onClick={() => copyCredentials(u.username, u.password)}
                            title="Copiar credenciais"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleResetPassword(u.id)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {u.id !== 'admin' && (
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/40" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {admins.length === 0 && <p className="text-sm text-muted-foreground">Nenhum admin cadastrado.</p>}
            </div>
          </Card>

          <Card className="bg-gradient-card border-primary/30 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5" /> Colunistas ({columnists.length})
            </h3>
            <div className="space-y-3">
              {columnists.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                        {u.columnistProfile?.avatar ? (
                          <img 
                            src={u.columnistProfile.avatar} 
                            alt={u.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              console.error('Error loading user avatar for:', u.name, u.columnistProfile?.avatar?.substring(0, 100));
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                <div class="w-full h-full bg-muted/50 flex items-center justify-center">
                                  <span class="text-xs text-muted-foreground">${u.name[0]?.toUpperCase()}</span>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{u.name}</span>
                        <div className="flex items-center gap-1">
                          {u.columnistProfile?.isActive ? (
                            <Badge variant="outline" className="text-xs text-success border-success/40">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-destructive border-destructive/40">
                              <UserX className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {u.columnistProfile?.allowedCategories.map((cat) => (
                            <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Login:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">{u.username}</code>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Senha:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {visiblePasswords[u.id] ? u.password : '••••••••'}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0" 
                            onClick={() => togglePasswordVisibility(u.id)}
                          >
                            {visiblePasswords[u.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0" 
                            onClick={() => copyCredentials(u.username, u.password)}
                            title="Copiar credenciais"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${u.id}`} className="text-sm font-medium">
                          {u.columnistProfile?.isActive ? 'Ativo' : 'Inativo'}
                        </Label>
                        <Switch
                          id={`active-${u.id}`}
                          checked={u.columnistProfile?.isActive ?? true}
                          onCheckedChange={() => toggleColumnistStatus(u.id)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditColumnist(u.id)}
                          title="Editar perfil completo"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleResetPassword(u.id)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/40" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Editor de Perfil do Colunista */}
      {editingColumnistId && (
        <ColumnistProfileEditor
          columnistId={editingColumnistId}
          isOpen={!!editingColumnistId}
          onClose={() => setEditingColumnistId(null)}
        />
      )}
    </div>
  );
};

export default UsersManager;
