export enum PaymentMethod {
  PIX = 'pix',
  BOLETO = 'boleto',
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBT_CARD = 'debt_card',
  BANK_TRANSFER = 'bank_transfer'
}

export const getPaymentMethodLabel = (method: string): string => {
  console.log('getPaymentMethodLabel called with method:', method);
  switch (method) {
    case PaymentMethod.PIX:
      return 'PIX';
    case PaymentMethod.BOLETO:
      return 'Boleto';
    case PaymentMethod.CASH:
      return 'Dinheiro';
    case PaymentMethod.CREDIT_CARD:
      return 'Cartão de Crédito';
    case PaymentMethod.DEBT_CARD:
      return 'Cartão de Débito';
    case PaymentMethod.BANK_TRANSFER:
      return 'Transferência Bancária';
    // Casos adicionais para compatibilidade
    case 'pix':
      return 'PIX';
    case 'boleto':
      return 'Boleto';
    case 'cash':
      return 'Dinheiro';
    case 'credit_card':
      return 'Cartão de Crédito';
    case 'debt_card':
      return 'Cartão de Débito';
    case 'bank_transfer':
      return 'Transferência Bancária';
    default:
      console.log('Unknown payment method:', method);
      return method;
  }
};
