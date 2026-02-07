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

  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

  const handleClick = async () => {
    await trackClick(entityType, entityId, 'whatsapp_click');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button onClick={handleClick} className={`bg-green-600 hover:bg-green-700 text-white ${className || ''}`}>
      <MessageCircle className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};

export default WhatsAppButton;
