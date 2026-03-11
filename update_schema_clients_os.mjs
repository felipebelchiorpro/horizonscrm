import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro');

async function updateSchema(email, password) {
    try {
        console.log('--- 🛡️ PocketBase Schema Update ---');

        if (!email || !password) {
            console.error('ERRO: Email e senha de administrador são necessários.');
            return;
        }

        console.log('Autenticando como admin...');
        await pb.admins.authWithPassword(email, password);
        console.log('✅ Autenticado com sucesso!');

        const collections = await pb.collections.getFullList();

        // 1. Atualizar ou Criar 'clientes'
        let clientsColl = collections.find(c => c.name === 'clientes');
        const clientSchema = [
            { name: 'nome', type: 'text', required: true },
            { name: 'documento', type: 'text' },
            { name: 'email', type: 'email' },
            { name: 'telefone', type: 'text' },
            { name: 'empresa', type: 'text' },
            { name: 'cargo', type: 'text' },
            { name: 'cep', type: 'text' },
            { name: 'endereco', type: 'text' },
            { name: 'cidade', type: 'text' },
            { name: 'estado', type: 'text' },
            { name: 'status', type: 'select', options: { values: ['Lead', 'Prospect', 'Ativo', 'Inativo'] } },
            { name: 'observacoes', type: 'text' }
        ];

        if (!clientsColl) {
            console.log('Criando collection "clientes"...');
            clientsColl = await pb.collections.create({
                name: 'clientes',
                type: 'base',
                schema: clientSchema,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        } else {
            console.log('Atualizando schema da collection "clientes"...');
            await pb.collections.update(clientsColl.id, {
                schema: clientSchema,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }
        console.log('✅ Collection "clientes" atualizada!');

        // 2. Criar 'ordens_servico'
        let osColl = collections.find(c => c.name === 'ordens_servico');
        if (!osColl) {
            console.log('Criando collection "ordens_servico"...');
            await pb.collections.create({
                name: 'ordens_servico',
                type: 'base',
                schema: [
                    { name: 'cliente', type: 'relation', required: true, options: { collectionId: clientsColl.id, maxSelect: 1 } },
                    { name: 'titulo', type: 'text', required: true },
                    { name: 'descricao', type: 'text' },
                    { name: 'valor', type: 'number' },
                    { name: 'status', type: 'select', options: { values: ['Pendente', 'Em Execução', 'Concluída', 'Cancelada'] } },
                    { name: 'data_inicio', type: 'date' },
                    { name: 'data_fim', type: 'date' }
                ],
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
            console.log('✅ Collection "ordens_servico" criada!');
        }

    } catch (error) {
        console.error('❌ Erro na atualização:', error.message);
        if (error.data) console.error('Detalhes:', JSON.stringify(error.data));
    }
}

// Para rodar: node update_schema_clients_os.mjs <email> <senha>
const [email, password] = process.argv.slice(2);
updateSchema(email, password);
