import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare, User, Mail, Phone, Calendar, Eye, Trash2,
  KeyRound, AlertTriangle, ExternalLink,
} from 'lucide-react';
import type { ContactMessage } from '@/contexts/ContactContext';

interface DbMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface AdminMessagesTabProps {
  messages: ContactMessage[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string, subject: string) => void;
}

const AdminMessagesTab: React.FC<AdminMessagesTabProps> = ({ messages, onMarkAsRead, onDelete }) => {
  const [dbMessages, setDbMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDbMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setDbMessages((data || []) as DbMessage[]);
    setLoading(false);
  };

  useEffect(() => { fetchDbMessages(); }, []);

  const handleMarkRead = async (id: string) => {
    await supabase.from('contact_messages').update({ read: true }).eq('id', id);
    setDbMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const handleDeleteDb = async (id: string, subject: string) => {
    if (!confirm(`Excluir mensagem "${subject}"?`)) return;
    await supabase.from('contact_messages').delete().eq('id', id);
    setDbMessages(prev => prev.filter(m => m.id !== id));
  };

  const passwordResetRequests = dbMessages.filter(m => m.subject.includes('[REDEFINIÇÃO DE SENHA]'));
  const regularDbMessages = dbMessages.filter(m => !m.subject.includes('[REDEFINIÇÃO DE SENHA]'));
  const unreadResets = passwordResetRequests.filter(m => !m.read);

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const msg = encodeURIComponent(`Olá ${name}! Sua senha foi redefinida com sucesso. Por favor, faça login com a nova senha.`);
    window.open(`https://wa.me/${phoneWithCountry}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* ─── Password Reset Alerts ─── */}
      {unreadResets.length > 0 && (
        <div className="rounded-lg border-2 border-amber-500/50 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-amber-400">
              🔑 {unreadResets.length} solicitação(ões) de redefinição de senha pendente(s)
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Usuários solicitaram redefinição de senha. Acesse a aba Utilidade Pública → Usuários para redefinir e avise pelo WhatsApp.
          </p>
        </div>
      )}

      {/* ─── Password Reset Requests Section ─── */}
      {passwordResetRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-500" />
            Solicitações de Redefinição de Senha ({passwordResetRequests.length})
          </h2>
          {passwordResetRequests.map(m => (
            <Card key={m.id} className={`p-4 border-l-4 ${!m.read ? 'border-l-amber-500 bg-amber-500/5' : 'border-l-muted'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <KeyRound className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold">{m.name}</span>
                    {!m.read && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">PENDENTE</Badge>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{m.email}</span>
                    {m.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(m.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.phone && (
                    <Button size="sm" variant="outline" className="gap-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={() => openWhatsApp(m.phone!, m.name)}>
                      <ExternalLink className="h-3 w-3" /> WhatsApp
                    </Button>
                  )}
                  {!m.read && (
                    <Button size="sm" variant="outline" onClick={() => handleMarkRead(m.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteDb(m.id, m.subject)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Regular DB Messages ─── */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Mensagens de Contato ({regularDbMessages.length + messages.length})
        </h2>

        {loading && <p className="text-sm text-muted-foreground">Carregando mensagens...</p>}

        {!loading && regularDbMessages.length === 0 && messages.length === 0 && (
          <Card className="bg-gradient-card border-primary/30 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma mensagem encontrada</h3>
            <p className="text-muted-foreground">As mensagens enviadas pelo formulário de contato aparecerão aqui.</p>
          </Card>
        )}

        {/* DB messages */}
        {regularDbMessages.map(m => (
          <Card key={m.id} className={`p-4 ${!m.read ? 'border-l-4 border-l-primary' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{m.subject}</h3>
                  {!m.read && <Badge className="bg-primary text-primary-foreground text-[10px]">Nova</Badge>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{m.name}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{m.email}</span>
                  {m.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone}</span>}
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(m.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">{m.message}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!m.read && (
                  <Button size="sm" variant="outline" onClick={() => handleMarkRead(m.id)}
                    className="border-primary/50 hover:bg-primary/10">
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleDeleteDb(m.id, m.subject)}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {/* In-memory messages (legacy) */}
        {messages
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(message => (
            <Card key={message.id} className={`p-4 ${!message.read ? 'border-l-4 border-l-primary' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{message.subject}</h3>
                    {!message.read && <Badge className="bg-primary text-primary-foreground text-[10px]">Nova</Badge>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{message.name}</span>
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{message.email}</span>
                    {message.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{message.phone}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(message.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">{message.message}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!message.read && (
                    <Button size="sm" variant="outline" onClick={() => onMarkAsRead(message.id)}
                      className="border-primary/50 hover:bg-primary/10">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => onDelete(message.id, message.subject)}
                    className="border-destructive/50 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default AdminMessagesTab;
