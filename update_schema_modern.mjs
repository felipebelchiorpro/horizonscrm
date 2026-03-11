import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro');

async function updateSchema(email, password) {
    try {
        console.log('--- 🛡️ PocketBase Modern Schema Update ---');

        await pb.admins.authWithPassword(email, password);
        console.log('✅ Autenticado!');

        const collections = await pb.collections.getFullList();

        // 1. Clientes
        const clientFields = [
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

        const clientsColl = collections.find(c => c.name === 'clientes');
        if (clientsColl) {
            console.log('Atualizando "clientes"...');
            await pb.collections.update(clientsColl.id, {
                fields: [
                    { name: 'id', type: 'text', system: true, primaryKey: true },
                    ...clientFields,
                    { name: 'created', type: 'autodate', system: true },
                    { name: 'updated', type: 'autodate', system: true }
                ],
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        // 2. Negócios
        const negociosFields = [
            { name: 'cliente', type: 'relation', required: true, options: { collectionId: clientsColl?.id, maxSelect: 1 } },
            { name: 'titulo', type: 'text', required: true },
            { name: 'valor', type: 'number' },
            { name: 'etapa', type: 'select', options: { values: ['Lead', 'Qualificado', 'Proposta', 'Negociação', 'Fechado', 'Perdido'] } },
            { name: 'descricao', type: 'text' }
        ];
        const negociosColl = collections.find(c => c.name === 'negocios');
        if (negociosColl) {
            console.log('Atualizando "negocios"...');
            await pb.collections.update(negociosColl.id, {
                fields: [
                    { name: 'id', type: 'text', system: true, primaryKey: true },
                    ...negociosFields,
                    { name: 'created', type: 'autodate', system: true },
                    { name: 'updated', type: 'autodate', system: true }
                ],
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        // 3. Contratos
        const contratosFields = [
            { name: 'cliente', type: 'relation', required: true, options: { collectionId: clientsColl?.id, maxSelect: 1 } },
            { name: 'titulo', type: 'text', required: true },
            { name: 'valor', type: 'number' },
            { name: 'status', type: 'select', options: { values: ['Rascunho', 'Enviado', 'Assinado', 'Cancelado'] } },
            { name: 'conteudo', type: 'text' },
            { name: 'data_assinatura', type: 'date' },
            { name: 'hash_assinatura', type: 'text' },
            { name: 'ip_assinatura', type: 'text' }
        ];
        const contratosColl = collections.find(c => c.name === 'contratos');
        if (contratosColl) {
            console.log('Atualizando "contratos"...');
            await pb.collections.update(contratosColl.id, {
                fields: [
                    { name: 'id', type: 'text', system: true, primaryKey: true },
                    ...contratosFields,
                    { name: 'created', type: 'autodate', system: true },
                    { name: 'updated', type: 'autodate', system: true }
                ],
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        // 4. Ordens de Serviço
        const osFields = [
            { name: 'cliente', type: 'relation', required: true, options: { collectionId: clientsColl?.id, maxSelect: 1 } },
            { name: 'titulo', type: 'text', required: true },
            { name: 'descricao', type: 'text' },
            { name: 'valor', type: 'number' },
            { name: 'status', type: 'select', options: { values: ['Pendente', 'Em Execução', 'Concluída', 'Cancelada'] } },
            { name: 'data_inicio', type: 'date' },
            { name: 'data_fim', type: 'date' }
        ];
        const osColl = collections.find(c => c.name === 'ordens_servico');
        if (osColl) {
            console.log('Atualizando "ordens_servico"...');
            await pb.collections.update(osColl.id, {
                fields: [
                    { name: 'id', type: 'text', system: true, primaryKey: true },
                    ...osFields,
                    { name: 'created', type: 'autodate', system: true },
                    { name: 'updated', type: 'autodate', system: true }
                ],
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        console.log('✅ Tudo atualizado!');
    } catch (e) {
        console.error('❌ Erro:', e.message);
        if (e.data) console.log(JSON.stringify(e.data, null, 2));
    }
}

const [email, password] = process.argv.slice(2);
updateSchema(email, password);
