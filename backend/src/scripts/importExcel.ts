import { processExcelFile } from '../services/excelService';
import path from 'path';

async function testImport() {
  try {
    const filePath = path.join(__dirname, '../../uploads/foodservice_companies_v1.xlsx');
    console.log('Processing file:', filePath);
    
    const result = await processExcelFile(filePath);
    
    console.log('\nImport Results:');
    console.log('----------------');
    console.log(`Successfully imported: ${result.success} customers`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      console.log('----------------');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

testImport(); 