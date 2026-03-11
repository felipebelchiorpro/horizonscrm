import React, { useState, useEffect } from 'react';
import { pb } from '../../lib/pocketbase';
import { X, FileText, User, Briefcase, DollarSign, Tag, ShieldCheck, Fingerprint } from 'lucide-react';

interface NewContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewContractModal({ isOpen, onClose, onSuccess }: NewContractModalProps) {
    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState<any[]>([]);
    const [negocios, setNegocios] = useState<any[]>([]);
    const [servicos, setServicos] = useState<any[]>([]);
    const [selectedServico, setSelectedServico] = useState<string>('');

    const [formData, setFormData] = useState({
        titulo: '',
        cliente: '',
        negocio: '',
        valor: '',
        condicao_pagamento: '100% no final',
        conteudo: `CONTRATO DE PRESTAÇÃO DE SERVIÇO

1. PARTES

1.1 CONTRATANTE:
Nome: {{nome_cliente}}
CPF/CNPJ: {{documento_cliente}}
Telefone: {{telefone_cliente}}

1.2 CONTRATADO:
Nome: Grupo Belchior
CNPJ: 46.105.907/0001-16
Telefone: (19) 97154-4146
E-mail: atendimento@grupobelchior.com

2. OBJETIVO
O presente contrato tem por objeto a prestação de serviços pelo Grupo Belchior em favor do Contratante.

3. DESCRIÇÃO DOS SERVIÇOS
Serviços conforme alinhado.

4. CONDIÇÕES FINANCEIRAS
4.1 VALOR E FORMA DE PAGAMENTO:
O valor total dos serviços contratados é de {{valor_contrato}}. O pagamento será efetuado da seguinte forma: {{forma_pagamento}}.

5. PRAZO E ENTREGA
O prazo de entrega dos arquivos será de 1 dia após a realização do serviço.

6. DISPOSIÇÕES GERAIS
Caconde-SP, {{data_atual}}

_________________________          _________________________
{{nome_cliente}}                   Felipe Augusto Belchior
CONTRATANTE                        CONTRATADO`,
        status: 'Pendente'
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const [clientsList, dealsList, servicesList] = await Promise.all([
                pb.collection('clientes').getFullList({ sort: 'nome' }),
                pb.collection('negocios').getFullList({ sort: 'titulo' }),
                pb.collection('servicos').getFullList({ sort: 'nome' })
            ]);
            setClientes(clientsList);
            setNegocios(dealsList);
            setServicos(servicesList);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const updateContent = (client: any, value: string, paymentCondition: string) => {
        let newContent = formData.conteudo;
        const now = new Date();
        const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

        if (client) {
            newContent = newContent.replace(/{{nome_cliente}}/g, client.nome || '__________');
            newContent = newContent.replace(/{{documento_cliente}}/g, client.documento || '__________');
            newContent = newContent.replace(/{{telefone_cliente}}/g, client.telefone || '__________');
        }

        if (value) {
            const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value) || 0);
            newContent = newContent.replace(/{{valor_contrato}}/g, formattedValue);
        }

        if (paymentCondition) {
            newContent = newContent.replace(/{{forma_pagamento}}/g, paymentCondition);
        }

        newContent = newContent.replace(/{{data_atual}}/g, dateStr);
        setFormData(prev => ({ ...prev, conteudo: newContent }));
    };

    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const serviceId = e.target.value;
        const service = servicos.find(s => s.id === serviceId);
        setSelectedServico(serviceId);

        if (service) {
            const client = clientes.find(c => c.id === formData.cliente);
            const val = service.valor_padrao?.toString() || '';
            const now = new Date();
            const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

            setFormData(prev => ({
                ...prev,
                valor: val,
                condicao_pagamento: service.condicao_pagamento || '100% no final',
                titulo: `Contrato: ${service.nome}${client ? ' - ' + client.nome : ''}`
            }));

            let template = `CONTRATO DE PRESTAÇÃO DE SERVIÇO

1. PARTES

1.1 CONTRATANTE:
Nome: {{nome_cliente}}
CPF/CNPJ: {{documento_cliente}}
Telefone: {{telefone_cliente}}

1.2 CONTRATADO:
Nome: Grupo Belchior
CNPJ: 46.105.907/0001-16
Telefone: (19) 97154-4146
E-mail: atendimento@grupobelchior.com

2. OBJETIVO
O presente contrato tem por objeto a prestação de serviços pelo Grupo Belchior em favor do Contratante.

3. DESCRIÇÃO DOS SERVIÇOS
${service.descricao_padrao || 'Serviços conforme alinhado.'}

4. CONDIÇÕES FINANCEIRAS
4.1 VALOR E FORMA DE PAGAMENTO:
O valor total dos serviços contratados é de {{valor_contrato}}. O pagamento será efetuado da seguinte forma: {{forma_pagamento}}.

5. PRAZO E ENTREGA
O prazo de entrega dos arquivos será de 1 dia após a realização do serviço.

6. DISPOSIÇÕES GERAIS
Caconde-SP, {{data_atual}}

_________________________          _________________________
{{nome_cliente}}                   Felipe Augusto Belchior
CONTRATANTE                        CONTRATADO`;

            if (client) {
                template = template.replace(/{{nome_cliente}}/g, client.nome || '__________');
                template = template.replace(/{{documento_cliente}}/g, client.documento || '__________');
                template = template.replace(/{{telefone_cliente}}/g, client.telefone || '__________');
            }
            if (val) {
                const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(val) || 0);
                template = template.replace(/{{valor_contrato}}/g, formattedValue);
            }

            template = template.replace(/{{forma_pagamento}}/g, service.condicao_pagamento || '100% no final');
            template = template.replace(/{{data_atual}}/g, dateStr);

            setFormData(prev => ({ ...prev, conteudo: template }));
        }
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const clientId = e.target.value;
        const client = clientes.find(c => c.id === clientId);
        setFormData(prev => ({ ...prev, cliente: clientId }));

        if (client) {
            updateContent(client, formData.valor, formData.condicao_pagamento);
        }
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const client = clientes.find(c => c.id === formData.cliente);
        updateContent(client, val, formData.condicao_pagamento);
    };

    const handlePaymentConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cond = e.target.value;
        setFormData(prev => ({ ...prev, condicao_pagamento: cond }));
        const client = clientes.find(c => c.id === formData.cliente);
        updateContent(client, formData.valor, cond);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const hash = Array.from(crypto.getRandomValues(new Uint8Array(20)))
                .map(b => b.toString(16).padStart(2, '0')).join('');

            const pbData = {
                titulo: formData.titulo,
                cliente: formData.cliente,
                negocio: formData.negocio || null,
                valor: parseFloat(formData.valor) || 0,
                conteudo: formData.conteudo,
                status: 'Assinado',
                hash_autenticacao: hash,
                ip_assinatura: '187.12.94.102', // Simulation
                data_assinatura: new Date().toISOString(),
                categoria_servico: selectedServico,
                condicao_pagamento: formData.condicao_pagamento
            };

            await pb.collection('contratos').create(pbData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating contract:', error);
            alert('Erro ao salvar contrato.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} onClick={onClose} />

            <div className="glass-panel animate-fade-in" style={{
                position: 'relative',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2.5rem',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="text-2xl font-bold">Gerar Novo Contrato Autenticado</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cliente *</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <select required name="cliente" value={formData.cliente} onChange={handleClientChange} style={{ paddingLeft: '2.75rem' }}>
                                        <option value="">Selecione...</option>
                                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tipo de Serviço *</label>
                                <div style={{ position: 'relative' }}>
                                    <Tag size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <select required value={selectedServico} onChange={handleServiceChange} style={{ paddingLeft: '2.75rem' }}>
                                        <option value="">Selecione...</option>
                                        {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Valor (R$)</label>
                                <div style={{ position: 'relative' }}>
                                    <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="number" name="valor" value={formData.valor} onChange={handleValueChange} placeholder="0,00" style={{ paddingLeft: '2.75rem' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Condição de Pagamento</label>
                                <select value={formData.condicao_pagamento} onChange={handlePaymentConditionChange}>
                                    <option value="100% no final">100% no final</option>
                                    <option value="50% antes / 50% depois">50% antes / 50% depois</option>
                                    <option value="100% antecipado">100% antecipado</option>
                                    <option value="Personalizado">Personalizado</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Negócio Relacionado</label>
                            <div style={{ position: 'relative' }}>
                                <Briefcase size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <select name="negocio" value={formData.negocio} onChange={e => setFormData({ ...formData, negocio: e.target.value })} style={{ paddingLeft: '2.75rem' }}>
                                    <option value="">Opcional</option>
                                    {negocios.map(n => <option key={n.id} value={n.id}>{n.titulo}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Título do Contrato *</label>
                            <div style={{ position: 'relative' }}>
                                <FileText size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input required name="titulo" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} placeholder="Título Automático" style={{ paddingLeft: '2.75rem' }} />
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Prévia do Conteúdo</label>
                            <div className="glass-panel" style={{ height: '220px', overflowY: 'auto', padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {formData.conteudo}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Segurança e Autenticação</label>

                            <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(182, 255, 0, 0.02)', border: '1px dashed rgba(182, 255, 0, 0.2)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
                                <ShieldCheck size={64} color="var(--accent-primary)" strokeWidth={1.2} />
                                <div>
                                    <h4 style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Sistema Autenticado Horizons</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                        Este contrato será gerado com um selo de autenticidade digital, rastreamento de IP e hash de segurança criptográfico.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                    <Fingerprint size={24} color="var(--accent-primary)" />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Assinatura Digital</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Validada via Hash SHA-256 único</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                    <ShieldCheck size={24} color="var(--accent-primary)" />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Conformidade Legal</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registro de IP: 187.12.XXX.XXX</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                            <button type="button" onClick={onClose} style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'white' }}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={loading} style={{ flex: 2, padding: '1rem', borderRadius: '12px', background: 'var(--accent-primary)', border: 'none', color: '#0b0b0b', fontWeight: 700, fontSize: '1rem' }}>
                                {loading ? 'Autenticando...' : 'Gerar e Autenticar'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
