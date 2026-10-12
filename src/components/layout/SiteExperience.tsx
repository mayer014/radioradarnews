import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import BackgroundLayer from '@/components/BackgroundLayer';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';

/** One background instance follows navigation, including loading and error pages. */
export default function SiteExperience({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isAdministration = pathname.startsWith('/admin');
  return (
    <div className="site-experience relative isolate min-h-screen">
      <BackgroundLayer />
      <div className={pathname === '/' ? 'site-route' : 'site-route internal-page'}>
        {!isAdministration && <Navigation />}
        {children}
        {!isAdministration && <Footer />}
        {!isAdministration && <RadioPlayer />}
      </div>
    </div>
  );
}
