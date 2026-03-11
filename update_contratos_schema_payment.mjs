import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro/');

async function updateContratosSchema() {
    try {
        console.log('Autenticando...');
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');
        
        console.log('Buscando coleção contratos...');
        const coll = await pb.collections.getOne('contratos');
        const currentFields = coll.fields || [];

        const newFields = [
            { 
                name: 'status_pagamento', 
                type: 'select', 
                values: ['Pendente', 'Pago']
            },
            { 
                name: 'comprovante', 
                type: 'file', 
                maxSelect: 1, 
                maxSize: 5242880, 
                mimeTypes: ['image/jpeg', 'image/png', 'application/pdf']
            }
        ];

        newFields.forEach(f => {
            if (!currentFields.find(s => s.name === f.name)) {
                currentFields.push(f);
                console.log(`Adicionando campo ${f.name}...`);
            }
        });

        console.log('Atualizando fields da coleção...');
        await pb.collections.update(coll.id, { fields: currentFields });

        console.log('Coleção contratos atualizada com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar schema:', error.message);
        if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }
}

updateContratosSchema();
