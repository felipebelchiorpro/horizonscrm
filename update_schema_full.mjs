import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro');

async function updateSchema(email, password) {
    try {
        console.log('--- 🛡️ PocketBase Full Schema Update ---');

        if (!email || !password) {
            console.error('ERRO: Email e senha de administrador são necessários.');
            return;
        }

        console.log('Autenticando como admin...');
        await pb.admins.authWithPassword(email, password);
        console.log('✅ Autenticado com sucesso!');

        const collections = await pb.collections.getFullList();

        // 1. Clientes
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
        await syncCollection('clientes', clientSchema, collections);

        // 2. Negócios
        const negociosSchema = [
            { name: 'cliente', type: 'relation', required: true, options: { collectionId: clientsColl?.id, maxSelect: 1 } },
            { name: 'titulo', type: 'text', required: true },
            { name: 'valor', type: 'number' },
            { name: 'etapa', type: 'select', options: { values: ['Lead', 'Qualificado', 'Proposta', 'Negociação', 'Fechado', 'Perdido'] } },
            { name: 'descricao', type: 'text' }
        ];
        await syncCollection('negocios', negociosSchema, collections);

        // 3. Contratos
        const contratosSchema = [
            { name: 'cliente', type: 'relation', required: true, options: { collectionId: clientsColl?.id, maxSelect: 1 } },
            { name: 'titulo', type: 'text', required: true },
            { name: 'valor', type: 'number' },
            { name: 'status', type: 'select', options: { values: ['Rascunho', 'Enviado', 'Assinado', 'Cancelado'] } },
            { name: 'conteudo', type: 'text' },
            { name: 'data_assinatura', type: 'date' },
            { name: 'hash_assinatura', type: 'text' },
            { name: 'ip_assinatura', type: 'text' }
        ];
        await syncCollection('contratos', contratosSchema, collections);

        // 4. Ordens de Serviço
        const osSchema = [
            { name: 'cliente', type: 'relation', required: true, options: { collectionId: clientsColl?.id, maxSelect: 1 } },
            { name: 'titulo', type: 'text', required: true },
            { name: 'descricao', type: 'text' },
            { name: 'valor', type: 'number' },
            { name: 'status', type: 'select', options: { values: ['Pendente', 'Em Execução', 'Concluída', 'Cancelada'] } },
            { name: 'data_inicio', type: 'date' },
            { name: 'data_fim', type: 'date' }
        ];
        await syncCollection('ordens_servico', osSchema, collections);

        console.log('\n✅ Todas as coleções foram sincronizadas com sucesso!');

    } catch (error) {
        console.error('❌ Erro na atualização:', error.message);
        if (error.data) console.error('Detalhes:', JSON.stringify(error.data));
    }
}

async function syncCollection(name, schema, existingCollections) {
    let col = existingCollections.find(c => c.name === name);
    const data = {
        name,
        type: 'base',
        schema,
        listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
    };

    if (!col) {
        console.log(`Criando collection "${name}"...`);
        await pb.collections.create(data);
    } else {
        console.log(`Atualizando schema da collection "${name}"...`);
        // Mesclamos o schema do sistema com o schema manual para não perder campos IDs do sistema
        await pb.collections.update(col.id, data);
    }
}

const [email, password] = process.argv.slice(2);
updateSchema(email, password);
