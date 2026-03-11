import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro');

async function createProjectsSchema(email, password) {
    try {
        console.log('--- 🛡️ Criando Schema de Projetos (Bitrix Style) ---');

        await pb.admins.authWithPassword(email, password);
        console.log('✅ Autenticado!');

        const collections = await pb.collections.getFullList();
        
        // Obter as coleções de relacionamento necessárias
        const clientsColl = collections.find(c => c.name === 'clientes');
        const osColl = collections.find(c => c.name === 'ordens_servico');
        const usersColl = collections.find(c => c.name === 'users');
        const servicosColl = collections.find(c => c.name === 'servicos');

        if (!clientsColl) throw new Error('Coleção "clientes" não encontrada!');
        if (!usersColl) throw new Error('Coleção "users" não encontrada!');
        if (!servicosColl) throw new Error('Coleção "servicos" não encontrada!');

        // -------------------------------------------------------------
        // 1. Coleção PROJETOS
        // -------------------------------------------------------------
        console.log('⏳ Verificando coleção "projetos"...');
        const projetosFields = [
            { name: 'id', type: 'text', system: true, primaryKey: true, autogeneratePattern: '[a-z0-9]{15}' },
            { name: 'cliente', type: 'relation', required: true, collectionId: clientsColl.id, maxSelect: 1 },
            { name: 'os', type: 'relation', required: false, collectionId: osColl?.id, maxSelect: 1 },
            { name: 'responsavel', type: 'relation', required: false, collectionId: usersColl.id, maxSelect: 1 },
            { name: 'titulo', type: 'text', required: true, presentable: true },
            { name: 'descricao', type: 'text' },
            { name: 'categoria', type: 'select', values: ['Desenvolvimento', 'Design', 'Marketing', 'Consultoria', 'Outros'] },
            { name: 'subcategoria', type: 'text' },
            { name: 'status', type: 'select', values: ['Não Iniciado', 'Em Andamento', 'Aguardando Cliente', 'Concluído', 'Cancelado'] },
            { name: 'valor_hora', type: 'number' },
            { name: 'data_inicio', type: 'date' },
            { name: 'data_entrega', type: 'date' },
            { name: 'created', type: 'autodate', system: true, onCreate: true },
            { name: 'updated', type: 'autodate', system: true, onCreate: true, onUpdate: true }
        ];

        let projetosColl = collections.find(c => c.name === 'projetos');
        if (projetosColl) {
            console.log('Atualizando "projetos"...');
            await pb.collections.update(projetosColl.id, {
                fields: projetosFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        } else {
            console.log('Criando "projetos"...');
            projetosColl = await pb.collections.create({
                name: 'projetos',
                type: 'base',
                fields: projetosFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }


        // -------------------------------------------------------------
        // 2. Coleção HORAS_PROJETO (Time Tracking)
        // -------------------------------------------------------------
        console.log('⏳ Verificando coleção "horas_projeto"...');
        const horasFields = [
            { name: 'id', type: 'text', system: true, primaryKey: true, autogeneratePattern: '[a-z0-9]{15}' },
            { name: 'projeto', type: 'relation', required: true, collectionId: projetosColl.id, maxSelect: 1 },
            { name: 'responsavel', type: 'relation', required: false, collectionId: usersColl.id, maxSelect: 1 },
            { name: 'data', type: 'date', required: true },
            { name: 'minutos_gastos', type: 'number', required: true }, // Gravar em minutos
            { name: 'descricao', type: 'text', required: true },
            { name: 'faturado', type: 'bool' }, // Marcar se foi cobrado
            { name: 'created', type: 'autodate', system: true, onCreate: true },
            { name: 'updated', type: 'autodate', system: true, onCreate: true, onUpdate: true }
        ];

        let horasColl = collections.find(c => c.name === 'horas_projeto');
        if (horasColl) {
             console.log('Atualizando "horas_projeto"...');
             await pb.collections.update(horasColl.id, {
                fields: horasFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        } else {
             console.log('Criando "horas_projeto"...');
             horasColl = await pb.collections.create({
                name: 'horas_projeto',
                type: 'base',
                fields: horasFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        // -------------------------------------------------------------
        // 3. Coleção SERVICOS_LANCADOS (Serviços avulsos no projeto/OS)
        // -------------------------------------------------------------
        console.log('⏳ Verificando coleção "servicos_lancados"...');
        const servicosLancadosFields = [
            { name: 'id', type: 'text', system: true, primaryKey: true, autogeneratePattern: '[a-z0-9]{15}' },
            { name: 'projeto', type: 'relation', required: false, collectionId: projetosColl.id, maxSelect: 1 },
            { name: 'os', type: 'relation', required: false, collectionId: osColl?.id, maxSelect: 1 },
            { name: 'servico', type: 'relation', required: true, collectionId: servicosColl.id, maxSelect: 1 },
            { name: 'quantidade', type: 'number', required: true },
            { name: 'valor_unitario', type: 'number', required: true },
            { name: 'valor_total', type: 'number', required: true }, // Qtde * Vlr Unit
            { name: 'observacao', type: 'text' },
            { name: 'faturado', type: 'bool' }, // Marcar se foi cobrado
            { name: 'created', type: 'autodate', system: true, onCreate: true },
            { name: 'updated', type: 'autodate', system: true, onCreate: true, onUpdate: true }
        ];

        let servicosLancadosColl = collections.find(c => c.name === 'servicos_lancados');
        if (servicosLancadosColl) {
            console.log('Atualizando "servicos_lancados"...');
             await pb.collections.update(servicosLancadosColl.id, {
                fields: servicosLancadosFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        } else {
             console.log('Criando "servicos_lancados"...');
             servicosLancadosColl = await pb.collections.create({
                name: 'servicos_lancados',
                type: 'base',
                fields: servicosLancadosFields,
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
            });
        }

        console.log('✅ Novas tabelas criadas com sucesso!');

    } catch (e) {
        console.error('❌ Erro:', e.message);
        if (e.data) console.log(JSON.stringify(e.data, null, 2));
    }
}

const [email, password] = process.argv.slice(2);

if (!email || !password) {
    console.error('Por favor, informe email e senha rodando: node update_schema_projetos.mjs user@email.com senha123');
    process.exit(1);
}

createProjectsSchema(email, password);
