import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';

interface TokenExpirationAlertProps {
  onNavigateToConfig: () => void;
}

const TokenExpirationAlert: React.FC<TokenExpirationAlertProps> = ({ onNavigateToConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTokenExpiration();
  }, []);

  const checkTokenExpiration = async () => {
    try {
      // Verificar se já foi dispensado nesta sessão
      const dismissed = sessionStorage.getItem('token_expiration_dismissed');
      if (dismissed === 'true') {
        setLoading(false);
        return;
      }

      // Buscar configuração de token
      const { data, error } = await supabase
        .from('social_media_config')
        .select('token_expires_at')
        .not('token_expires_at', 'is', null)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching token expiration:', error);
        setLoading(false);
        return;
      }

      if (data?.token_expires_at) {
        const expirationDate = parseISO(data.token_expires_at);
        const today = new Date();
        const days = differenceInDays(expirationDate, today);
        
        setDaysRemaining(days);
        
        // Mostrar alerta se faltam 10 dias ou menos (passou 50 dias)
        if (days <= 10) {
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewNow = () => {
    setIsOpen(false);
    sessionStorage.removeItem('token_expiration_dismissed');
    onNavigateToConfig();
  };

  const handleRemindLater = () => {
    setIsOpen(false);
    sessionStorage.setItem('token_expiration_dismissed', 'true');
  };

  if (loading || !isOpen) {
    return null;
  }

  const isExpired = daysRemaining !== null && daysRemaining <= 0;
  const isCritical = daysRemaining !== null && daysRemaining <= 3;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${isExpired ? 'text-destructive' : isCritical ? 'text-orange-500' : 'text-yellow-500'}`} />
            {isExpired 
              ? '⚠️ Token do Meta expirado!' 
              : '⚠️ Token do Meta próximo de expirar!'
            }
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {isExpired ? (
              <p className="text-destructive font-medium">
                Seu token de acesso do Facebook/Instagram <strong>expirou</strong>. 
                As postagens automáticas estão <strong>desativadas</strong>.
              </p>
            ) : (
              <p>
                Seu token de acesso do Facebook/Instagram expira em{' '}
                <strong className={isCritical ? 'text-orange-500' : 'text-yellow-600'}>
                  {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                </strong>.
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              Renove agora para evitar interrupções nas postagens automáticas de matérias e artigos de colunistas.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleRemindLater}>
            Lembrar Depois
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleRenewNow}
            className="bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Renovar Agora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TokenExpirationAlert;
