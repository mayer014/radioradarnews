import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Hexagon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon: LucideIcon;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, eyebrow = 'Rádio Radar', icon: Icon, backTo = '/', backLabel = 'Início', actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <Link to={backTo} className="page-back"><ArrowLeft size={15} />{backLabel}</Link>
      <div className="page-header-content">
        <div className="page-header-copy">
          <span className="page-eyebrow"><Icon size={14} />{eyebrow}</span>
          <h1>{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
        <Hexagon className="page-header-hexagon" aria-hidden="true" />
      </div>
    </header>
  );
}
