import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro');

async function inspect() {
    console.log('--- 🔎 Inspecting All Collections ---');
    const cols = ['clientes', 'negocios', 'contratos', 'ordens_servico', 'servicos'];

    for (const col of cols) {
        try {
            const result = await pb.collection(col).getList(1, 1);
            console.log(`\nColeção: ${col}`);
            if (result.items.length > 0) {
                console.log('Campos detectados:', Object.keys(result.items[0]).filter(k => !['collectionId', 'collectionName', 'id', 'created', 'updated'].includes(k)));
            } else {
                console.log('⚠️ Vazia ou não existente.');
            }
        } catch (e) {
            console.log(`\nColeção: ${col} - Erro: ${e.message}`);
        }
    }
}

inspect();
