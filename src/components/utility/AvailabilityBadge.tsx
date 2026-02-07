import React from 'react';
import { Badge } from '@/components/ui/badge';

interface AvailabilityBadgeProps {
  availableDays: string[];
  startTime: string | null;
  endTime: string | null;
}

const DAY_MAP: Record<string, number> = {
  dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6,
};

const DAY_LABELS: Record<string, string> = {
  dom: 'Dom', seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb',
};

export function isAvailableNow(availableDays: string[], startTime: string | null, endTime: string | null): boolean {
  if (!availableDays.length || !startTime || !endTime) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isDayMatch = availableDays.some(d => DAY_MAP[d] === currentDay);
  if (!isDayMatch) return false;

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  return currentMinutes >= startMin && currentMinutes <= endMin;
}

const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({ availableDays, startTime, endTime }) => {
  const available = isAvailableNow(availableDays, startTime, endTime);

  if (!availableDays.length || !startTime || !endTime) {
    return <Badge variant="outline" className="text-muted-foreground border-muted">Horário não informado</Badge>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={`shrink-0 ${available 
        ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
        : 'bg-red-500/20 text-red-400 border border-red-500/40'
      }`}>
        {available ? '🟢 DISPONÍVEL' : '🔴 INDISPONÍVEL'}
      </Badge>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {availableDays.map(d => DAY_LABELS[d] || d).join(', ')} • {startTime?.slice(0, 5)} - {endTime?.slice(0, 5)}
      </span>
    </div>
  );
};

export default AvailabilityBadge;
export { DAY_MAP, DAY_LABELS };
