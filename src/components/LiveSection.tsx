import React, { useState } from 'react';
import { useProgramming } from '@/contexts/ProgrammingContext';
import { Radio, Calendar, Clock, Mic, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const LiveSection = () => {
  const { programs } = useProgramming();
  const navigate = useNavigate();

  // Filter active programs and get live programs first
  const activePrograms = programs.filter(program => program.isActive);
  const livePrograms = activePrograms.filter(program => program.status === 'live');
  const upcomingPrograms = activePrograms.filter(program => program.status === 'upcoming');
  const sortedPrograms = [...livePrograms, ...upcomingPrograms];

  const [selectedProgram, setSelectedProgram] = useState(
    sortedPrograms.length > 0 ? sortedPrograms[0] : null
  );

  return (
    <div className="py-20 px-6 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center space-x-2 bg-gradient-card backdrop-blur-sm border border-accent/30 rounded-full px-4 py-2 mb-6 animate-neon-pulse">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-accent">TRANSMISSÃO AO VIVO</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Programação Ao Vivo
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acompanhe nossa programação especial com entrevistas, debates e a melhor música
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player Principal */}
          <div className="lg:col-span-2">
            {selectedProgram ? (
            <Card className="bg-gradient-card backdrop-blur-md border-primary/30 p-8 animate-bounce-in hover:shadow-glow-primary transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center animate-neon-pulse">
                    <Radio className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{selectedProgram.title}</h3>
                    <p className="text-muted-foreground">com {selectedProgram.host}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedProgram.status === 'live' && (
                    <div className="flex items-center space-x-2 bg-accent/20 border border-accent/30 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-accent">AO VIVO</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-lg text-muted-foreground mb-6">
                {selectedProgram.description}
              </p>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-medium">{selectedProgram.startTime} - {selectedProgram.endTime}</span>
                  </div>
                </div>
              </div>

              {/* Player Controls */}
              <div className="bg-muted/20 rounded-2xl p-6">
                <div className="flex items-center justify-center space-x-4">
                  <Button className="bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 w-16 h-16 rounded-2xl hover:scale-105">
                    <Radio className="w-6 h-6" />
                  </Button>
                  
                  <div className="flex-1 max-w-md">
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div className="w-1/3 h-full bg-gradient-hero rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>00:45</span>
                      <span>Live</span>
                    </div>
                  </div>

                  <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
                    <Video className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
            ) : (
              <Card className="bg-gradient-card backdrop-blur-md border-primary/30 p-8 text-center">
                <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum programa ativo</h3>
                <p className="text-muted-foreground">
                  Não há programas ativos no momento. Entre em contato com o administrador.
                </p>
              </Card>
            )}
          </div>

          {/* Programação */}
          <div className="space-y-4 animate-slide-right">
            <h3 className="text-xl font-bold text-foreground mb-4">Programação de Hoje</h3>
            
            {sortedPrograms.length > 0 ? (
              sortedPrograms.map((program) => (
                <Card
                  key={program.id}
                  className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedProgram?.id === program.id
                      ? 'bg-gradient-card border-primary/40 shadow-glow-primary'
                      : 'bg-card/50 border-border hover:border-primary/20'
                  }`}
                  onClick={() => setSelectedProgram(program)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{program.title}</h4>
                    {program.status === 'live' && (
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">com {program.host}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{program.startTime} - {program.endTime}</span>
                    {program.status === 'live' && (
                      <span className="text-accent font-medium">AO VIVO</span>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-4 bg-muted/20 text-center">
                <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum programa ativo hoje
                </p>
              </Card>
            )}

            <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <div className="flex items-center space-x-2 mb-2">
                <Mic className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-foreground">Participe do Programa</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Envie sua mensagem ou sugestão para o programa ao vivo
              </p>
              <Button 
                size="sm" 
                onClick={() => navigate('/contato')}
                className="w-full bg-primary hover:bg-primary-glow"
              >
                Enviar Mensagem
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSection;