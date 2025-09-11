import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Termos de Uso - Portal News</title>
        <meta name="description" content="Termos de Uso do Portal News. Conheça as regras e condições para utilização de nossa plataforma de notícias." />
        <link rel="canonical" href={`${window.location.origin}/termos-uso`} />
      </Helmet>
      
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-8">
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
                Termos de Uso
              </h1>
              <p className="text-muted-foreground">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </header>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
                <p>
                  Ao acessar e usar o Portal News, você concorda em cumprir e ficar vinculado 
                  a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, 
                  não deve usar nossos serviços.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
                <p>
                  O Portal News é uma plataforma digital de jornalismo que oferece:
                </p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Notícias atualizadas em tempo real</li>
                  <li>Artigos de colunistas especializados</li>
                  <li>Transmissão de rádio online</li>
                  <li>Conteúdo multimídia</li>
                  <li>Interação através de formulários de contato</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Uso Aceitável</h2>
                <p>Você concorda em usar nossos serviços apenas para fins legais e de acordo com estes termos. É proibido:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Violar qualquer lei ou regulamento aplicável</li>
                  <li>Transmitir conteúdo ofensivo, difamatório ou que viole direitos de terceiros</li>
                  <li>Interferir no funcionamento do site ou servidores</li>
                  <li>Tentar acessar áreas restritas sem autorização</li>
                  <li>Usar o serviço para spam ou atividades comerciais não autorizadas</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Propriedade Intelectual</h2>
                <p>
                  Todo o conteúdo do Portal News, incluindo textos, imagens, logotipos, 
                  design e código, é protegido por direitos autorais e outras leis de 
                  propriedade intelectual. É proibida a reprodução não autorizada.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Conteúdo do Usuário</h2>
                <p>
                  Ao enviar conteúdo através de formulários de contato ou outros meios, 
                  você garante que possui os direitos necessários e concede ao Portal News 
                  licença para usar esse conteúdo conforme necessário.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Disclaimer de Responsabilidade</h2>
                <p>
                  O Portal News se esforça para fornecer informações precisas e atualizadas, 
                  mas não garante a completude ou precisão de todo o conteúdo. O uso das 
                  informações é por sua conta e risco.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
                <p>
                  Em nenhuma circunstância o Portal News será responsável por danos diretos, 
                  indiretos, incidentais ou consequenciais decorrentes do uso ou incapacidade 
                  de usar nossos serviços.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Modificações do Serviço</h2>
                <p>
                  Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer 
                  parte de nossos serviços a qualquer momento, com ou sem aviso prévio.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Privacidade</h2>
                <p>
                  Sua privacidade é importante para nós. Consulte nossa 
                  <a href="/politica-privacidade" className="text-primary hover:underline ml-1">
                    Política de Privacidade
                  </a> para entender como coletamos, usamos e protegemos suas informações.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Lei Aplicável</h2>
                <p>
                  Estes termos são regidos pelas leis brasileiras. Qualquer disputa será 
                  resolvida nos tribunais competentes do Brasil.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
                <p>
                  Para questões sobre estes Termos de Uso, entre em contato:
                </p>
                <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                  <p><strong>E-mail:</strong> contato@portalnews.com</p>
                  <p><strong>Telefone:</strong> (11) 9999-9999</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Alterações dos Termos</h2>
                <p>
                  Podemos atualizar estes termos periodicamente. Alterações significativas 
                  serão comunicadas através do site. O uso continuado após as alterações 
                  constitui aceitação dos novos termos.
                </p>
              </section>
            </div>
          </Card>
        </div>
      </div>
      
      <Footer />
      <RadioPlayer />
    </div>
  );
};

export default TermsOfService;