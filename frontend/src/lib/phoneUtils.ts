/**
 * Formata um número de telefone brasileiro removendo o código do país (55) e adicionando o 9
 * @param phone - Número de telefone (pode incluir +55, 55, ou apenas o número)
 * @returns Número formatado como (00) 90000-0000 ou string vazia se inválido
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se o número começar com 55 (código do Brasil), remove
  let phoneNumber = cleanPhone;
  if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
    phoneNumber = cleanPhone.substring(2);
  }
  
  // Se o número tem 10 dígitos (sem o 9), adiciona o 9
  if (phoneNumber.length === 10) {
    phoneNumber = phoneNumber.substring(0, 2) + '9' + phoneNumber.substring(2);
  }
  
  // Se o número tem 11 dígitos, formata
  if (phoneNumber.length === 11) {
    return `(${phoneNumber.substring(0, 2)}) ${phoneNumber.substring(2, 7)}-${phoneNumber.substring(7)}`;
  }
  
  // Se não conseguir formatar, retorna o número original limpo
  return phoneNumber;
}

/**
 * Formata um número de telefone para exibição em listas (formato mais compacto)
 * @param phone - Número de telefone
 * @returns Número formatado como (00) 9 0000-0000
 */
export function formatPhoneNumberCompact(phone: string | null | undefined): string {
  if (!phone) return 'Não informado';
  
  const formatted = formatPhoneNumber(phone);
  if (!formatted) return 'Não informado';
  
  // Adiciona espaço após o 9 para melhor legibilidade
  return formatted.replace('9', '9 ');
}
