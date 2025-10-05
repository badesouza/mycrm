# Script para testar envio real de mensagem via WhatsApp
Write-Host "TESTE DE ENVIO REAL VIA WHATSAPP" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar dados do usuário
$phone = Read-Host "Digite o número do telefone (ex: +5511999999999)"
$message = Read-Host "Digite a mensagem de teste"

if ([string]::IsNullOrEmpty($phone) -or [string]::IsNullOrEmpty($message)) {
    Write-Host "ERRO: Telefone e mensagem são obrigatórios!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Enviando mensagem..." -ForegroundColor Yellow
Write-Host "Telefone: $phone" -ForegroundColor White
Write-Host "Mensagem: $message" -ForegroundColor White
Write-Host ""

try {
    $body = @{
        phone = $phone
        message = $message
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/test-whatsapp-message" -Method POST -ContentType "application/json" -Body $body
    
    Write-Host "SUCESSO!" -ForegroundColor Green
    Write-Host "Mensagem: $($response.message)" -ForegroundColor White
    Write-Host "Telefone: $($response.phone)" -ForegroundColor White
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor White
    
} catch {
    Write-Host "ERRO ao enviar mensagem:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalhes: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "- Certifique-se de que o WhatsApp está conectado" -ForegroundColor White
Write-Host "- Verifique se o número está no formato correto (+55XXYYYYYYYY)" -ForegroundColor White
Write-Host "- O número deve ter WhatsApp ativo" -ForegroundColor White
