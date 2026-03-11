import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro/');

async function setAdminAcesso() {
    try {
        console.log('Autenticando...');
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');
        
        console.log('Buscando usuário: contatofelipebelchior@gmail.com');
        const user = await pb.collection('users').getFirstListItem("email = 'contatofelipebelchior@gmail.com'");
        
        if (user) {
            console.log('Usuário encontrado:', user.id);
            console.log('Atualizando para Admin...');
            
            await pb.collection('users').update(user.id, {
                role: 'Admin'
            });
            
            console.log('Permissão de Admin concedida com sucesso para', user.email);
        } else {
            console.log('Usuário não encontrado!');
        }
    } catch (error) {
        console.error('Erro ao buscar o usuário ou atualizar permissão:', error.message);
        if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }
}

setAdminAcesso();
