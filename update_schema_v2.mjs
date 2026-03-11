import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro/');

async function recreateCollections() {
    try {
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');

        // 1. Create 'servicos' collection
        const servicosSchema = {
            name: 'servicos',
            type: 'base',
            schema: [
                { name: 'nome', type: 'text', required: true },
                { name: 'valor_padrao', type: 'number' },
                { name: 'descricao_padrao', type: 'text' }
            ],
            listRule: "",
            viewRule: "",
            createRule: "",
            updateRule: "",
            deleteRule: ""
        };

        let servicosId;
        try {
            const res = await pb.collections.create(servicosSchema);
            servicosId = res.id;
            console.log('Collection "servicos" created.');
        } catch (e) {
            const existing = await pb.collections.getOne('servicos');
            servicosId = existing.id;
            console.log('Collection "servicos" already exists.');
        }

        // 2. Update 'contratos' collection schema
        const contratosColl = await pb.collections.getOne('contratos');
        const currentSchema = contratosColl.schema || [];

        // Add new fields
        const newFields = [
            { name: 'hash_autenticacao', type: 'text' },
            { name: 'ip_assinatura', type: 'text' },
            { name: 'categoria_servico', type: 'relation', options: { collectionId: servicosId, maxSelect: 1 } }
        ];

        newFields.forEach(f => {
            if (!currentSchema.find(s => s.name === f.name)) {
                currentSchema.push(f);
            }
        });

        await pb.collections.update(contratosColl.id, {
            schema: currentSchema
        });
        console.log('Collection "contratos" updated with new authentication fields.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

recreateCollections();
