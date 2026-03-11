import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro');

async function inspect() {
    console.log('--- 🔎 Inspecting Collection Schema ---');
    try {
        // Tentamos pegar um registro e ver TODAS as chaves que ele possui
        const result = await pb.collection('clientes').getList(1, 1);
        if (result.items.length > 0) {
            console.log('Chaves encontradas no registro:', Object.keys(result.items[0]));
            console.log('Conteúdo bruto:', JSON.stringify(result.items[0], null, 2));
        } else {
            console.log('A coleção está vazia, não consigo inspecionar as chaves dos registros.');
        }

    } catch (error) {
        console.error('Erro ao inspecionar:', error.message);
    }
}

inspect();
