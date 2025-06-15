'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:3001';

export default function WhatsAppPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const initializeConnection = async () => {
      try {
        await checkConnection();
        setIsInitialized(true);
      } catch (error) {
        console.error('Initial connection check failed:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
          setTimeout(initializeConnection, 2000);
        } else {
          toast({
            title: 'Erro de conexão',
            description: 'Não foi possível conectar ao servidor após várias tentativas.',
            variant: 'destructive',
          });
        }
      }
    };

    // Initial connection check with retry
    initializeConnection();

    // Only start polling after initial check
    const interval = setInterval(() => {
      if (isInitialized) {
        checkConnection();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isInitialized]);

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/whatsapp/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao verificar status do WhatsApp');
      }

      const data = await response.json();
      console.log('WhatsApp status response:', data);
      
      // Always update connection status first
      const wasConnected = isConnected;
      setIsConnected(data.connected);

      // Handle connection status changes
      if (data.connected) {
        // Clear QR code when connected
        setQrCode(null);
        
        // Show success message only when connection is newly established
        if (!wasConnected) {
          console.log('New connection detected');
          toast({
            title: 'WhatsApp conectado',
            description: 'A conexão foi estabelecida com sucesso.',
          });
        }
      } else {
        // Only update QR code if we have one and we're not connected
        if (data.qrCode && !data.connected) {
          console.log('Updating QR code');
          setQrCode(data.qrCode);
        }
        
        // Show disconnect message only when connection is newly lost
        if (wasConnected) {
          console.log('Connection lost');
          toast({
            title: 'WhatsApp desconectado',
            description: 'A conexão foi perdida.',
            variant: 'destructive',
          });
        }
      }
      
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Tempo limite excedido ao verificar status do WhatsApp');
        }
        throw error;
      }
      throw new Error('Erro desconhecido ao verificar status do WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      
      if (response.ok) {
        setIsConnected(false);
        setQrCode(null);
        toast({
          title: 'WhatsApp desconectado',
          description: 'A conexão foi encerrada com sucesso.',
        });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Não foi possível desconectar o WhatsApp.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">WhatsApp</h1>
        
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-200">
              Status da Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
            ) : isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>WhatsApp conectado</span>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  className="w-full"
                >
                  Desconectar
                </Button>
              </div>
            ) : qrCode ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Aguardando conexão...</span>
                </div>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Escaneie o QR Code com seu WhatsApp para conectar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Aguardando QR Code...</span>
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Aguardando o WhatsApp gerar o QR Code
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 