import { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Plus, Search, ShieldCheck, Clock, CheckCircle, XCircle, Download, DollarSign, MessageSquare, BellRing, AlertTriangle } from 'lucide-react';
import { NewOSModal } from '../components/ordens/NewOSModal';
import { jsPDF } from 'jspdf';
import { sendChatwootWhatsApp } from '../lib/chatwoot';

export interface OrdemServico {
    id: string;
    titulo: string;
    cliente: string;
    valor: number;
    status: 'Pendente' | 'Em Execução' | 'Concluída' | 'Cancelada';
    status_pagamento?: 'Pendente' | 'Pago';
    comprovante?: string;
    descricao: string;
    data_inicio: string;
    data_fim?: string;
    created: string;
    expand?: {
        cliente?: { nome: string; empresa: string; documento?: string; telefone?: string; endereco?: string; cidade?: string; estado?: string; email?: string };
    };
}

export function OrdensServico() {
    const [ordens, setOrdens] = useState<OrdemServico[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sendingWpp, setSendingWpp] = useState<string | null>(null);
    const [togglingPaymentId, setTogglingPaymentId] = useState<string | null>(null);

    const fetchOrdens = async () => {
        try {
            setLoading(true);
            const records = await pb.collection('ordens_servico').getFullList<OrdemServico>({
                sort: '-created',
                expand: 'cliente'
            });
            setOrdens(records);
        } catch (error) {
            console.error('Error fetching OS:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdens();
    }, []);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Concluída': return { label: 'Concluída', color: '#B6FF00', bg: 'rgba(182, 255, 0, 0.1)', icon: <CheckCircle size={14} /> };
            case 'Em Execução': return { label: 'Em Execução', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <Clock size={14} /> };
            case 'Pendente': return { label: 'Pendente', color: '#FFB800', bg: 'rgba(255, 184, 0, 0.1)', icon: <Clock size={14} /> };
            case 'Cancelada': return { label: 'Cancelada', color: '#FF4D4D', bg: 'rgba(255, 77, 77, 0.1)', icon: <XCircle size={14} /> };
            default: return { label: status, color: '#FFF', bg: 'rgba(255, 255, 255, 0.1)', icon: null };
        }
    };

    const togglePaymentStatus = async (os: OrdemServico) => {
        const newStatus = os.status_pagamento === 'Pago' ? 'Pendente' : 'Pago';
        setTogglingPaymentId(os.id);
        try {
            await pb.collection('ordens_servico').update(os.id, { status_pagamento: newStatus });
            await fetchOrdens();
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Erro ao atualizar status de pagamento.');
        } finally {
            setTogglingPaymentId(null);
        }
    };

    const generateInvoicePDF = (os: OrdemServico) => {
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - (margin * 2);

        const darkBlue = [11, 37, 69] as [number, number, number];
        const lightBlue = [70, 100, 140] as [number, number, number];
        const ventureGreen = [0, 200, 0] as [number, number, number];

        let currentY = 20;

        // Logo Checkmark
        doc.setFillColor(11, 11, 11);
        doc.roundedRect(margin, currentY, 14, 14, 2, 2, "F");
        doc.setDrawColor(...ventureGreen);
        doc.setLineWidth(1.5);
        doc.line(margin + 4, currentY + 7, margin + 7, currentY + 10);
        doc.line(margin + 7, currentY + 10, margin + 11, currentY + 4);

        // Header
        doc.setTextColor(11, 11, 11);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("VENTURE", margin + 18, currentY + 10);

        doc.setFontSize(8);
        doc.setTextColor(...lightBlue);
        doc.setFont("helvetica", "bold");
        doc.text("FATURA DE SERVIÇOS", pageWidth - margin, currentY + 5, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text(`FATURA Nº. ${os.id.toUpperCase()}`, pageWidth - margin, currentY + 10, { align: "right" });

        currentY += 25;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 15;

        // Billed To
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("FATURADO PARA:", margin, currentY);
        currentY += 6;

        doc.setFontSize(11);
        doc.setTextColor(...darkBlue);
        doc.setFont("helvetica", "bold");
        doc.text(os.expand?.cliente?.nome || 'Cliente não especificado', margin, currentY);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");
        currentY += 5;
        if (os.expand?.cliente?.documento) { doc.text(`CPF/CNPJ: ${os.expand?.cliente?.documento}`, margin, currentY); currentY += 5; }
        if (os.expand?.cliente?.telefone) { doc.text(`Tel: ${os.expand?.cliente?.telefone}`, margin, currentY); currentY += 5; }

        currentY += 10;
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 15;

        // Invoice Details
        doc.setFontSize(10);
        doc.setTextColor(...darkBlue);
        doc.setFont("helvetica", "bold");
        doc.text("DESCRIÇÃO DO SERVIÇO", margin, currentY);
        currentY += 8;

        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "normal");
        doc.text(os.titulo, margin, currentY);
        currentY += 6;

        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const descText = doc.splitTextToSize(os.descricao || 'Sem descrição detalhada.', contentWidth);
        doc.text(descText, margin, currentY);
        currentY += (descText.length * 5) + 15;

        // Total
        const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor || 0);
        
        doc.setFillColor(248, 249, 250);
        doc.rect(margin, currentY, contentWidth, 20, "F");
        
        doc.setFontSize(11);
        doc.setTextColor(...darkBlue);
        doc.setFont("helvetica", "bold");
        doc.text("Total Devido:", margin + 5, currentY + 13);
        
        doc.setFontSize(14);
        doc.setTextColor(...ventureGreen);
        doc.text(valorFormatado, pageWidth - margin - 5, currentY + 13, { align: "right" });

        currentY += 35;

        // Payment Status
        doc.setFontSize(10);
        if (os.status_pagamento === 'Pago') {
            doc.setTextColor(...ventureGreen);
            doc.text("[ PAGAMENTO CONFIRMADO ]", margin, currentY);
        } else {
            doc.setTextColor(220, 50, 50);
            doc.text("STATUS: PENDENTE DE PAGAMENTO", margin, currentY);
        }

        doc.save(`Fatura_${os.titulo.replace(/\s+/g, '_')}.pdf`);
    };

    const handleSendWhatsApp = async (os: OrdemServico, type: 'nova' | 'perto_vencer' | 'vencida') => {
        const clientPhone = os.expand?.cliente?.telefone;
        const clientName = os.expand?.cliente?.nome;

        if (!clientPhone) {
            alert('Este cliente não possui telefone cadastrado.');
            return;
        }

        setSendingWpp(os.id);
        
        try {
            const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor || 0);
            const firstName = clientName ? clientName.split(' ')[0] : 'Cliente';
            let message = '';

            if (type === 'nova') {
                message = `${firstName}, espero que esteja tudo sensacional por aí! 🌟\n\nA Fatura do nosso projeto "${os.titulo}" (${valorFormatado}) já foi geradíssima e está pronta pra você! ✅🚀\n\nSe quiser conferir e tiver alguma dúvida, pode mandar mensagem aqui mesmo! Muito obrigado pela parceria! 🤝`;
            } else if (type === 'perto_vencer') {
                message = `Fala ${firstName}, tudo bem? Passando rapidinho pra lembrar que a fatura do projeto "${os.titulo}" no valor de ${valorFormatado} vence nos próximos dias! 📅⏱️\n\nQualquer dúvida estou à disposição por aqui! Tamo junto! 🚀`;
            } else if (type === 'vencida') {
                message = `Olá ${firstName}, espero que esteja tudo bem!\n\nNotamos por aqui que a fatura referente ao projeto "${os.titulo}" (${valorFormatado}) consta como pendente. Houve algum imprevisto? 🤔⚠️\n\nQualquer coisa me avisa por aqui que conversamos, fechou? Abração! 👊`;
            }
            
            const success = await sendChatwootWhatsApp(clientPhone, clientName || 'Cliente', message, os.expand?.cliente?.email);
            
            if (success) {
                alert('Mensagem enviada com sucesso via WhatsApp!');
            } else {
                alert('Erro ao enviar mensagem pelo Chatwoot. Verifique as configurações no console.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro inesperado ao enviar mensagem.');
        } finally {
            setSendingWpp(null);
        }
    };

    const filteredOrdens = ordens.filter(o =>
        o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.expand?.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 0.5rem' }}>
                    <div>
                        <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                            Ordens de <span className="text-gradient">Serviço</span>
                        </h1>
                        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Controle a execução de seus projetos e entregas.</p>
                    </div>

                    <button onClick={() => setIsModalOpen(true)} className="glass-panel" style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px solid rgba(182, 255, 0, 0.3)', background: 'var(--accent-primary)', color: '#0b0b0b', fontWeight: 600 }}>
                        <Plus size={18} strokeWidth={2} /> Nova OS
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por título ou cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.75rem', width: '100%' }}
                        />
                    </div>

                    <div className="custom-scrollbar" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Ordem de Serviço</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Cliente</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Valor</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Status OS</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Pagamento</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrdens.map((os) => {
                                    const status = getStatusStyle(os.status);
                                    return (
                                        <tr key={os.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="hover:bg-[rgba(255,255,255,0.02)]">
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(182, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                                        <ShieldCheck size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{os.titulo}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{os.descricao}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{os.expand?.cliente?.nome}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{os.expand?.cliente?.empresa}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor || 0)}
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    background: status.bg,
                                                    color: status.color
                                                }}>
                                                    {status.icon} {status.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <button
                                                    onClick={() => togglePaymentStatus(os)}
                                                    disabled={togglingPaymentId === os.id}
                                                    title={os.status_pagamento === 'Pago' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                                                    style={{
                                                        background: os.status_pagamento === 'Pago' ? 'rgba(182, 255, 0, 0.1)' : 'rgba(255, 184, 0, 0.07)',
                                                        border: os.status_pagamento === 'Pago' ? '1px solid rgba(182, 255, 0, 0.3)' : '1px solid rgba(255, 184, 0, 0.3)',
                                                        color: os.status_pagamento === 'Pago' ? '#B6FF00' : '#FFB800',
                                                        padding: '0.3rem 0.75rem',
                                                        borderRadius: '20px',
                                                        cursor: togglingPaymentId === os.id ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        opacity: togglingPaymentId === os.id ? 0.5 : 1,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem'
                                                    }}
                                                    className="transition-all"
                                                >
                                                    {os.status_pagamento === 'Pago' ? <CheckCircle size={13} /> : <Clock size={13} />}
                                                    {os.status_pagamento === 'Pago' ? 'Pago' : 'Pendente'}
                                                </button>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button onClick={() => handleSendWhatsApp(os, 'nova')} disabled={sendingWpp === os.id} title="Enviar Fatura (WhatsApp)" style={{ background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)', color: '#25D366', padding: '0.5rem', borderRadius: '8px', cursor: sendingWpp === os.id ? 'not-allowed' : 'pointer', opacity: sendingWpp === os.id ? 0.5 : 1 }} className="hover:bg-[rgba(37, 211, 102, 0.2)] transition-colors">
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    <button onClick={() => handleSendWhatsApp(os, 'perto_vencer')} disabled={sendingWpp === os.id} title="Avisar Vencimento Próximo (WhatsApp)" style={{ background: 'rgba(255, 184, 0, 0.1)', border: '1px solid rgba(255, 184, 0, 0.2)', color: '#FFB800', padding: '0.5rem', borderRadius: '8px', cursor: sendingWpp === os.id ? 'not-allowed' : 'pointer', opacity: sendingWpp === os.id ? 0.5 : 1 }} className="hover:bg-[rgba(255, 184, 0, 0.2)] transition-colors">
                                                        <BellRing size={16} />
                                                    </button>
                                                    <button onClick={() => handleSendWhatsApp(os, 'vencida')} disabled={sendingWpp === os.id} title="Cobrar Fatura Vencida (WhatsApp)" style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.2)', color: '#FF4D4D', padding: '0.5rem', borderRadius: '8px', cursor: sendingWpp === os.id ? 'not-allowed' : 'pointer', opacity: sendingWpp === os.id ? 0.5 : 1 }} className="hover:bg-[rgba(255, 77, 77, 0.2)] transition-colors">
                                                        <AlertTriangle size={16} />
                                                    </button>

                                                    <button onClick={() => generateInvoicePDF(os)} title="Gerar Fatura" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }} className="hover:bg-[rgba(59, 130, 246, 0.2)] transition-colors">
                                                        <Download size={16} />
                                                    </button>
                                                    


                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredOrdens.length === 0 && !loading && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Nenhuma ordem de serviço encontrada.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <NewOSModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchOrdens}
            />


        </>
    );
}
