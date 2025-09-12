import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
import { useSupabaseProgramming } from '@/contexts/SupabaseProgrammingContext';
import { Radio, Users, Calendar, Clock, Headphones, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';

const RadioPage = () => {
  const { programs } = useSupabaseProgramming();
  
  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Filter active programs
  const activePrograms = programs.filter(program => program.is_active);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Rádio Portal News - Programação Completa</title>
        <meta name="description" content="Ouça a Rádio Portal News 24 horas por dia. Confira nossa programação completa com notícias, música e entretenimento." />
        <link rel="canonical" href={`${window.location.origin}/radio`} />
      </Helmet>
      
      <Navigation />
      
      <div className="pt-20">
        {/* Hero Section */}
        <div className="relative py-20 px-6 bg-gradient-to-b from-primary/10 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-card backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 mb-6 animate-neon-pulse">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-accent">NO AR 24H</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Rádio Portal News
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sua rádio de notícias e entretenimento. Transmissão ao vivo 24 horas por dia com a melhor programação da região.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 text-lg px-8 py-6 rounded-2xl font-semibold hover:scale-105">
                <Headphones className="w-5 h-5 mr-2" />
                Ouvir Ao Vivo
              </Button>
              
              <Button variant="outline" className="border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300 text-lg px-8 py-6 rounded-2xl hover:scale-105">
                <Music className="w-5 h-5 mr-2" />
                Ver Programação
              </Button>
            </div>
          </div>
        </div>

        {/* Programação */}
        <div className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
                Programação Diária
              </h2>
              <p className="text-lg text-muted-foreground">
                Confira nossa grade de programação completa
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePrograms.length > 0 ? (
                activePrograms.map((program) => (
                  <Card key={program.id} className="bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 p-6 hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Radio className="w-5 h-5 text-primary" />
                        <span className="font-medium text-sm">{program.start_time} - {program.end_time}</span>
                      </div>
                      {program.status === 'live' && (
                        <div className="flex items-center space-x-1 bg-accent/20 border border-accent/30 rounded-full px-2 py-1">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-accent">AO VIVO</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-foreground">
                      {program.title}
                    </h3>
                    
                    <p className="text-primary font-medium mb-3">
                      com {program.host}
                    </p>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {program.description}
                    </p>

                    <Button variant="outline" size="sm" className="w-full">
                      {program.status === 'live' ? 'Ouvir Agora' : 'Mais Info'}
                    </Button>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum programa ativo</h3>
                  <p className="text-muted-foreground">
                    Não há programas cadastrados no momento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      
      <Footer />
      <RadioPlayer />
    </div>
  );
};

export default RadioPage;