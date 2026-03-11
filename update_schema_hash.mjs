import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro/');

async function updateContratoSchemaHash() {
    try {
        console.log('Autenticando...');
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');
        
        console.log('Buscando coleção contratos...');
        const coll = await pb.collections.getOne('contratos');
        
        const currentFields = coll.fields || [];

        const newFields = [
            { 
                name: 'hash_autenticacao', 
                type: 'text',
                options: { min: null, max: null, pattern: '' }
            },
            {
                name: 'ip_assinatura',
                type: 'text',
                options: { min: null, max: null, pattern: '' }
            },
            {
                name: 'data_assinatura',
                type: 'date',
                options: { min: '', max: '' }
            }
        ];

        let updated = false;
        newFields.forEach(f => {
            if (!currentFields.find(s => s.name === f.name)) {
                currentFields.push(f);
                console.log(`Adicionando campo ${f.name}...`);
                updated = true;
            } else {
                console.log(`Campo ${f.name} já existe.`);
            }
        });

        if (updated) {
            console.log('Atualizando fields da coleção contratos...');
            await pb.collections.update(coll.id, { fields: currentFields });
            console.log('Coleção contratos atualizada com sucesso!');
        } else {
            console.log('Nenhuma atualização necessária.');
        }

    } catch (error) {
        console.error('Erro ao atualizar schema:', error.message);
        if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }
}

updateContratoSchemaHash();
