// src/lib/chatwoot.ts

const CHATWOOT_BASE_URL = 'https://sac.venturexp.pro';
const ACCOUNT_ID = '1';
const INBOX_ID = '5';
// O token de acesso precisa ser passado pelo .env para segurança
// Crie um arquivo .env na raiz do projeto e adicione: VITE_CHATWOOT_TOKEN=seu_token_aqui
const getApiToken = () => import.meta.env.VITE_CHATWOOT_TOKEN;

/**
 * Procura um contato no Chatwoot pelo telefone. Retorna o ID se encontrar.
 */
async function findContactByPhone(phone: string): Promise<number | null> {
  const token = getApiToken();
  if (!token) return null;

  try {
    // Busca pelo número de telefone (precisa estar no fomato +55...)
    const cleanPhone = phone.replace(/\D/g, '');
    let searchPhone = cleanPhone;
    if (searchPhone.length === 10 || searchPhone.length === 11) {
        searchPhone = `+55${searchPhone}`;
    } else if (!searchPhone.startsWith('+')) {
        searchPhone = `+${searchPhone}`;
    }

    const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/search?q=${encodeURIComponent(searchPhone)}`, {
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.payload && data.payload.length > 0) {
      return data.payload[0].id; // Retorna o ID do primeiro contato encontrado
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar contato no Chatwoot:', error);
    return null;
  }
}

/**
 * Cria um novo contato no Chatwoot
 */
async function createContact(name: string, phone: string, email?: string): Promise<number | null> {
  const token = getApiToken();
  if (!token) {
    console.warn("VITE_CHATWOOT_TOKEN não definido.");
    return null;
  }

  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.length === 10 || formattedPhone.length === 11) {
    formattedPhone = `+55${formattedPhone}`;
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+${formattedPhone}`;
  }

  try {
    const payload: any = {
      inbox_id: INBOX_ID,
      name: name,
      phone_number: formattedPhone,
    };
    if (email) payload.email = email;

    const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts`, {
      method: 'POST',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        console.error("Erro do Chatwoot (Create Contact):", await response.text());
        return null;
    }

    const data = await response.json();
    return data.payload?.contact?.id || null;
  } catch (error) {
    console.error('Erro ao criar contato no Chatwoot:', error);
    return null;
  }
}

/**
 * Cria ou recupera uma conversa (Conversation) com o Contact criado
 */
async function createConversation(contactId: number): Promise<number | null> {
  const token = getApiToken();
  if (!token) return null;

  try {
    const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations`, {
      method: 'POST',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_id: contactId.toString(), // The contact identifier
        inbox_id: INBOX_ID,
        contact_id: contactId,
        status: "open"
      })
    });

    if (!response.ok) {
        console.error("Erro do Chatwoot (Create Conversation):", await response.text());
        return null; // A conversa pode já existir, idealmente precisaríamos listar, mas criar tenta reaproveitar na API v1
    }

    const data = await response.json();
    return data.id || null;
  } catch (error) {
    console.error('Erro ao criar conversa no Chatwoot:', error);
    return null;
  }
}

/**
 * Envia uma mensagem em uma conversa específica
 */
async function sendMessage(conversationId: number, content: string): Promise<boolean> {
  const token = getApiToken();
  if (!token) return false;

  try {
    const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content,
        message_type: 'outgoing',
        private: false
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao enviar mensagem no Chatwoot:', error);
    return false;
  }
}

/**
 * Função utilitária global para disparar a mensagem via WhatsApp usando o Chatwoot
 * Fluxo: Buscar Contato -> Criar se não existir -> Criar Conversa -> Enviar Mensagem
 */
export async function sendChatwootWhatsApp(phone: string, name: string, message: string, email?: string): Promise<boolean> {
  if (!phone || !getApiToken()) {
      console.warn("Não é possível enviar a mensagem: Telefone ausente ou Token não configurado.");
      return false;
  }

  try {
    // 1. Tentar encontrar o contato existente
    let contactId = await findContactByPhone(phone);
    
    // 2. Criar se não existir
    if (!contactId) {
      contactId = await createContact(name, phone, email);
    }
    
    if (!contactId) {
        console.error("Falha ao obter Contact ID no Chatwoot");
        return false;
    }

    // 3. Criar e recuperar a conversa atual
    const conversationId = await createConversation(contactId);
    if (!conversationId) {
        console.error("Falha ao obter Conversation ID no Chatwoot");
        return false;
    }

    // 4. Enviar a mensagem
    return await sendMessage(conversationId, message);
    
  } catch (error) {
      console.error('Erro no fluxo principal do Chatwoot:', error);
      return false;
  }
}
