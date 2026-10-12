import { Link } from 'react-router-dom';
import { MapPin, UserPlus, MessageCircle, ListChecks } from 'lucide-react';
import InternalLayout from '@/components/layout/InternalLayout';
import PageHeader from '@/components/layout/PageHeader';
import HomeUtilitySection from '@/components/utility/HomeUtilitySection';
import PublicUserBar from '@/components/utility/PublicUserBar';
import { Button } from '@/components/ui/button';

export default function UtilityLanding() {
  return <InternalLayout>
    <PageHeader icon={MapPin} eyebrow="A região se conecta aqui" title="Utilidade pública"
      description="Serviços e oportunidades para quem vive na nossa região. Encontre, converse e divulgue em um só lugar."
      actions={<Button asChild><Link to="/utilidade-publica/auth"><UserPlus size={16} />Divulgar gratuitamente</Link></Button>} />
    <div className="utility-directory"><HomeUtilitySection showHeader={false} /></div>
    <section className="page-surface community-steps" aria-label="Como funciona">
      {[{ icon: MapPin, title: 'Encontre na região', text: 'Explore profissionais e oportunidades perto de você.' }, { icon: MessageCircle, title: 'Converse diretamente', text: 'Entre em contato pelo WhatsApp do anunciante.' }, { icon: ListChecks, title: 'Divulgue e gerencie', text: 'Crie sua conta para publicar serviços ou vagas no seu painel.' }].map(({icon: Icon, title, text}) => <div key={title}><Icon size={22} className="text-primary" /><h2>{title}</h2><p>{text}</p></div>)}
    </section>
    <PublicUserBar />
  </InternalLayout>;
}
