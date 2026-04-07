'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface ChartWrapperProps {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  className?: string;
}

export function ChartWrapper({ titulo, subtitulo, children, className }: ChartWrapperProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{titulo}</CardTitle>
        {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}
