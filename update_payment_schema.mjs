import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backventure.venturexp.pro/');

async function updatePaymentFields() {
    try {
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');

        // 1. Update 'servicos' collection
        const servicosColl = await pb.collections.getOne('servicos');
        const servicosSchema = servicosColl.schema || [];

        if (!servicosSchema.find(s => s.name === 'condicao_pagamento')) {
            servicosSchema.push({
                name: 'condicao_pagamento',
                type: 'select',
                options: {
                    values: ['100% no final', '50% antes / 50% depois', '100% antecipado', 'Personalizado']
                }
            });
            await pb.collections.update(servicosColl.id, { schema: servicosSchema });
            console.log('Collection "servicos" updated with condicao_pagamento.');
        }

        // 2. Update 'contratos' collection
        const contratosColl = await pb.collections.getOne('contratos');
        const contratosSchema = contratosColl.schema || [];

        if (!contratosSchema.find(s => s.name === 'condicao_pagamento')) {
            contratosSchema.push({
                name: 'condicao_pagamento',
                type: 'select',
                options: {
                    values: ['100% no final', '50% antes / 50% depois', '100% antecipado', 'Personalizado']
                }
            });
            await pb.collections.update(contratosColl.id, { schema: contratosSchema });
            console.log('Collection "contratos" updated with condicao_pagamento.');
        }

    } catch (error) {
        console.error('Error updating schema:', error.message);
    }
}

updatePaymentFields();
