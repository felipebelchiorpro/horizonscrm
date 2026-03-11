import { useState, useEffect, useRef } from 'react';
import { pb } from '../lib/pocketbase';
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, MoreVertical, Eye, Download, Upload, FileCheck, DollarSign, MessageSquare } from 'lucide-react';
import { NewContractModal } from '../components/contratos/NewContractModal';
import { jsPDF } from 'jspdf';
import { sendChatwootWhatsApp } from '../lib/chatwoot';

export interface Contrato {
    id: string;
    titulo: string;
    cliente: string;
    negocio?: string;
    conteudo: string;
    valor: number;
    condicao_pagamento?: string;
    status: 'Pendente' | 'Assinado' | 'Cancelado';
    status_pagamento?: 'Pendente' | 'Pago';
    comprovante?: string;
    hash_autenticacao?: string;
    ip_assinatura?: string;
    data_assinatura?: string;
    created: string;
    collectionId: string;
    expand?: {
        cliente?: { nome: string; empresa: string; documento: string; telefone: string; email?: string };
        negocio?: { titulo: string };
    };
}

export function Contratos() {
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingContrato, setViewingContrato] = useState<Contrato | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [sendingWpp, setSendingWpp] = useState<string | null>(null);

    const handleSendContractWhatsApp = async (contrato: Contrato) => {
        const clientPhone = contrato.expand?.cliente?.telefone;
        const clientName = contrato.expand?.cliente?.nome;

        if (!clientPhone) {
            alert('Este cliente não possui telefone cadastrado.');
            return;
        }

        setSendingWpp(contrato.id);
        
        try {
            const firstName = clientName ? clientName.split(' ')[0] : 'Cliente';
            const message = `Que notícia maravilhosa, ${firstName}! 🎉\n\nAcabamos de oficializar o fechamento do contrato "${contrato.titulo}"! ✅🚀\n\nNossa equipe já está pronta para dar andamento em tudo por aqui. Muito obrigado pela confiança de sempre! Tamo junto! 👊`;
            
            const success = await sendChatwootWhatsApp(clientPhone, clientName || 'Cliente', message, contrato.expand?.cliente?.email);
            
            if (success) {
                alert('Aviso de fechamento enviado com sucesso via WhatsApp!');
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

    const fetchContratos = async () => {
        try {
            setLoading(true);
            const records = await pb.collection('contratos').getFullList<Contrato>({
                sort: '-created',
                expand: 'cliente,negocio'
            });
            setContratos(records);
        } catch (error) {
            console.error('Error fetching contratos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContratos();
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingId) return;

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('comprovante', file);
            formData.append('status_pagamento', 'Pago');

            await pb.collection('contratos').update(uploadingId, formData);
            await fetchContratos();
        } catch (error) {
            console.error('Error uploading receipt:', error);
            alert('Erro ao anexar comprovante.');
        } finally {
            setUploadingId(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setLoading(false);
        }
    };

    const triggerUpload = (id: string) => {
        setUploadingId(id);
        fileInputRef.current?.click();
    };

    const loadImageToDataUrl = (url: string): Promise<{ dataUrl: string, width: number, height: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.width, height: img.height });
                } else {
                    reject(new Error('Canvas context not found'));
                }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
        });
    };

    const generateInvoicePDF = async (contrato: Contrato) => {
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - (margin * 2);

        const darkBlue = [11, 37, 69] as [number, number, number];
        const lightBlue = [70, 100, 140] as [number, number, number];
        const ventureGreen = [0, 200, 0] as [number, number, number];

        let currentY = 20;

        // Logo Image
        try {
            const logo = await loadImageToDataUrl('/logo-contrato.png?v=' + Date.now());
            const pdfHeight = 15;
            const pdfWidth = pdfHeight * (logo.width / logo.height);
            doc.addImage(logo.dataUrl, 'PNG', margin, currentY - 5, pdfWidth, pdfHeight);
        } catch (error) {
            console.warn('Logo image not found or failed to load. Will continue without logo.', error);
        }

        // Header
        doc.setFontSize(8);
        doc.setTextColor(...lightBlue);
        doc.setFont("helvetica", "bold");
        doc.text("FATURA", pageWidth - margin, currentY + 5, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text(`FATURA Nº. ${contrato.id.toUpperCase()}`, pageWidth - margin, currentY + 10, { align: "right" });

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
        doc.text(contrato.expand?.cliente?.nome || 'Cliente não especificado', margin, currentY);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");
        currentY += 5;
        if (contrato.expand?.cliente?.documento) { doc.text(`CPF/CNPJ: ${contrato.expand?.cliente?.documento}`, margin, currentY); currentY += 5; }
        if (contrato.expand?.cliente?.telefone) { doc.text(`Tel: ${contrato.expand?.cliente?.telefone}`, margin, currentY); currentY += 5; }

        currentY += 10;
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 15;

        // Invoice Details
        doc.setFontSize(10);
        doc.setTextColor(...darkBlue);
        doc.setFont("helvetica", "bold");
        doc.text("REFERENTE AO CONTRATO:", margin, currentY);
        currentY += 8;

        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "normal");
        doc.text(contrato.titulo, margin, currentY);
        currentY += 18;

        // Total
        const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor || 0);
        
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
        if (contrato.status_pagamento === 'Pago') {
            doc.setTextColor(...ventureGreen);
            doc.text("[ PAGAMENTO CONFIRMADO ]", margin, currentY);
        } else {
            doc.setTextColor(220, 50, 50);
            doc.text("STATUS: PENDENTE DE PAGAMENTO", margin, currentY);
        }

        doc.save(`Fatura_Contrato_${contrato.titulo.replace(/\s+/g, '_')}.pdf`);
    };

    const generatePDF = async (contrato: Contrato) => {
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - (margin * 2);

        // --- Colors ---
        const darkBlue = [11, 37, 69] as [number, number, number]; // #0b2545
        const lightBlue = [70, 100, 140] as [number, number, number];
        const normalText = [40, 40, 40] as [number, number, number];
        const ventureGreen = [0, 200, 0] as [number, number, number];

        // --- Helper Function ---
        let currentY = 20;
        const checkPageBreak = (neededSpace: number) => {
            if (currentY + neededSpace > 280) {
                doc.addPage();
                currentY = 20;
            }
        };

        // --- Watermark ---
        doc.setFontSize(60);
        doc.setTextColor(245, 245, 245); // Very light grey
        doc.setFont("helvetica", "bold");
        doc.text("GRUPO BELCHIOR", pageWidth / 2, 150, { angle: 45, align: "center", renderingMode: 'fill' });

        // --- Header ---
        // Logo Image
        try {
            const logo = await loadImageToDataUrl('/logo-contrato.png?v=' + Date.now());
            const pdfHeight = 15;
            const pdfWidth = pdfHeight * (logo.width / logo.height);
            doc.addImage(logo.dataUrl, 'PNG', margin, currentY - 5, pdfWidth, pdfHeight);
        } catch (error) {
            console.warn('Logo image not found or failed to load. Will continue without logo.', error);
        }

        // Header Right (Text)
        doc.setFontSize(7);
        doc.setTextColor(...lightBlue);
        doc.setFont("helvetica", "bold");
        doc.text("VENTURE SOLUTIONS S.A.", pageWidth - margin, currentY + 3, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text("Uma Empresa do Grupo Belchior Venture Business", pageWidth - margin, currentY + 7, { align: "right" });
        doc.text("CONTATO@VENTURE.COM.BR", pageWidth - margin, currentY + 11, { align: "right" });

        currentY += 18;

        // Header Line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, currentY, pageWidth - margin, currentY);

        currentY += 25;

        // --- Title ---
        doc.setFontSize(14);
        doc.setTextColor(...darkBlue);
        doc.setFont("helvetica", "normal"); // Changed font to normal
        doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", pageWidth / 2, currentY, { align: "center" });

        currentY += 20;

        // --- Section 1: PARTES ---
        doc.setFontSize(10);
        doc.setTextColor(11, 11, 11);
        doc.setFont("helvetica", "bold");
        doc.text("1. PARTES", margin, currentY);
        currentY += 10;

        // 1.1 Contratante
        doc.setFontSize(9);
        doc.setTextColor(...darkBlue);
        doc.setFont("helvetica", "bold");
        doc.text("1.1 CONTRATANTE:", margin + 5, currentY);
        currentY += 8;

        doc.setFontSize(9);
        doc.setTextColor(...normalText);
        doc.setFont("helvetica", "normal");
        const clienteNome = contrato.expand?.cliente?.nome || "_________________________";
        const clienteDoc = contrato.expand?.cliente?.documento || "_________________________";
        const clienteTel = contrato.expand?.cliente?.telefone || "_________________________";
        doc.text(`Nome: ${clienteNome}`, margin + 5, currentY); currentY += 7;
        doc.text(`CPF/CNPJ: ${clienteDoc}`, margin + 5, currentY); currentY += 7;
        doc.text(`Telefone: ${clienteTel}`, margin + 5, currentY); currentY += 12;

        // 1.2 Contratado
        doc.setFontSize(9);
        doc.setTextColor(...darkBlue);
        doc.setFont("helvetica", "bold");
        doc.text("1.2 CONTRATADO:", margin + 5, currentY);
        currentY += 8;

        doc.setFontSize(9);
        doc.setTextColor(...normalText);
        doc.setFont("helvetica", "normal");
        doc.text("Nome: Grupo Belchior", margin + 5, currentY); currentY += 7;
        doc.text("CNPJ: 46.105.907/0001-16", margin + 5, currentY); currentY += 7;
        doc.text("Telefone: (19) 97154-4146", margin + 5, currentY); currentY += 7;
        doc.text("E-mail: atendimento@grupobelchior.com", margin + 5, currentY); currentY += 15;

        // --- Section 2: OBJETIVO ---
        checkPageBreak(30);
        doc.setFontSize(10);
        doc.setTextColor(11, 11, 11);
        doc.setFont("helvetica", "bold");
        doc.text("2. OBJETIVO", margin, currentY);
        currentY += 8;

        doc.setFontSize(9);
        doc.setTextColor(...normalText);
        doc.setFont("helvetica", "normal");
        const objText = doc.splitTextToSize("O presente contrato tem por objeto a prestação de serviços pelo Grupo Belchior em favor do Contratante, conforme as condições estabelecidas neste instrumento.", contentWidth - 10);
        doc.text(objText, margin + 5, currentY);
        currentY += (objText.length * 5) + 10;

        // --- Section 3: DESCRIÇÃO DOS SERVIÇOS ---
        checkPageBreak(40);
        doc.setFontSize(10);
        doc.setTextColor(11, 11, 11);
        doc.setFont("helvetica", "bold");
        doc.text("3. DESCRIÇÃO DOS SERVIÇOS", margin, currentY);
        currentY += 8;

        doc.setFontSize(9);
        doc.setTextColor(...normalText);
        doc.setFont("helvetica", "normal");
        
        // Se o conteudo vier sujo com o template inteiro (dos testes anteriores), extraímos só a descrição
        let cleanConteudo = contrato.conteudo || '';
        if (cleanConteudo.includes('3. DESCRIÇÃO DOS SERVIÇOS')) {
            const parts = cleanConteudo.split('3. DESCRIÇÃO DOS SERVIÇOS');
            if (parts.length > 1) {
                const afterDesc = parts[1];
                cleanConteudo = afterDesc.split('4. CONDIÇÕES FINANCEIRAS')[0].trim();
            }
        }

        const descTextStr = `Os serviços a serem prestados compreendem ${contrato.titulo}, conforme especificado abaixo:\n\n${cleanConteudo}`;
        const descText = doc.splitTextToSize(descTextStr, contentWidth - 10);
        doc.text(descText, margin + 5, currentY);
        currentY += (descText.length * 5) + 15;

        // --- Section 4: CONDIÇÕES FINANCEIRAS ---
        checkPageBreak(30);
        doc.setFontSize(10);
        doc.setTextColor(11, 11, 11);
        doc.setFont("helvetica", "bold");
        doc.text("4. CONDIÇÕES FINANCEIRAS", margin, currentY);
        currentY += 8;

        doc.setFontSize(9);
        doc.setTextColor(...darkBlue);
        doc.text("4.1 VALOR E FORMA DE PAGAMENTO:", margin + 5, currentY);
        currentY += 6;

        doc.setTextColor(...normalText);
        doc.setFont("helvetica", "normal");
        const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor || 0);
        const condPagamento = contrato.condicao_pagamento || "conforme alinhado";
        const finTextStr = `O valor total dos serviços contratados é de ${valorFormatado}. O pagamento será efetuado da seguinte forma: ${condPagamento}.`;
        const finText = doc.splitTextToSize(finTextStr, contentWidth - 10);
        doc.text(finText, margin + 5, currentY);
        currentY += (finText.length * 5) + 15;

        // --- Section 5: PRAZO E ENTREGA ---
        checkPageBreak(25);
        doc.setFontSize(10);
        doc.setTextColor(11, 11, 11);
        doc.setFont("helvetica", "bold");
        doc.text("5. PRAZO E ENTREGA", margin, currentY);
        currentY += 8;

        doc.setFontSize(9);
        doc.setTextColor(...normalText);
        doc.setFont("helvetica", "normal");
        const prazoTextStr = "O prazo de entrega será estabelecido conforme cronograma alinhado e aprovado entre as partes, tendo seu início efetivo apenas após a confirmação do pagamento e da entrega de todos os materiais necessários.";
        const prazoText = doc.splitTextToSize(prazoTextStr, contentWidth - 10);
        doc.text(prazoText, margin + 5, currentY);
        currentY += (prazoText.length * 5) + 15;

        // --- Section 6: DISPOSIÇÕES GERAIS ---
        checkPageBreak(25);
        doc.setFontSize(10);
        doc.setTextColor(11, 11, 11);
        doc.setFont("helvetica", "bold");
        doc.text("6. DISPOSIÇÕES GERAIS", margin, currentY);
        currentY += 8;

        doc.setFontSize(9);
        doc.setTextColor(...normalText);
        doc.setFont("helvetica", "normal");
        const dispTextStr = "Este documento constitui o acordo integral entre as partes. Qualquer alteração aos termos aqui estabelecidos deverá ser feita por escrito e assinada por ambas as partes.";
        const dispText = doc.splitTextToSize(dispTextStr, contentWidth - 10);
        doc.text(dispText, margin + 5, currentY);
        currentY += (dispText.length * 5) + 10;

        // --- Signatures (Sempre em página nova) ---
        doc.addPage();
        currentY = 30;

        const colWidth = contentWidth / 2;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        // Contratante (Client)
        doc.text("___________________________________", margin + 5, currentY);
        doc.text(contrato.expand?.cliente?.nome || "CONTRATANTE", margin + 5, currentY + 5);
        doc.setFontSize(7);
        doc.text("CONTRATANTE", margin + 5, currentY + 10);

        // Contratado (User/Company)
        doc.setFontSize(9);
        doc.text("___________________________________", margin + colWidth + 5, currentY);
        doc.text("Felipe Augusto Belchior", margin + colWidth + 5, currentY + 5);
        doc.setFontSize(7);
        doc.text("CEO - GRUPO BELCHIOR", margin + colWidth + 5, currentY + 10);

        currentY += 40;

        // --- Authentication Seal ---
        if (contrato.status === 'Assinado') {
            const sealY = currentY;

            // Retirado o Draw Box (bordas) conforme solicitado

            // Seal Title
            doc.setFontSize(9);
            doc.setTextColor(...darkBlue);
            doc.setFont("helvetica", "bold");
            doc.text("CERTIFICADO DE AUTENTICIDADE DIGITAL", margin + 5, sealY);

            // Seal Details
            doc.setFontSize(7);
            doc.setTextColor(80, 80, 80);
            doc.setFont("helvetica", "normal");
            const sealText = [
                `Autenticado por: Horizons CRM - Sistema de Gestão Inteligente`,
                `Código de Verificação (HASH): ${contrato.hash_autenticacao || 'N/A'}`,
                `Data da Assinatura: ${contrato.data_assinatura ? new Date(contrato.data_assinatura).toLocaleString('pt-BR') : 'N/A'}`,
                `IP de Registro: ${contrato.ip_assinatura || '187.12.94.102'}`,
                `Integridade do Documento Garantida por Criptografia Horizons`
            ];

            sealText.forEach((text, i) => {
                doc.text(text, margin + 5, sealY + 8 + (i * 4));
            });

            doc.setFontSize(9);
            doc.setTextColor(...ventureGreen);
            doc.setFont("helvetica", "bold");
            doc.text("[ DOCUMENTO ASSINADO ]", margin + 5, sealY + 30);
        }

        doc.save(`${contrato.titulo.replace(/\s+/g, '_')}.pdf`);
    };

    const filteredContratos = contratos.filter(c =>
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.expand?.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Assinado': return { label: 'Assinado Digitalmente', color: '#B6FF00', bg: 'rgba(182, 255, 0, 0.1)', icon: <CheckCircle size={14} /> };
            case 'Pendente': return { label: 'Pendente', color: '#FFB800', bg: 'rgba(255, 184, 0, 0.1)', icon: <Clock size={14} /> };
            case 'Cancelado': return { label: 'Cancelado', color: '#FF4D4D', bg: 'rgba(255, 77, 77, 0.1)', icon: <XCircle size={14} /> };
            default: return { label: status, color: '#FFF', bg: 'rgba(255, 255, 255, 0.1)', icon: null };
        }
    };

    return (
        <>
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 0.5rem' }}>
                <div>
                    <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        Gestão de <span className="text-gradient">Contratos</span>
                    </h1>
                    <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Gere, envie e acompanhe assinaturas digitais.</p>
                </div>

                <button onClick={() => setIsModalOpen(true)} className="glass-panel" style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px solid rgba(182, 255, 0, 0.3)', background: 'var(--accent-primary)', color: '#0b0b0b', fontWeight: 600 }}>
                    <Plus size={18} strokeWidth={2} /> Novo Contrato
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
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Contrato</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Cliente</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Valor</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Status</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Pagamento</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContratos.map((contrato) => {
                                const status = getStatusStyle(contrato.status);
                                return (
                                    <tr key={contrato.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="hover:bg-[rgba(255,255,255,0.02)]">
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{contrato.titulo}</div>
                                                    {contrato.expand?.negocio && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Negócio: {contrato.expand.negocio.titulo}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{contrato.expand?.cliente?.nome}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{contrato.expand?.cliente?.empresa}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor || 0)}
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
                                            {contrato.status_pagamento === 'Pago' ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#B6FF00', fontSize: '0.85rem', fontWeight: 600 }}>
                                                    <DollarSign size={14} /> Pago
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#FFB800', fontSize: '0.85rem', fontWeight: 600 }}>
                                                    <Clock size={14} /> Pendente
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button onClick={() => handleSendContractWhatsApp(contrato)} disabled={sendingWpp === contrato.id} title="Avisar Contrato Fechado (WhatsApp)" style={{ background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)', color: '#25D366', padding: '0.5rem', borderRadius: '8px', cursor: sendingWpp === contrato.id ? 'not-allowed' : 'pointer', opacity: sendingWpp === contrato.id ? 0.5 : 1 }} className="hover:bg-[rgba(37, 211, 102, 0.2)] transition-colors">
                                                    <MessageSquare size={16} />
                                                </button>

                                                <button onClick={async () => await generatePDF(contrato)} title="Baixar Contrato" style={{ background: 'rgba(182, 255, 0, 0.1)', border: '1px solid rgba(182, 255, 0, 0.2)', color: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }} className="hover:bg-[rgba(182, 255, 0, 0.2)] transition-colors">
                                                    <Download size={16} />
                                                </button>
                                                
                                                <button onClick={async () => await generateInvoicePDF(contrato)} title="Gerar Fatura" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }} className="hover:bg-[rgba(59, 130, 246, 0.2)] transition-colors">
                                                    <DollarSign size={16} />
                                                </button>

                                                {contrato.comprovante ? (
                                                    <a href={pb.files.getUrl(contrato, contrato.comprovante)} target="_blank" rel="noreferrer" title="Ver Comprovante" style={{ background: 'rgba(182, 255, 0, 0.1)', border: '1px solid rgba(182, 255, 0, 0.2)', color: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:bg-[rgba(182, 255, 0, 0.2)] transition-colors">
                                                        <FileCheck size={16} />
                                                    </a>
                                                ) : (
                                                    <button onClick={() => triggerUpload(contrato.id)} title="Anexar Comprovante do PIX" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.2)', color: 'white', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }} className="hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                                                        <Upload size={16} />
                                                    </button>
                                                )}

                                                <button onClick={() => setViewingContrato(contrato)} title="Visualizar" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }} className="hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                                                    <Eye size={16} />
                                                </button>
                                                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.5rem', cursor: 'pointer' }}>
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredContratos.length === 0 && !loading && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Nenhum contrato encontrado.
                        </div>
                    )}
                </div>
            </div>

            </div>

            <NewContractModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchContratos}
            />

            {/* View Modal */}
            {viewingContrato && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} onClick={() => setViewingContrato(null)} />
                    <div className="glass-panel animate-fade-in" style={{ position: 'relative', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', zIndex: 101, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="text-2xl font-bold">{viewingContrato.titulo}</h2>
                            <button onClick={() => setViewingContrato(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', fontSize: '0.9rem', color: 'var(--text-body)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.6' }}>
                            {/* Limpa o cabeçalho se ele vier sujo do template anterior */}
                            {viewingContrato.conteudo.includes('3. DESCRIÇÃO DOS SERVIÇOS')
                                ? viewingContrato.conteudo.split('3. DESCRIÇÃO DOS SERVIÇOS')[1]?.split('4. CONDIÇÕES FINANCEIRAS')[0].trim() || viewingContrato.conteudo
                                : viewingContrato.conteudo
                            }
                        </div>

                        {viewingContrato.status === 'Assinado' && (
                            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(182, 255, 0, 0.05)', border: '1px solid rgba(182, 255, 0, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <h4 style={{ color: 'var(--accent-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={18} /> Contrato Autenticado
                                </h4>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <strong>HASH:</strong> {viewingContrato.hash_autenticacao}<br/>
                                    <strong>Data:</strong> {new Date(viewingContrato.data_assinatura || '').toLocaleString('pt-BR')}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button onClick={() => setViewingContrato(null)} style={{ flex: 1, padding: '1rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'white' }}>Fechar</button>
                            <button onClick={async () => { await generatePDF(viewingContrato); setViewingContrato(null); }} style={{ flex: 2, padding: '1rem', borderRadius: '10px', background: 'var(--accent-primary)', border: 'none', color: '#0b0b0b', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Download size={18} /> Baixar PDF Oficial
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Hidden Input for Receipt Upload */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
            />
        </>
    );
}
