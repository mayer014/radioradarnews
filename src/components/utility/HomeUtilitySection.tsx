import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Briefcase, ArrowRight } from 'lucide-react';

const HomeUtilitySection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Utilidade Pública
          </h2>
          <p className="text-muted-foreground">Encontre prestadores de serviço e vagas de emprego na sua região</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prestadores */}
          <Card className="bg-gradient-card border-primary/20 hover:border-primary/40 hover:shadow-glow-primary transition-all group cursor-pointer" onClick={() => navigate('/prestadores')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">🧰 Prestadores de Serviço</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Eletricistas, encanadores, pintores, mecânicos e muito mais. Encontre profissionais de confiança.
              </p>
              <Button variant="outline" className="border-primary/50 hover:bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                Ver Prestadores <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Vagas */}
          <Card className="bg-gradient-card border-secondary/20 hover:border-secondary/40 hover:shadow-glow-secondary transition-all group cursor-pointer" onClick={() => navigate('/vagas')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">💼 Vagas de Emprego</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Vagas CLT, PJ, freelancer e temporárias. Envie seu currículo diretamente pelo WhatsApp.
              </p>
              <Button variant="outline" className="border-secondary/50 hover:bg-secondary/10 group-hover:bg-secondary group-hover:text-secondary-foreground transition-all">
                Ver Vagas <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HomeUtilitySection;
