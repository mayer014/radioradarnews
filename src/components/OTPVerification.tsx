import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  loading: boolean;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  onVerify,
  onResend,
  loading
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus próximo campo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit quando completar
    if (newCode.every(digit => digit) && newCode.join('').length === 6) {
      onVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('');
    setCode([...newCode, ...Array(6 - newCode.length).fill('')]);
    
    if (newCode.length === 6) {
      onVerify(newCode.join(''));
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    await onResend();
    setCountdown(60);
    setCanResend(false);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Verificação em Duas Etapas</h2>
        <p className="text-muted-foreground">
          Enviamos um código de 6 dígitos para
        </p>
        <p className="font-medium text-foreground">{email}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-center block mb-3">Código de Verificação</Label>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold"
                disabled={loading}
              />
            ))}
          </div>
        </div>

        <div className="text-center space-y-2">
          {!canResend ? (
            <p className="text-sm text-muted-foreground">
              Reenviar código em {countdown}s
            </p>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={handleResend}
              disabled={loading}
              className="text-primary hover:text-primary"
            >
              <Mail className="h-4 w-4 mr-2" />
              Reenviar Código
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          O código expira em 5 minutos
        </p>
      </div>
    </div>
  );
};

export default OTPVerification;
