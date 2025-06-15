'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MessageSquare } from 'lucide-react';
import Image from 'next/image';

export function WhatsAppStatus() {
  const [isReady, setIsReady] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWhatsAppStatus();
    // Check status every 5 seconds
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsReady(data.isReady);
        setQrCode(data.qrCode);
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-blue-900/50 border-blue-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-blue-200">WhatsApp</CardTitle>
        <MessageSquare className="h-4 w-4 text-blue-300" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-blue-200">Carregando...</div>
        ) : isReady ? (
          <div className="text-green-400">Conectado</div>
        ) : qrCode ? (
          <div className="space-y-4">
            <div className="text-blue-200">Escaneie o QR Code para conectar:</div>
            <div className="relative w-48 h-48 mx-auto">
              <Image
                src={`data:image/png;base64,${qrCode}`}
                alt="WhatsApp QR Code"
                fill
                className="object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="text-yellow-400">Aguardando QR Code...</div>
        )}
      </CardContent>
    </Card>
  );
} 