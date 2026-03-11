import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro');

async function updateSchema(email, password) {
    try {
        console.log('--- 🛡️ PocketBase Ultimate Schema Update (v0.23 Format) ---');

        await pb.admins.authWithPassword(email, password);
        console.log('✅ Autenticado!');

        const collections = await pb.collections.getFullList();

        // 1. Clientes
        const clientFields = [
            { name: 'id', type: 'text', system: true, primaryKey: true, autogeneratePattern: '[a-z0-9]{15}' },
            { name: 'nome', type: 'text', required: true, presentable: true },
            { name: 'documento', type: 'text' },
            { name: 'email', type: 'email' },
            { name: 'telefone', type: 'text' },
            { name: 'empresa', type: 'text' },
            { name: 'cargo', type: 'text' },
            { name: 'cep', type: 'text' },
            { name: 'endereco', type: 'text' },
            { name: 'cidade', type: 'text' },
            { name: 'estado', type: 'text' },
            { name: 'status', type: 'select', values: ['Lead', 'Prospect', 'Ativo', 'Inativo'] },
            { name: 'observacoes', type: 'text' },
            { name: 'created', type: 'autodate', system: true, onCreate: true },
            { name: 'updated', type: 'autodate', system: true, onCreate: true, onUpdate: true }
        ];

        const clientsColl = collections.find(c => c.name === 'clientes');
        if (clientsColl) {
            console.log('Atualizando "clientes"...');
            await pb.collections.update(clientsColl.id, {
                fields: clientFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        // 2. Negócios
        const negociosFields = [
            { name: 'id', type: 'text', system: true, primaryKey: true, autogeneratePattern: '[a-z0-9]{15}' },
            { name: 'cliente', type: 'relation', required: true, collectionId: clientsColl?.id, maxSelect: 1 },
            { name: 'titulo', type: 'text', required: true, presentable: true },
            { name: 'valor', type: 'number' },
            { name: 'etapa', type: 'select', values: ['Lead', 'Qualificado', 'Proposta', 'Negociação', 'Fechado', 'Perdido'] },
            { name: 'descricao', type: 'text' },
            { name: 'created', type: 'autodate', system: true, onCreate: true },
            { name: 'updated', type: 'autodate', system: true, onCreate: true, onUpdate: true }
        ];
        const negociosColl = collections.find(c => c.name === 'negocios');
        if (negociosColl) {
            console.log('Atualizando "negocios"...');
            await pb.collections.update(negociosColl.id, {
                fields: negociosFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        // 3. Contratos
        const contratosFields = [
            { name: 'id', type: 'text', system: true, primaryKey: true, autogeneratePattern: '[a-z0-9]{15}' },
            { name: 'cliente', type: 'relation', required: true, collectionId: clientsColl?.id, maxSelect: 1 },
            { name: 'titulo', type: 'text', required: true, presentable: true },
            { name: 'valor', type: 'number' },
            { name: 'status', type: 'select', values: ['Rascunho', 'Enviado', 'Assinado', 'Cancelado'] },
            { name: 'conteudo', type: 'text' },
            { name: 'data_assinatura', type: 'date' },
            { name: 'hash_assinatura', type: 'text' },
            { name: 'ip_assinatura', type: 'text' },
            { name: 'created', type: 'autodate', system: true, onCreate: true },
            { name: 'updated', type: 'autodate', system: true, onCreate: true, onUpdate: true }
        ];
        const contratosColl = collections.find(c => c.name === 'contratos');
        if (contratosColl) {
            console.log('Atualizando "contratos"...');
            await pb.collections.update(contratosColl.id, {
                fields: contratosFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        // 4. Ordens de Serviço
        const osFields = [
            { name: 'id', type: 'text', system: true, primaryKey: true, autogeneratePattern: '[a-z0-9]{15}' },
            { name: 'cliente', type: 'relation', required: true, collectionId: clientsColl?.id, maxSelect: 1 },
            { name: 'titulo', type: 'text', required: true, presentable: true },
            { name: 'descricao', type: 'text' },
            { name: 'valor', type: 'number' },
            { name: 'status', type: 'select', values: ['Pendente', 'Em Execução', 'Concluída', 'Cancelada'] },
            { name: 'data_inicio', type: 'date' },
            { name: 'data_fim', type: 'date' },
            { name: 'created', type: 'autodate', system: true, onCreate: true },
            { name: 'updated', type: 'autodate', system: true, onCreate: true, onUpdate: true }
        ];
        const osColl = collections.find(c => c.name === 'ordens_servico');
        if (osColl) {
            console.log('Atualizando "ordens_servico"...');
            await pb.collections.update(osColl.id, {
                fields: osFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        console.log('✅ Tudo atualizado e sincronizado!');
    } catch (e) {
        console.error('❌ Erro:', e.message);
        if (e.data) console.log(JSON.stringify(e.data, null, 2));
    }
}

const [email, password] = process.argv.slice(2);
updateSchema(email, password);
