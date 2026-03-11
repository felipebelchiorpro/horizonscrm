import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro/');

async function fixServicosSchema() {
    try {
        console.log('Autenticando...');
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');
        
        console.log('Buscando coleção servicos...');
        const coll = await pb.collections.getOne('servicos');
        
        const fields = [
            { name: 'id', type: 'text', system: true, primaryKey: true, autogeneratePattern: '[a-z0-9]{15}' },
            { name: 'nome', type: 'text', required: true, presentable: true },
            { name: 'valor_padrao', type: 'number' },
            { name: 'descricao_padrao', type: 'text' },
            { name: 'condicao_pagamento', type: 'select', values: ['100% no final', '50% antes / 50% depois', '100% antecipado', 'Personalizado'] },
            { name: 'created', type: 'autodate', system: true, onCreate: true },
            { name: 'updated', type: 'autodate', system: true, onCreate: true, onUpdate: true }
        ];

        console.log('Atualizando schema e regras...');
        await pb.collections.update(coll.id, {
            fields: fields,
            listRule: '',
            viewRule: '',
            createRule: '',
            updateRule: '',
            deleteRule: ''
        });

        console.log('Schema da coleção servicos corrigido com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar schema:', error.message);
        if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }
}

fixServicosSchema();
