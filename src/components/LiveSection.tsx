import React, { useState } from 'react';
import { useSupabaseProgramming } from '@/contexts/SupabaseProgrammingContext';
import { Radio, Calendar, Clock, Mic, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const LiveSection = () => {
  const { programs } = useSupabaseProgramming();
  const navigate = useNavigate();

  // Filter active programs and get live programs first
  const activePrograms = programs.filter(program => program.is_active);
  const livePrograms = activePrograms.filter(program => program.status === 'live');
  const upcomingPrograms = activePrograms.filter(program => program.status === 'upcoming');
  const sortedPrograms = [...livePrograms, ...upcomingPrograms];

  const [selectedProgram, setSelectedProgram] = useState(
    sortedPrograms.length > 0 ? sortedPrograms[0] : null
  );

  return (
    <section id="ao-vivo" className="py-20 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
            📡 Transmissão ao Vivo
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acompanhe nossa programação especial com análises exclusivas, 
            entrevistas e cobertura em tempo real dos principais acontecimentos
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Player Principal */}
          <div className="order-2 lg:order-1">
            <Card className="bg-gradient-card border-primary/30 overflow-hidden">
              {selectedProgram ? (
                <>
                  {/* Header do Programa */}
                  <div className="p-6 bg-gradient-hero">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <Radio className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{selectedProgram.title}</h3>
                          <p className="text-white/80">com {selectedProgram.host}</p>
                        </div>
                      </div>
                      {selectedProgram.status === 'live' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-accent">AO VIVO</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo do Player */}
                  <div className="p-6">
                    {/* Informações do Programa */}
                    <div className="mb-6">
                      <p className="text-muted-foreground mb-4">
                        {selectedProgram.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="font-medium">{selectedProgram.start_time} - {selectedProgram.end_time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Player Controls */}
                      <div className="bg-muted/20 rounded-2xl p-6">
                        <div className="text-center">
                          <h4 className="text-lg font-semibold mb-4">🎧 Ouça ao Vivo</h4>
                          <p className="text-sm text-muted-foreground mb-6">
                            Use o player de rádio no canto inferior da tela para escutar nossa transmissão
                          </p>
                          
                          <Button 
                            onClick={() => navigate('/radio')}
                            className="bg-gradient-hero hover:shadow-glow-primary"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Ver Programação Completa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma programação ativa</h3>
                  <p className="text-muted-foreground mb-6">
                    No momento não há programas ao vivo ou programados
                  </p>
                  <Button 
                    onClick={() => navigate('/radio')}
                    variant="outline"
                  >
                    Ver Programação
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Lista de Programas */}
          <div className="order-1 lg:order-2 space-y-4">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              Programação de Hoje
            </h3>

            {sortedPrograms.length > 0 ? (
              sortedPrograms.slice(0, 5).map((program) => (
                <Card 
                  key={program.id}
                  className={`p-4 cursor-pointer transition-all duration-300 hover:border-primary/50 ${
                    selectedProgram?.id === program.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:bg-muted/10'
                  }`}
                  onClick={() => setSelectedProgram(program)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{program.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">com {program.host}</p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{program.start_time} - {program.end_time}</span>
                        {program.status === 'live' && (
                          <span className="text-accent font-medium">AO VIVO</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma programação cadastrada</p>
              </Card>
            )}

            <Button 
              onClick={() => navigate('/radio')} 
              variant="outline" 
              className="w-full mt-4"
            >
              <Radio className="w-4 h-4 mr-2" />
              Ver Programação Completa
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveSection;