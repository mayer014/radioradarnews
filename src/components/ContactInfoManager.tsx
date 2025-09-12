import React, { useState } from 'react';
import { useSupabaseContactInfo } from '@/contexts/SupabaseContactInfoContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Phone, Mail, MapPin, Clock, Globe, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContactInfoManager = () => {
  const { contactInfo, updateContactInfo, loading } = useSupabaseContactInfo();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(contactInfo || {
    phone1: '',
    phone2: '',
    email1: '',
    email2: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    weekdays_hours: '',
    saturday_hours: '',
    sunday_hours: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    youtube_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update formData when contactInfo changes
  React.useEffect(() => {
    if (contactInfo) {
      setFormData(contactInfo);
    }
  }, [contactInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.phone1 || !formData.email1 || !formData.address) {
      toast({
        title: "Campos obrigatórios",
        description: "Telefone principal, email principal e endereço são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateContactInfo(formData);
      toast({
        title: "Sucesso",
        description: "Informações de contato atualizadas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar informações de contato.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Informações de Contato</h2>
          <p className="text-muted-foreground">Configure as informações de contato da empresa</p>
        </div>
        <Button
          onClick={() => navigate('/contato')}
          variant="outline"
          className="border-primary/50 hover:bg-primary/10"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Ver Página de Contato
        </Button>
      </div>

      {/* Contact Form */}
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Telefones */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Phone className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Telefones</h3>
            </div>
            
            <div>
              <Label htmlFor="phone1">Telefone Principal *</Label>
              <Input
                id="phone1"
                value={formData.phone1 || ''}
                onChange={handleInputChange}
                name="phone1"
                placeholder="(11) 99999-9999"
                className="border-primary/30 focus:border-primary"
              />
            </div>
            
            <div>
              <Label htmlFor="phone2">Telefone Secundário</Label>
              <Input
                id="phone2"
                value={formData.phone2 || ''}
                onChange={handleInputChange}
                name="phone2"
                placeholder="(11) 88888-8888"
                className="border-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Emails */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Emails</h3>
            </div>
            
            <div>
              <Label htmlFor="email1">Email Principal *</Label>
              <Input
                id="email1"
                type="email"
                value={formData.email1 || ''}
                onChange={handleInputChange}
                name="email1"
                placeholder="contato@empresa.com"
                className="border-primary/30 focus:border-primary"
              />
            </div>
            
            <div>
              <Label htmlFor="email2">Email Secundário</Label>
              <Input
                id="email2"
                type="email"
                value={formData.email2 || ''}
                onChange={handleInputChange}
                name="email2"
                placeholder="comercial@empresa.com"
                className="border-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Endereço</h3>
            </div>
            
            <div>
              <Label htmlFor="address">Endereço Completo *</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                name="address"
                placeholder="Rua, número, bairro"
                className="border-primary/30 focus:border-primary"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  name="city"
                  placeholder="São Paulo"
                  className="border-primary/30 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={formData.state || ''}
                  onChange={handleInputChange}
                  name="state"
                  placeholder="SP"
                  className="border-primary/30 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="zip_code">CEP *</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code || ''}
                  onChange={handleInputChange}
                  name="zip_code"
                  placeholder="00000-000"
                  className="border-primary/30 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Horários */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Horários de Funcionamento</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="weekdays_hours">Segunda a Sexta</Label>
                <Input
                  id="weekdays_hours"
                  value={formData.weekdays_hours || ''}
                  onChange={handleInputChange}
                  name="weekdays_hours"
                  placeholder="08:00 - 18:00"
                  className="border-primary/30 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="saturday_hours">Sábado</Label>
                <Input
                  id="saturday_hours"
                  value={formData.saturday_hours || ''}
                  onChange={handleInputChange}
                  name="saturday_hours"
                  placeholder="08:00 - 12:00"
                  className="border-primary/30 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="sunday_hours">Domingo</Label>
                <Input
                  id="sunday_hours"
                  value={formData.sunday_hours || ''}
                  onChange={handleInputChange}
                  name="sunday_hours"
                  placeholder="Fechado"
                  className="border-primary/30 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Redes Sociais</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="facebook_url">Facebook</Label>
                <Input
                  id="facebook_url"
                  value={formData.facebook_url || ''}
                  onChange={handleInputChange}
                  name="facebook_url"
                  placeholder="https://facebook.com/empresa"
                  className="border-primary/30 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="instagram_url">Instagram</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url || ''}
                  onChange={handleInputChange}
                  name="instagram_url"
                  placeholder="https://instagram.com/empresa"
                  className="border-primary/30 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="twitter_url">Twitter/X</Label>
                <Input
                  id="twitter_url"
                  value={formData.twitter_url || ''}
                  onChange={handleInputChange}
                  name="twitter_url"
                  placeholder="https://twitter.com/empresa"
                  className="border-primary/30 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="youtube_url">YouTube</Label>
                <Input
                  id="youtube_url"
                  value={formData.youtube_url || ''}
                  onChange={handleInputChange}
                  name="youtube_url"
                  placeholder="https://youtube.com/empresa"
                  className="border-primary/30 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-primary/20">
          <p className="text-xs text-muted-foreground">
            Última atualização: {(formData as any).updated_at ? new Date((formData as any).updated_at).toLocaleString('pt-BR') : 'Nunca'}
          </p>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-gradient-hero hover:shadow-glow-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ContactInfoManager;