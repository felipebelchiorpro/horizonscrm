import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro/');

async function updateUsersRules() {
    try {
        console.log('Autenticando...');
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');
        
        console.log('Buscando coleção users...');
        const coll = await pb.collections.getOne('users');
        
        // Define admin-friendly rules
        const adminRule = "@request.auth.role = 'Admin' || id = @request.auth.id";

        coll.listRule = adminRule;
        coll.viewRule = adminRule;
        coll.createRule = "@request.auth.role = 'Admin'";
        coll.updateRule = adminRule;
        coll.deleteRule = "@request.auth.role = 'Admin'";

        console.log('Atualizando regras da coleção users...');
        await pb.collections.update(coll.id, coll);
        console.log('Regras da coleção users atualizadas com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar regras users:', error.message);
        if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }
}

updateUsersRules();
