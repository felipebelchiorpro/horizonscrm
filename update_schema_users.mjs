import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro/');

async function updateUsersSchema() {
    try {
        console.log('Autenticando...');
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');
        
        console.log('Buscando coleção users...');
        const coll = await pb.collections.getOne('users');
        
        const currentFields = coll.fields || [];

        const newFields = [
            { 
                name: 'name', 
                type: 'text',
                options: { min: null, max: null, pattern: '' }
            },
            {
                name: 'avatar',
                type: 'file',
                options: {
                    maxSelect: 1, 
                    maxSize: 5242880, 
                    mimeTypes: ['image/jpeg', 'image/png']
                }
            },
            {
                name: 'role',
                type: 'select',
                maxSelect: 1,
                values: ['Admin', 'Corretor', 'Vendedor', 'Financeiro', 'Membro'],
                options: { maxSelect: 1, values: ['Admin', 'Corretor', 'Vendedor', 'Financeiro', 'Membro'] }
            },
            {
                name: 'telefone',
                type: 'text',
                options: { min: null, max: null, pattern: '' }
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
            console.log('Atualizando fields da coleção users...');
            await pb.collections.update(coll.id, { fields: currentFields });
            console.log('Coleção users atualizada com sucesso!');
        } else {
            console.log('Nenhuma atualização necessária na coleção users.');
        }

    } catch (error) {
        console.error('Erro ao atualizar schema users:', error.message);
        if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }
}

updateUsersSchema();
