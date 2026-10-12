import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import InternalLayout from '@/components/layout/InternalLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <InternalLayout narrow>
      <PageHeader icon={Compass} eyebrow="Erro 404" title="Página não encontrada" description="O endereço pode ter mudado. Continue explorando a Rádio Radar pelos links abaixo." />
      <div className="page-surface p-8 flex flex-wrap gap-3">
        <Button asChild><Link to="/">Voltar ao início</Link></Button>
        <Button asChild variant="outline"><Link to="/noticias">Explorar notícias</Link></Button>
      </div>
    </InternalLayout>
  );
};

export default NotFound;
