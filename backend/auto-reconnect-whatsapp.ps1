# Script para reconectar WhatsApp automaticamente após mudanças no código
Write-Host "AUTO-RECONEXÃO WHATSAPP" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Função para verificar status
function Check-WhatsAppStatus {
    try {
        $status = Invoke-RestMethod -Uri "http://localhost:3001/api/whatsapp-status-public" -Method GET
        return $status.isConnected
    } catch {
        return $false
    }
}

# Função para aguardar conexão
function Wait-ForConnection {
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $attempt++
        Write-Host "Tentativa $attempt/$maxAttempts - Verificando conexão..." -ForegroundColor Gray
        
        if (Check-WhatsAppStatus) {
            Write-Host "✅ WhatsApp conectado!" -ForegroundColor Green
            return $true
        }
        
        if ($attempt -lt $maxAttempts) {
            Write-Host "⏳ Aguardando 5 segundos..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
        
    } while ($attempt -lt $maxAttempts)
    
    return $false
}

# Verificar status inicial
Write-Host "1. Verificando status inicial..." -ForegroundColor Yellow
$isConnected = Check-WhatsAppStatus

if ($isConnected) {
    Write-Host "✅ WhatsApp já está conectado!" -ForegroundColor Green
    exit 0
}

Write-Host "❌ WhatsApp não está conectado" -ForegroundColor Red
Write-Host ""

# Instruções para conectar
Write-Host "2. INSTRUÇÕES PARA CONECTAR:" -ForegroundColor Yellow
Write-Host "   📱 Acesse: http://localhost:3000/whatsapp" -ForegroundColor White
Write-Host "   📱 Escaneie o QR Code com seu WhatsApp" -ForegroundColor White
Write-Host "   📱 Aguarde a conexão ser estabelecida" -ForegroundColor White
Write-Host ""

# Aguardar conexão
Write-Host "3. Aguardando conexão..." -ForegroundColor Yellow
Write-Host "   (Pressione Ctrl+C para cancelar)" -ForegroundColor Gray
Write-Host ""

$connected = Wait-ForConnection

if ($connected) {
    Write-Host ""
    Write-Host "🎉 WHATSAPP CONECTADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "✅ Sistema pronto para enviar mensagens" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
    Write-Host "   - Execute o job de cobranças" -ForegroundColor White
    Write-Host "   - Teste o envio de mensagens" -ForegroundColor White
    Write-Host "   - Sistema funcionará até próxima mudança no código" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⏰ TIMEOUT - Não foi possível conectar" -ForegroundColor Red
    Write-Host "📱 Certifique-se de que o WhatsApp está conectado em:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3000/whatsapp" -ForegroundColor White
}

Write-Host ""
Write-Host "SCRIPT FINALIZADO" -ForegroundColor Cyan
