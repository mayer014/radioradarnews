import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Wrench, Briefcase, UserPlus } from 'lucide-react';

const UtilityLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="px-4 sm:px-6 py-16 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
            Utilidade Pública
          </h1>
          <p className="text-lg text-muted-foreground mb-2 max-w-2xl mx-auto">
            Cadastre-se gratuitamente e divulgue seus serviços ou vagas de emprego para toda a região.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Plataforma integrada ao RRN – Rádio Radar News
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-hero hover:shadow-glow-primary text-lg px-8" onClick={() => navigate('/utilidade-publica/auth')}>
              <UserPlus className="h-5 w-5 mr-2" /> Cadastre-se Grátis
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl bg-gradient-card border border-primary/20 hover:border-primary/40 transition-all cursor-pointer" onClick={() => navigate('/prestadores')}>
              <Wrench className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">🧰 Ofertar meus serviços</h2>
              <p className="text-sm text-muted-foreground">
                Eletricista, encanador, pintor, mecânico... Divulgue seus serviços e receba contatos direto no WhatsApp.
              </p>
              <Button variant="outline" className="mt-4 border-primary/50">Ver Prestadores</Button>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-card border border-secondary/20 hover:border-secondary/40 transition-all cursor-pointer" onClick={() => navigate('/vagas')}>
              <Briefcase className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">💼 Publicar uma vaga de emprego</h2>
              <p className="text-sm text-muted-foreground">
                Publique vagas CLT, PJ, freelancer ou temporárias. Receba currículos pelo WhatsApp.
              </p>
              <Button variant="outline" className="mt-4 border-secondary/50">Ver Vagas</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default UtilityLanding;
