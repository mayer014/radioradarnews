import React, { useState } from 'react';
import { useContactInfo } from '@/contexts/ContactInfoContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Phone, Mail, MapPin, Clock, Globe, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContactInfoManager = () => {
  const { contactInfo, updateContactInfo } = useContactInfo();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(contactInfo);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('hours.')) {
      const hoursField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        hours: {
          ...prev.hours,
          [hoursField]: value
        }
      }));
    } else if (name.startsWith('socialMedia.')) {
      const socialField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validações básicas
      if (!formData.phone1 || !formData.email1 || !formData.address) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha pelo menos: Telefone 1, Email 1 e Endereço.",
          variant: "destructive"
        });
        return;
      }

      // Validação de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email1)) {
        toast({
          title: "Email inválido",
          description: "Por favor, insira um email válido para o Email Principal.",
          variant: "destructive"
        });
        return;
      }

      if (formData.email2 && !emailRegex.test(formData.email2)) {
        toast({
          title: "Email inválido",
          description: "Por favor, insira um email válido para o Email da Redação ou deixe em branco.",
          variant: "destructive"
        });
        return;
      }

      updateContactInfo(formData);
      
      toast({
        title: "Informações atualizadas!",
        description: "As informações de contato foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as informações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(contactInfo);
    toast({
      title: "Alterações descartadas",
      description: "Os campos foram restaurados para os valores salvos.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Gerenciar Informações de Contato
          </h2>
          <p className="text-muted-foreground">
            Configure as informações exibidas na página de contato
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/contato')}
            className="border-primary/50 hover:bg-primary/10"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Página
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-hero hover:shadow-glow-primary"
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Telefones */}
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="flex items-center mb-4">
          <Phone className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold">Telefones</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone1">Telefone Principal *</Label>
            <Input
              id="phone1"
              name="phone1"
              value={formData.phone1}
              onChange={handleInputChange}
              placeholder="(11) 3456-7890"
              className="bg-background/50"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone2">Telefone Secundário</Label>
            <Input
              id="phone2"
              name="phone2"
              value={formData.phone2}
              onChange={handleInputChange}
              placeholder="(11) 99999-8888"
              className="bg-background/50"
            />
          </div>
        </div>
      </Card>

      {/* Emails */}
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="flex items-center mb-4">
          <Mail className="h-5 w-5 text-secondary mr-2" />
          <h3 className="text-lg font-semibold">Emails</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email1">Email Principal *</Label>
            <Input
              id="email1"
              name="email1"
              type="email"
              value={formData.email1}
              onChange={handleInputChange}
              placeholder="contato@portalnews.com"
              className="bg-background/50"
              required
            />
          </div>
          <div>
            <Label htmlFor="email2">Email da Redação</Label>
            <Input
              id="email2"
              name="email2"
              type="email"
              value={formData.email2}
              onChange={handleInputChange}
              placeholder="redacao@portalnews.com"
              className="bg-background/50"
            />
          </div>
        </div>
      </Card>

      {/* Endereço */}
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="flex items-center mb-4">
          <MapPin className="h-5 w-5 text-accent mr-2" />
          <h3 className="text-lg font-semibold">Endereço</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="address">Endereço *</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Rua das Comunicações, 123"
              className="bg-background/50"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="São Paulo"
                className="bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="SP"
                className="bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="01234-567"
                className="bg-background/50"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Horários */}
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold">Horários de Funcionamento</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="hours.weekdays">Segunda a Sexta</Label>
            <Input
              id="hours.weekdays"
              name="hours.weekdays"
              value={formData.hours.weekdays}
              onChange={handleInputChange}
              placeholder="Segunda a Sexta: 6h às 22h"
              className="bg-background/50"
            />
          </div>
          <div>
            <Label htmlFor="hours.saturday">Sábados</Label>
            <Input
              id="hours.saturday"
              name="hours.saturday"
              value={formData.hours.saturday}
              onChange={handleInputChange}
              placeholder="Sábados: 8h às 18h"
              className="bg-background/50"
            />
          </div>
          <div>
            <Label htmlFor="hours.sunday">Domingos</Label>
            <Input
              id="hours.sunday"
              name="hours.sunday"
              value={formData.hours.sunday}
              onChange={handleInputChange}
              placeholder="Domingos: 10h às 16h"
              className="bg-background/50"
            />
          </div>
        </div>
      </Card>

      {/* Redes Sociais */}
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="flex items-center mb-4">
          <Globe className="h-5 w-5 text-secondary mr-2" />
          <h3 className="text-lg font-semibold">Redes Sociais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="socialMedia.facebook">Facebook</Label>
            <Input
              id="socialMedia.facebook"
              name="socialMedia.facebook"
              value={formData.socialMedia?.facebook || ''}
              onChange={handleInputChange}
              placeholder="https://facebook.com/portalnews"
              className="bg-background/50"
            />
          </div>
          <div>
            <Label htmlFor="socialMedia.instagram">Instagram</Label>
            <Input
              id="socialMedia.instagram"
              name="socialMedia.instagram"
              value={formData.socialMedia?.instagram || ''}
              onChange={handleInputChange}
              placeholder="https://instagram.com/portalnews"
              className="bg-background/50"
            />
          </div>
          <div>
            <Label htmlFor="socialMedia.twitter">Twitter</Label>
            <Input
              id="socialMedia.twitter"
              name="socialMedia.twitter"
              value={formData.socialMedia?.twitter || ''}
              onChange={handleInputChange}
              placeholder="https://twitter.com/portalnews"
              className="bg-background/50"
            />
          </div>
          <div>
            <Label htmlFor="socialMedia.youtube">YouTube</Label>
            <Input
              id="socialMedia.youtube"
              name="socialMedia.youtube"
              value={formData.socialMedia?.youtube || ''}
              onChange={handleInputChange}
              placeholder="https://youtube.com/@portalnews"
              className="bg-background/50"
            />
          </div>
        </div>
      </Card>

      {/* Informações de atualização */}
      <Card className="bg-muted/30 border-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Última atualização:</strong> {' '}
          {new Date(contactInfo.updatedAt).toLocaleString('pt-BR')}
        </p>
      </Card>
    </div>
  );
};

export default ContactInfoManager;