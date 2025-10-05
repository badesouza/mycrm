# Script para testar cobranças via WhatsApp
Write-Host "TESTE DE COBRANÇAS VIA WHATSAPP" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se o servidor está rodando
Write-Host "1. Verificando servidor..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
    Write-Host "   OK - Servidor está rodando: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ERRO - Servidor não está rodando. Inicie com: npm run dev" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Testar endpoint de cobranças
Write-Host "2. Executando processamento de cobranças..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/test-whatsapp-billing" -Method POST -ContentType "application/json"
    Write-Host "   OK - Processamento executado com sucesso!" -ForegroundColor Green
    Write-Host "   Mensagem: $($response.message)" -ForegroundColor White
    Write-Host "   Timestamp: $($response.timestamp)" -ForegroundColor White
} catch {
    Write-Host "   ERRO - Erro ao executar processamento: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Testar job completo (opcional)
Write-Host "3. Testando job completo de faturamento..." -ForegroundColor Yellow
try {
    $jobResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/test-invoice-job" -Method POST -ContentType "application/json"
    Write-Host "   OK - Job executado com sucesso!" -ForegroundColor Green
    Write-Host "   Mensagem: $($jobResponse.message)" -ForegroundColor White
} catch {
    Write-Host "   ERRO - Erro ao executar job: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "TESTE CONCLUÍDO!" -ForegroundColor Green
Write-Host "Verifique os logs do servidor para ver os detalhes das mensagens enviadas." -ForegroundColor Cyan
Write-Host ""
Write-Host "DICAS:" -ForegroundColor Yellow
Write-Host "   - Os logs mostram quais mensagens foram preparadas para envio" -ForegroundColor White
Write-Host "   - Verifique se há pagamentos com vencimento hoje" -ForegroundColor White
Write-Host "   - As mensagens são personalizadas baseadas na diferença de dias" -ForegroundColor White
