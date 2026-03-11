import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro');

async function debug() {
    console.log('--- 🛡️ PocketBase Connection Debug ---');
    console.log('URL:', pb.baseUrl);

    try {
        console.log('\n1. Verificando coleção "clientes"...');
        // Usamos getList em vez de getFullList para o primeiro teste
        const result = await pb.collection('clientes').getList(1, 10);

        console.log('✅ Conexão bem sucedida!');
        console.log('Total de registros:', result.totalItems);

        if (result.items.length > 0) {
            console.log('\n--- Dados do Primeiro Cliente ---');
            console.log(JSON.stringify(result.items[0], null, 2));
        } else {
            console.log('\n⚠️ A coleção "clientes" existe, mas está VAZIA.');
        }

    } catch (error) {
        console.error('\n❌ ERRO NA CONEXÃO OU CONSULTA:');
        console.error('Status:', error.status);
        console.error('Mensagem:', error.message);
        console.error('Dados:', error.data);

        if (error.status === 404) {
            console.error('\nCausa provável: A coleção "clientes" não existe no PocketBase.');
        } else if (error.status === 403 || error.status === 400) {
            console.error('\nCausa provável: As API Rules do PocketBase não permitem List/View público.');
        }
    }
}

debug();
