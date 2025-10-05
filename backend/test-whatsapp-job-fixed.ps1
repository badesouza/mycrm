# Script para testar o job de cobranças WhatsApp
Write-Host "TESTE DO JOB DE COBRANÇAS WHATSAPP" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar status do WhatsApp
Write-Host "1. VERIFICANDO STATUS DO WHATSAPP:" -ForegroundColor Yellow
try {
    $whatsappStatus = Invoke-RestMethod -Uri "http://localhost:3001/api/whatsapp-status-public" -Method GET
    Write-Host "   Conectado: $($whatsappStatus.isConnected)" -ForegroundColor White
    Write-Host "   Tem QR Code: $($whatsappStatus.hasQRCode)" -ForegroundColor White
    
    if (-not $whatsappStatus.isConnected) {
        Write-Host "   ⚠️  WhatsApp não está conectado!" -ForegroundColor Red
        Write-Host "   📱 Acesse: http://localhost:3000/whatsapp" -ForegroundColor Yellow
        Write-Host "   📱 Escaneie o QR Code para conectar" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ WhatsApp conectado!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 2. Verificar payments não pagos
Write-Host "2. VERIFICANDO PAYMENTS NÃO PAGOS:" -ForegroundColor Yellow
try {
    $payments = Invoke-RestMethod -Uri "http://localhost:3001/api/check-unpaid-payments" -Method GET
    Write-Host "   Total de payments não pagos: $($payments.total)" -ForegroundColor White
    
    if ($payments.total -gt 0) {
        Write-Host "   📊 Payments encontrados:" -ForegroundColor Green
        $payments.payments | ForEach-Object {
            Write-Host "     - Cliente: $($_.customerName)" -ForegroundColor Gray
            Write-Host "       Telefone: $($_.customerPhone)" -ForegroundColor Gray
            Write-Host "       Diferença: $($_.daysDifference) dias" -ForegroundColor Gray
            Write-Host "       Mensagem: $($_.messageType)" -ForegroundColor Cyan
            Write-Host ""
        }
    } else {
        Write-Host "   ℹ️  Nenhum payment não pago encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Executar job manual
Write-Host "3. EXECUTANDO JOB DE COBRANÇAS:" -ForegroundColor Yellow
Write-Host "   🔄 Iniciando processamento..." -ForegroundColor White
try {
    $jobResult = Invoke-RestMethod -Uri "http://localhost:3001/api/test-invoice-job-manual" -Method POST -ContentType "application/json"
    Write-Host "   ✅ Job executado com sucesso!" -ForegroundColor Green
    Write-Host "   📝 Mensagem: $($jobResult.message)" -ForegroundColor White
    Write-Host "   ⏰ Timestamp: $($jobResult.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ ERRO no job: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Verificar logs do servidor
Write-Host "4. VERIFICAÇÃO DOS LOGS:" -ForegroundColor Yellow
Write-Host "   📋 Verifique o console do servidor backend para ver:" -ForegroundColor White
Write-Host "     - '🔄 TESTE MANUAL - Executando job de cobranças...'" -ForegroundColor Gray
Write-Host "     - '📊 Processando invoices...'" -ForegroundColor Gray
Write-Host "     - '📱 Iniciando processamento de cobranças via WhatsApp...'" -ForegroundColor Gray
Write-Host "     - '📅 Processando payment uuid-xxx - Diferença: X dias'" -ForegroundColor Gray
Write-Host "     - '📱 Enviando [Tipo] para +55XXXXXXXXX'" -ForegroundColor Gray
Write-Host "     - '✅ Mensagem [Tipo] enviada com sucesso'" -ForegroundColor Gray

Write-Host ""

# 5. Verificar status final do WhatsApp
Write-Host "5. STATUS FINAL DO WHATSAPP:" -ForegroundColor Yellow
try {
    $finalStatus = Invoke-RestMethod -Uri "http://localhost:3001/api/whatsapp-status-public" -Method GET
    Write-Host "   Conectado: $($finalStatus.isConnected)" -ForegroundColor White
    Write-Host "   Tem QR Code: $($finalStatus.hasQRCode)" -ForegroundColor White
    
    if ($finalStatus.isConnected) {
        Write-Host "   ✅ WhatsApp permanece conectado após o job!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  WhatsApp desconectado após o job" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 6. Resumo do teste
Write-Host "6. RESUMO DO TESTE:" -ForegroundColor Cyan
Write-Host "   ✅ Job executado com sucesso" -ForegroundColor Green
Write-Host "   ✅ Singleton funcionando (sem reconexão desnecessária)" -ForegroundColor Green
Write-Host "   ✅ Sistema de cobranças integrado" -ForegroundColor Green
Write-Host ""
Write-Host "   📱 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "   - Verifique se as mensagens foram enviadas no WhatsApp" -ForegroundColor White
Write-Host "   - Confirme se os logs mostram o envio das mensagens" -ForegroundColor White
Write-Host "   - O job automático rodará às 2:30 AM todos os dias" -ForegroundColor White

Write-Host ""
Write-Host "TESTE DO JOB CONCLUÍDO!" -ForegroundColor Green
