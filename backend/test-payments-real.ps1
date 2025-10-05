# Script para testar cobranças com payments reais do banco
Write-Host "TESTE COM PAYMENTS REAIS DO BANCO DE DADOS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
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

# 2. Verificar status do WhatsApp
Write-Host "2. Verificando status do WhatsApp..." -ForegroundColor Yellow
try {
    $whatsappStatus = Invoke-RestMethod -Uri "http://localhost:3001/api/whatsapp/status" -Method GET
    Write-Host "   Status do WhatsApp: $($whatsappStatus.isConnected)" -ForegroundColor White
    Write-Host "   Conectado: $($whatsappStatus.isConnected)" -ForegroundColor White
} catch {
    Write-Host "   AVISO - Não foi possível verificar status do WhatsApp" -ForegroundColor Yellow
}

Write-Host ""

# 3. Executar processamento de cobranças
Write-Host "3. Executando processamento de cobranças com payments reais..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/test-whatsapp-billing" -Method POST -ContentType "application/json"
    Write-Host "   OK - Processamento executado!" -ForegroundColor Green
    Write-Host "   Mensagem: $($response.message)" -ForegroundColor White
    Write-Host "   Timestamp: $($response.timestamp)" -ForegroundColor White
} catch {
    Write-Host "   ERRO - Falha no processamento: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Verificar logs do servidor
Write-Host "4. INSTRUÇÕES PARA VERIFICAR LOGS:" -ForegroundColor Yellow
Write-Host "   - Verifique o console do servidor backend" -ForegroundColor White
Write-Host "   - Procure por logs como:" -ForegroundColor White
Write-Host "     * '📱 Iniciando processamento de cobranças via WhatsApp...'" -ForegroundColor Gray
Write-Host "     * '📊 Encontrados X pagamentos não pagos'" -ForegroundColor Gray
Write-Host "     * '📅 Processando payment uuid-xxx - Diferença: X dias'" -ForegroundColor Gray
Write-Host "     * '📱 Enviando [Tipo] para +55XXXXXXXXX'" -ForegroundColor Gray
Write-Host "     * '✅ Mensagem [Tipo] enviada com sucesso'" -ForegroundColor Gray

Write-Host ""
Write-Host "5. POSSÍVEIS CENÁRIOS:" -ForegroundColor Yellow
Write-Host "   - Se não há payments não pagos: Nenhuma mensagem será enviada" -ForegroundColor White
Write-Host "   - Se há payments vencendo hoje: Mensagem 'Vencimento hoje'" -ForegroundColor White
Write-Host "   - Se há payments 5 dias antes: Mensagem 'Lembrete 5 dias'" -ForegroundColor White
Write-Host "   - Se há payments 3 dias atrasados: Mensagem 'Urgência 3 dias'" -ForegroundColor White
Write-Host "   - Se há payments 7 dias atrasados: Mensagem 'Suspensão 7 dias'" -ForegroundColor White

Write-Host ""
Write-Host "TESTE CONCLUÍDO!" -ForegroundColor Green
Write-Host "Verifique os logs do servidor para ver os detalhes das mensagens enviadas." -ForegroundColor Cyan
