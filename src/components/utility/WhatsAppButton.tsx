import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useClickTracking } from '@/hooks/useClickTracking';

interface WhatsAppButtonProps {
  phone: string;
  message: string;
  entityType: 'service_provider' | 'job_listing';
  entityId: string;
  label?: string;
  className?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phone, message, entityType, entityId, label = 'Falar no WhatsApp', className,
}) => {
  const { trackClick } = useClickTracking();

  // Strip all non-digits
  const cleanPhone = phone.replace(/\D/g, '');

  // Validate: must have at least 10 digits (DDD + number)
  const isValid = cleanPhone.length >= 10 && cleanPhone.length <= 13;

  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isValid) {
      alert('Número de WhatsApp inválido. Entre em contato com o anunciante por outro meio.');
      return;
    }

    await trackClick(entityType, entityId, 'whatsapp_click');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button type="button" onClick={handleClick} className="block w-full">
      <Button
        type="button"
        className={`bg-green-600 hover:bg-green-700 text-white w-full ${className || ''}`}
        disabled={!isValid}
        title={!isValid ? 'Número de WhatsApp inválido' : undefined}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {isValid ? label : '⚠️ WhatsApp indisponível'}
      </Button>
    </button>
  );
};

export default WhatsAppButton;
