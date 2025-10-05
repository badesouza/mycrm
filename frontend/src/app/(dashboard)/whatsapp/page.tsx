'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_BASE_URL = 'http://localhost:3001';

export default function WhatsAppPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastQrUpdate, setLastQrUpdate] = useState<Date | null>(null);
  const [qrCodeKey, setQrCodeKey] = useState<number>(0); // Force re-render of Image component
  const [isQrUpdating, setIsQrUpdating] = useState<boolean>(false); // Show update indicator
  
  // Refs to avoid dependency loops
  const qrCodeRef = useRef<string | null>(null);
  const isConnectedRef = useRef<boolean>(false);


  const checkConnection = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token encontrado:', !!token);
      if (!token) {
        console.log('Token não encontrado, redirecionando para login');
        router.push('/login');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout

      console.log('Fazendo requisição para:', `${API_BASE_URL}/api/whatsapp/status`);
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);
      
      console.log('Status da resposta:', response.status);
      console.log('Cabeçalhos da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 401) {
        console.log('Não autorizado, redirecionando para login');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resposta não OK:', response.status, errorText);
        throw new Error(`Erro ao verificar status do WhatsApp: ${response.status}`);
      }

      const data = await response.json();
      console.log('Resposta do status do WhatsApp:', data);
      
      // Always update connection status first
      const wasConnected = isConnectedRef.current;
      isConnectedRef.current = data.connected;
      setIsConnected(data.connected);

      // Handle connection status changes
      if (data.connected) {
        // Clear QR code when connected
        qrCodeRef.current = null;
        setQrCode(null);
        setLastQrUpdate(null);
        
        // Show success message only when connection is newly established
        if (!wasConnected) {
          console.log('Nova conexão detectada');
          toast({
            title: 'WhatsApp conectado',
            description: 'A conexão foi estabelecida com sucesso.',
            variant: 'default',
          });
        }
      } else {
        // Handle QR code updates
        if (data.qrCode && !data.connected) {
          const currentQrCode = qrCodeRef.current;
          const now = new Date();
          
          // Check if this is a new QR code
          const isNewQrCode = !currentQrCode || currentQrCode !== data.qrCode;
          
          if (isNewQrCode) {
            console.log('Novo QR code gerado - atualizando imediatamente');
            
            // Show update indicator
            setIsQrUpdating(true);
            
            // IMMEDIATE UPDATE - Update QR code immediately
            qrCodeRef.current = data.qrCode;
            setQrCode(data.qrCode);
            setQrCodeKey(prev => prev + 1); // Force Image component re-render
            setLastQrUpdate(now);
            
            // Hide update indicator after a short delay
            setTimeout(() => {
              setIsQrUpdating(false);
            }, 200);
            
            toast({
              title: 'QR Code atualizado',
              description: 'Novo QR code gerado. Escaneie com seu WhatsApp.',
              variant: 'default',
            });
          } else {
            // Same QR code, but ensure display is updated
            qrCodeRef.current = data.qrCode;
            setQrCode(data.qrCode);
            setQrCodeKey(prev => prev + 1); // Force re-render even for same QR
          }
        } else {
          // Clear QR code if we don't have one or if we're connected
          qrCodeRef.current = null;
          setQrCode(null);
          setLastQrUpdate(null);
        }
        
        // Show disconnect message only when connection is newly lost
        if (wasConnected) {
          console.log('Conexão perdida');
          toast({
            title: 'WhatsApp desconectado',
            description: 'A conexão foi perdida.',
            variant: 'destructive',
          });
        }
      }
      
    } catch (error) {
      console.error('Erro ao verificar status do WhatsApp:', error);
      // Clear QR code on error
      qrCodeRef.current = null;
      setQrCode(null);
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
  }, [router]);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const initializeConnection = async () => {
      try {
        // Clear QR code state on initialization
        setQrCode(null);
        await checkConnection();
        setIsInitialized(true);
      } catch (error) {
        console.error('Falha na verificação inicial da conexão:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Tentando reconectar (${retryCount}/${maxRetries})...`);
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

    return () => {
      // Clear QR code state on cleanup
      setQrCode(null);
    };
  }, [isInitialized, isConnected, checkConnection]);

  // Polling effect for connection status
  useEffect(() => {
    if (isInitialized && !isConnected) {
      const interval = setInterval(() => {
        checkConnection();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isInitialized, isConnected, checkConnection]);


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
        throw new Error('Falha ao desconectar');
      }
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Não foi possível desconectar o WhatsApp.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex-1 p-8">
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
                <div className="flex justify-center p-4 bg-white rounded-lg relative">
                  {isQrUpdating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm font-medium">Atualizando QR Code...</span>
                      </div>
                    </div>
                  )}
                  <Image 
                    key={qrCodeKey} // Force re-render when QR code changes
                    src={`data:image/png;base64,${qrCode}`} 
                    alt="QR Code" 
                    width={256} 
                    height={256}
                    className="w-64 h-64"
                    unoptimized
                    priority // Load immediately
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-400">
                    Escaneie o QR Code com seu WhatsApp para conectar
                  </p>
                  {lastQrUpdate && (
                    <p className="text-xs text-gray-500">
                      QR Code gerado em: {lastQrUpdate.toLocaleTimeString('pt-BR')}
                    </p>
                  )}
                </div>
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