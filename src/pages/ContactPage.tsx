import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
import { useContact } from '@/contexts/ContactContext';
import { useContactInfo } from '@/contexts/ContactInfoContext';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import useAccessibility from '@/hooks/useAccessibility';

const ContactPage = () => {
  const { addMessage } = useContact();
  const { contactInfo } = useContactInfo();
  const { toast } = useToast();
  const { announcePageChange } = useAccessibility();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    addMessage(formData);
    
    toast({
      title: "Mensagem enviada!",
      description: "Sua mensagem foi enviada com sucesso. Entraremos em contato em breve.",
    });

    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0);
    announcePageChange('Página de contato carregada');
  }, [announcePageChange]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Contato - Fale Conosco | Portal News"
        description="Entre em contato com o Portal News. Envie sugestões, denúncias, participe da nossa programação ou tire suas dúvidas conosco."
        keywords={['contato portal news', 'fale conosco', 'denúncias', 'sugestões', 'contato redação', 'telefone portal news']}
        url={window.location.href}
        canonical={`${window.location.origin}/contato`}
      />
      
      <BreadcrumbStructuredData items={[
        { name: 'Início', url: window.location.origin },
        { name: 'Contato', url: `${window.location.origin}/contato` }
      ]} />
      
      <Navigation />
      
      <main className="pt-20" id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <div className="py-20 px-6 bg-gradient-to-b from-primary/10 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Entre em Contato
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Estamos sempre prontos para ouvir você. Envie sugestões, denúncias ou participe da nossa programação.
            </p>
          </div>
        </div>

        {/* Contact Form & Info */}
        <div className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Contact Form */}
              <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-8">
                <h2 className="text-2xl font-bold mb-6 text-foreground">
                  Envie sua Mensagem
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Nome Completo *
                      </label>
                      <Input 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Seu nome" 
                        className="bg-background/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Email *
                      </label>
                      <Input 
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seu@email.com" 
                        className="bg-background/50"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Telefone
                    </label>
                    <Input 
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999" 
                      className="bg-background/50"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Assunto *
                    </label>
                    <Input 
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Qual o assunto da sua mensagem?" 
                      className="bg-background/50"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Mensagem *
                    </label>
                    <Textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Digite sua mensagem aqui..."
                      className="bg-background/50 min-h-[120px]"
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Mensagem
                  </Button>
                </form>
              </Card>

              {/* Contact Info */}
              <div className="space-y-6">
                <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Telefone</h3>
                      <p className="text-muted-foreground">{contactInfo.phone1}</p>
                      {contactInfo.phone2 && (
                        <p className="text-muted-foreground">{contactInfo.phone2}</p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <p className="text-muted-foreground">{contactInfo.email1}</p>
                      {contactInfo.email2 && (
                        <p className="text-muted-foreground">{contactInfo.email2}</p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Endereço</h3>
                      <p className="text-muted-foreground">
                        {contactInfo.address}<br />
                        {contactInfo.city} - {contactInfo.state}<br />
                        {contactInfo.zipCode && `CEP: ${contactInfo.zipCode}`}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Horário</h3>
                      <p className="text-muted-foreground">
                        {contactInfo.hours.weekdays}<br />
                        {contactInfo.hours.saturday}<br />
                        {contactInfo.hours.sunday}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="py-16 px-6 bg-muted/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              Outras Formas de Participar
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-6 hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Participe do Programa</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ligue durante os programas ao vivo e participe das discussões
                </p>
                <Button variant="outline" size="sm">
                  Ver Horários
                </Button>
              </Card>

              <Card className="bg-gradient-card backdrop-blur-sm border-secondary/20 p-6 hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Denúncias</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Envie denúncias e sugestões de pautas para nossa redação
                </p>
                <Button variant="outline" size="sm">
                  Enviar Denúncia
                </Button>
              </Card>

              <Card className="bg-gradient-card backdrop-blur-sm border-accent/20 p-6 hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Sugestões Musicais</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sugira músicas para tocar em nossos programas
                </p>
                <Button variant="outline" size="sm">
                  Enviar Sugestão
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <RadioPlayer />
    </div>
  );
};

export default ContactPage;