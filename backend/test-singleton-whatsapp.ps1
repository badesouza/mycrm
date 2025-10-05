# Script para testar o singleton do WhatsApp
Write-Host "TESTE DO SINGLETON WHATSAPP" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar status inicial
Write-Host "1. STATUS INICIAL DO WHATSAPP:" -ForegroundColor Yellow
try {
    $status1 = Invoke-RestMethod -Uri "http://localhost:3001/api/whatsapp-status-public" -Method GET
    Write-Host "   Conectado: $($status1.isConnected)" -ForegroundColor White
    Write-Host "   Tem QR Code: $($status1.hasQRCode)" -ForegroundColor White
    Write-Host "   Timestamp: $($status1.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 2. Executar cobranças (deve usar a mesma instância)
Write-Host "2. EXECUTANDO COBRANÇAS (SINGLETON):" -ForegroundColor Yellow
try {
    $billing = Invoke-RestMethod -Uri "http://localhost:3001/api/test-whatsapp-billing" -Method POST -ContentType "application/json"
    Write-Host "   Resultado: $($billing.message)" -ForegroundColor White
    Write-Host "   Timestamp: $($billing.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Verificar status após cobranças
Write-Host "3. STATUS APÓS COBRANÇAS:" -ForegroundColor Yellow
try {
    $status2 = Invoke-RestMethod -Uri "http://localhost:3001/api/whatsapp-status-public" -Method GET
    Write-Host "   Conectado: $($status2.isConnected)" -ForegroundColor White
    Write-Host "   Tem QR Code: $($status2.hasQRCode)" -ForegroundColor White
    Write-Host "   Timestamp: $($status2.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Análise do resultado
Write-Host "4. ANÁLISE DO SINGLETON:" -ForegroundColor Cyan
if ($status1 -and $status2) {
    $sameConnection = $status1.isConnected -eq $status2.isConnected
    $sameQR = $status1.hasQRCode -eq $status2.hasQRCode
    
    Write-Host "   Status de conexão mantido: $sameConnection" -ForegroundColor $(if($sameConnection) {"Green"} else {"Red"})
    Write-Host "   QR Code mantido: $sameQR" -ForegroundColor $(if($sameQR) {"Green"} else {"Red"})
    
    if ($sameConnection -and $sameQR) {
        Write-Host "   ✅ SINGLETON FUNCIONANDO PERFEITAMENTE!" -ForegroundColor Green
        Write-Host "   ✅ Não há reconexão desnecessária!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ PROBLEMA NO SINGLETON!" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Não foi possível comparar os status" -ForegroundColor Red
}

Write-Host ""

# 5. Instruções para conectar WhatsApp
Write-Host "5. PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "   - Acesse: http://localhost:3000/whatsapp" -ForegroundColor White
Write-Host "   - Escaneie o QR Code para conectar" -ForegroundColor White
Write-Host "   - Após conectar, execute este teste novamente" -ForegroundColor White
Write-Host "   - As mensagens serão enviadas usando a mesma sessão!" -ForegroundColor White

Write-Host ""
Write-Host "TESTE CONCLUÍDO!" -ForegroundColor Green
