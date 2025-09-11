import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Política de Privacidade - Portal News</title>
        <meta name="description" content="Política de Privacidade do Portal News em conformidade com a LGPD. Saiba como protegemos seus dados pessoais." />
        <link rel="canonical" href={`${window.location.origin}/politica-privacidade`} />
      </Helmet>
      
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-8">
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
                Política de Privacidade
              </h1>
              <p className="text-muted-foreground">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </header>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Informações Gerais</h2>
                <p>
                  Esta Política de Privacidade descreve como o Portal News coleta, usa, armazena e protege 
                  suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Dados Coletados</h2>
                <p>Coletamos as seguintes categorias de dados:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li><strong>Dados de navegação:</strong> Informações sobre sua interação com nosso site</li>
                  <li><strong>Dados de contato:</strong> Quando você nos envia mensagens pelo formulário de contato</li>
                  <li><strong>Cookies técnicos:</strong> Para melhorar sua experiência de navegação</li>
                  <li><strong>Dados de preferência:</strong> Tema do site (claro/escuro) armazenado localmente</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Finalidade do Tratamento</h2>
                <p>Utilizamos seus dados para:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Fornecer e melhorar nossos serviços jornalísticos</li>
                  <li>Responder suas mensagens e solicitações</li>
                  <li>Personalizar sua experiência de navegação</li>
                  <li>Cumprir obrigações legais e regulatórias</li>
                  <li>Análises estatísticas para melhoria do conteúdo</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Base Legal</h2>
                <p>
                  O tratamento de seus dados pessoais é fundamentado no legítimo interesse para 
                  prestação de serviços jornalísticos, consentimento quando aplicável, e cumprimento 
                  de obrigações legais.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Compartilhamento de Dados</h2>
                <p>
                  Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, 
                  exceto quando necessário para prestação dos serviços ou por exigência legal.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Seus Direitos</h2>
                <p>Conforme a LGPD, você tem direito a:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Confirmar a existência de tratamento de dados</li>
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                  <li>Solicitar a eliminação de dados desnecessários</li>
                  <li>Revogar o consentimento</li>
                  <li>Solicitar a portabilidade dos dados</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Segurança</h2>
                <p>
                  Implementamos medidas técnicas e organizacionais adequadas para proteger 
                  seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Retenção de Dados</h2>
                <p>
                  Mantemos seus dados pelo tempo necessário para as finalidades descritas 
                  nesta política ou conforme exigido por lei.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Contato</h2>
                <p>
                  Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
                  entre em contato conosco:
                </p>
                <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                  <p><strong>E-mail:</strong> contato@portalnews.com</p>
                  <p><strong>Telefone:</strong> (11) 9999-9999</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Alterações</h2>
                <p>
                  Esta política pode ser atualizada periodicamente. Recomendamos que 
                  visite esta página regularmente para se manter informado sobre 
                  eventuais mudanças.
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

export default PrivacyPolicy;