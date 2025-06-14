import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  city: string;
  manager: string;
  due_date: string;
  value: number;
  status: 'active' | 'inactive';
}

export async function processExcelFile(filePath: string): Promise<{ success: number; errors: string[] }> {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];
    
    const errors: string[] = [];
    let successCount = 0;

    // Process each row
    for (const row of data) {
      try {
        // Validate and transform data
        const customerData: CustomerData = {
          name: String(row.name || '').trim(),
          email: String(row.email || '').trim(),
          phone: String(row.phone || '').trim(),
          city: String(row.city || '').trim(),
          manager: String(row.manager || '').trim(),
          due_date: formatDate(row.due_date),
          value: validateAndFormatValue(row.value),
          status: validateStatus(row.status)
        };

        // Validate required fields
        if (!customerData.name || !customerData.email || !customerData.phone || !customerData.city || !customerData.manager) {
          errors.push(`Linha inválida: campos obrigatórios ausentes para ${customerData.name || 'registro sem nome'}`);
          continue;
        }

        // Create customer in database
        await prisma.customer.create({
          data: {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            district: customerData.city,
            manager: customerData.manager,
            due_date: customerData.due_date,
            amount: customerData.value,
            status: customerData.status,
            paymentMethod: 'credit_card' // Default value
          }
        });

        successCount++;
      } catch (error) {
        errors.push(`Erro ao processar linha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return { success: successCount, errors };
  } catch (error) {
    throw new Error(`Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

function formatDate(dateValue: any): string {
  if (!dateValue) return '';
  
  try {
    // Handle different date formats
    let date: Date;
    
    if (typeof dateValue === 'string') {
      // Try to parse DD/MM/YY format
      const [day, month, year] = dateValue.split('/');
      const fullYear = 2000 + parseInt(year);
      date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'number') {
      // Excel dates are stored as number of days since 1900-01-01
      const excelEpoch = new Date(1900, 0, 1);
      date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
    } else {
      throw new Error(`Formato de data não suportado: ${dateValue}`);
    }

    // Validate the date
    if (isNaN(date.getTime())) {
      throw new Error(`Data inválida: ${dateValue}`);
    }

    // Format to ISO-8601 string (YYYY-MM-DDTHH:mm:ss.sssZ)
    return date.toISOString();
  } catch (error) {
    throw new Error(`Erro ao formatar data: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

function validateAndFormatValue(value: any): number {
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    throw new Error(`Valor inválido: ${value}`);
  }
  
  if (numValue < 150 || numValue > 550) {
    throw new Error(`Valor fora do intervalo permitido (150-550): ${numValue}`);
  }
  
  return numValue;
}

function validateStatus(status: any): 'active' | 'inactive' {
  const statusStr = String(status || '').toLowerCase().trim();
  
  if (statusStr !== 'active' && statusStr !== 'inactive') {
    throw new Error(`Status inválido: ${status}. Deve ser 'active' ou 'inactive'`);
  }
  
  return statusStr as 'active' | 'inactive';
} 