# Script para monitorar conexão do WhatsApp e testar automaticamente
Write-Host "MONITOR DE CONEXÃO WHATSAPP" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$maxAttempts = 30
$attempt = 0

Write-Host "🔍 Monitorando conexão do WhatsApp..." -ForegroundColor Yellow
Write-Host "📱 Acesse: http://localhost:3000/whatsapp" -ForegroundColor White
Write-Host "📱 Escaneie o QR Code para conectar" -ForegroundColor White
Write-Host ""

do {
    $attempt++
    Write-Host "Tentativa $attempt/$maxAttempts - Verificando status..." -ForegroundColor Gray
    
    try {
        $status = Invoke-RestMethod -Uri "http://localhost:3001/api/whatsapp-status-public" -Method GET
        
        if ($status.isConnected) {
            Write-Host "✅ WHATSAPP CONECTADO!" -ForegroundColor Green
            Write-Host "📱 Status: Conectado" -ForegroundColor White
            Write-Host "🔄 Executando job de cobranças..." -ForegroundColor Yellow
            
            # Executar job
            $jobResult = Invoke-RestMethod -Uri "http://localhost:3001/api/test-invoice-job-manual" -Method POST -ContentType "application/json"
            Write-Host "✅ Job executado: $($jobResult.message)" -ForegroundColor Green
            Write-Host "⏰ Timestamp: $($jobResult.timestamp)" -ForegroundColor Gray
            
            Write-Host ""
            Write-Host "🎉 TESTE COMPLETO!" -ForegroundColor Green
            Write-Host "📱 Verifique seu WhatsApp para ver as mensagens enviadas!" -ForegroundColor Yellow
            break
        } else {
            Write-Host "⏳ Aguardando conexão... (QR Code disponível: $($status.hasQRCode))" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Erro ao verificar status: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    if ($attempt -lt $maxAttempts) {
        Write-Host "⏱️  Aguardando 5 segundos..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
    
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host ""
    Write-Host "⏰ TIMEOUT - Máximo de tentativas atingido" -ForegroundColor Red
    Write-Host "📱 Certifique-se de que o WhatsApp está conectado em:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3000/whatsapp" -ForegroundColor White
}

Write-Host ""
Write-Host "MONITOR FINALIZADO" -ForegroundColor Cyan
