import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro');

async function updateSchema() {
    try {
        console.log('Autenticando...');
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');
        console.log('Autenticado com sucesso!');

        const collections = await pb.collections.getFullList();
        const clientsColl = collections.find(c => c.name === 'clientes');

        const suporteFields = [
            { name: 'id', type: 'text', system: true, primaryKey: true, autogeneratePattern: '[a-z0-9]{15}' },
            { name: 'titulo', type: 'text', required: true, presentable: true },
            { name: 'descricao', type: 'editor' },
            { name: 'cliente', type: 'relation', required: true, collectionId: clientsColl?.id, maxSelect: 1 },
            { name: 'data_atividade', type: 'date', required: true },
            { name: 'status', type: 'select', required: true, values: ['Pendente', 'Em Andamento', 'Concluído'] },
            { name: 'faturavel', type: 'bool' },
            { name: 'tempo_gasto', type: 'number' },
            { name: 'created', type: 'autodate', system: true, onCreate: true },
            { name: 'updated', type: 'autodate', system: true, onCreate: true, onUpdate: true }
        ];

        const suporteColl = collections.find(c => c.name === 'suporte');
        if (suporteColl) {
            console.log('Atualizando a coleção existente "suporte"...');
            await pb.collections.update(suporteColl.id, {
                fields: suporteFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        } else {
            console.log('Criando a coleção "suporte"...');
            await pb.collections.create({
                name: 'suporte',
                type: 'base',
                system: false,
                fields: suporteFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        console.log('Schema atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar schema:', error);
    }
}

updateSchema();
