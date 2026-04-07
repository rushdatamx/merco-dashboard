import { Card, CardContent } from '@/components/ui/card';
import { formatChange, changeColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface KPICardProps {
  titulo: string;
  valor: string;
  cambio?: number | null;
  icono?: ReactNode;
  subtexto?: string;
}

export function KPICard({ titulo, valor, cambio, icono, subtexto }: KPICardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{titulo}</p>
            <p className="text-2xl font-bold tracking-tight">{valor}</p>
            {cambio != null && (
              <p className={cn('text-xs font-medium', changeColor(cambio))}>
                {formatChange(cambio)} vs mes anterior
              </p>
            )}
            {subtexto && (
              <p className="text-xs text-muted-foreground">{subtexto}</p>
            )}
          </div>
          {icono && (
            <div className="p-2 bg-brand/10 rounded-lg text-brand">
              {icono}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
