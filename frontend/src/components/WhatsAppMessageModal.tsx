'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/use-toast';
import { formatPhoneNumber } from '@/lib/phoneUtils';

interface WhatsAppMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  paymentId: string;
  dueDate: string;
  amount: number;
}

export default function WhatsAppMessageModal({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  paymentId,
  dueDate,
  amount
}: WhatsAppMessageModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Função para calcular diferença de dias
  const calculateDaysDifference = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDateNormalized = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    
    const diffTime = dueDateNormalized.getTime() - todayNormalized.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Função para gerar mensagem padrão baseada na lógica de cobrança
  const generateDefaultMessage = (daysDifference: number): string => {
    if (daysDifference === 5) {
      return `👋 Olá ${customerName}!

📅 Sua assinatura do Gesfood vence em 5 dias.

💳 Para manter o acesso contínuo, realize o pagamento através do PIX.

✅ Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Obrigado pela preferência! 🙏`;
    } else if (daysDifference === 3) {
      return `👋 Olá ${customerName}!

📅 Sua assinatura do Gesfood vence em 3 dias.

💳 Para manter o acesso contínuo, realize o pagamento através do PIX.

✅ Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Obrigado pela preferência! 🙏`;
    } else if (daysDifference === 2) {
      return `👋 Olá ${customerName}!

📅 Sua assinatura do Gesfood vence em 2 dias.

💳 Para manter o acesso contínuo, realize o pagamento através do PIX.

✅ Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Obrigado pela preferência! 🙏`;
    } else if (daysDifference === 0) {
      return `📅 Olá ${customerName}!

⚠️ Sua assinatura do Gesfood vence HOJE.

💳 Para manter o acesso contínuo, realize o pagamento através do PIX.

✅ Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Obrigado pela preferência! 🙏`;
    } else if (daysDifference === -1 || daysDifference === -2) {
      return `⚠️ Olá ${customerName}!

📅 Sua assinatura do Gesfood venceu há ${Math.abs(daysDifference)} dia(s).

💳 Para manter o acesso contínuo, realize o pagamento através do PIX.

✅ Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Obrigado pela preferência! 🙏`;
    } else if (daysDifference === -3) {
      return `🚨 URGENTE - Olá ${customerName}!

⚠️ Identificamos que seu pagamento ainda não foi efetuado.

⏰ O acesso será SUSPENSO em 24h se o pagamento não for realizado.

💳 Realize o pagamento através do PIX IMEDIATAMENTE.

🔒 Evite a suspensão do seu serviço Gesfood.

Obrigado pela atenção! 🙏`;
    } else if (daysDifference <= -7) {
      return `🔒 Olá ${customerName}!

⚠️ Sua conta foi temporariamente SUSPENSA devido ao atraso no pagamento.

💳 Para reativar seu acesso, realize o pagamento através do PIX.

✅ Assim que o pagamento for confirmado, reativaremos automaticamente.

🔄 Seu serviço Gesfood será restaurado em até 24h após o pagamento.

Obrigado pela compreensão! 🙏`;
    } else if (daysDifference === -4 || daysDifference === -5 || daysDifference === -6) {
      return `⚠️ Olá ${customerName}!

📅 Sua assinatura do Gesfood venceu há ${Math.abs(daysDifference)} dias.

💳 Para manter o acesso contínuo, realize o pagamento através do PIX.

✅ Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Obrigado pela preferência! 🙏`;
    }
    
    return ''; // Retorna vazio se não estiver no padrão
  };

  // Gerar mensagem padrão quando o modal abre
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 WhatsApp Modal opened with data:', {
        customerName,
        customerPhone,
        customerPhoneType: typeof customerPhone,
        customerPhoneValue: JSON.stringify(customerPhone),
        paymentId,
        dueDate,
        amount
      });
      
      const daysDifference = calculateDaysDifference(dueDate);
      const defaultMessage = generateDefaultMessage(daysDifference);
      setMessage(defaultMessage);
    }
  }, [isOpen, dueDate, customerName, customerPhone, paymentId, amount]);

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, digite uma mensagem',
        variant: 'destructive',
      });
      return;
    }

    if (!customerPhone) {
      toast({
        title: 'Erro',
        description: 'Telefone do cliente não informado',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3001/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: customerPhone,
          message: message
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      toast({
        title: 'Sucesso',
        description: 'Mensagem enviada com sucesso!',
      });

      handleCancel();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Enviar Mensagem WhatsApp
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 mb-2">
            <strong>Cliente:</strong> {customerName}
          </p>
          <p className="text-gray-300 mb-2">
            <strong>Telefone:</strong> {formatPhoneNumber(customerPhone) || 'Não informado'}
            {!customerPhone && (
              <span className="text-red-400 text-xs ml-2">
                (Debug: customerPhone está vazio)
              </span>
            )}
          </p>
          <p className="text-gray-300 mb-2">
            <strong>Valor:</strong> R$ {amount.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-gray-300">
            <strong>Vencimento:</strong> {new Date(dueDate).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
            Mensagem
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-40 p-3 bg-gray-700 text-white border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite sua mensagem aqui..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="bg-gray-600 text-white hover:bg-gray-500"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {loading ? 'Enviando...' : 'Enviar Mensagem'}
          </Button>
        </div>
      </div>
    </div>
  );
}
