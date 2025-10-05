const fetch = require('node-fetch');

async function testPhoneAPI() {
    try {
        console.log('🔍 Testando API de payments para verificar se retorna customerPhone...');

        // Primeiro, vamos fazer login para obter um token
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@example.com', // Substitua pelo email de um usuário válido
                password: 'password123' // Substitua pela senha
            })
        });

        if (!loginResponse.ok) {
            console.error('❌ Erro no login:', await loginResponse.text());
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;

        console.log('✅ Login realizado com sucesso');

        // Agora vamos testar a API de payments
        const paymentsResponse = await fetch('http://localhost:3001/api/payments', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!paymentsResponse.ok) {
            console.error('❌ Erro na API de payments:', await paymentsResponse.text());
            return;
        }

        const paymentsData = await paymentsResponse.json();

        console.log('📊 Dados recebidos da API:');
        console.log('Total de payments:', paymentsData.data?.length || 0);

        if (paymentsData.data && paymentsData.data.length > 0) {
            const firstPayment = paymentsData.data[0];
            console.log('🔍 Primeiro payment:');
            console.log('- ID:', firstPayment.id);
            console.log('- Customer Name:', firstPayment.customerName);
            console.log('- Customer Phone:', firstPayment.customerPhone);
            console.log('- Amount:', firstPayment.amount);
            console.log('- Status:', firstPayment.status);

            if (!firstPayment.customerPhone) {
                console.log('⚠️ PROBLEMA: customerPhone está vazio ou undefined!');
                console.log('🔍 Estrutura completa do payment:', JSON.stringify(firstPayment, null, 2));
            } else {
                console.log('✅ customerPhone está presente:', firstPayment.customerPhone);
            }
        } else {
            console.log('⚠️ Nenhum payment encontrado na API');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testPhoneAPI();
