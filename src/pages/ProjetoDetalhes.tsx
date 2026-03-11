import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pb } from '../lib/pocketbase';
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    CheckSquare, 
    MoreVertical, 
    Plus, 
    Tag, 
    Receipt,
    ListTodo
} from 'lucide-react';

import { NovaHoraModal } from '../components/projetos/NovaHoraModal';
import { NovoServicoLancadoModal } from '../components/projetos/NovoServicoLancadoModal';

interface Projeto {
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    status: string;
    valor_hora: number;
    data_inicio: string;
    data_entrega: string;
    responsavel: string;
    cliente: string;
    os?: string;
    expand?: {
        responsavel?: { name: string, avatar: string };
        cliente?: { nome: string };
        os?: { titulo: string };
    }
}

interface HoraProjeto {
    id: string;
    data: string;
    minutos_gastos: number;
    descricao: string;
    faturado: boolean;
    expand?: { responsavel?: { name: string } };
}

interface ServicoLancado {
    id: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
    observacao: string;
    faturado: boolean;
    expand?: { servico?: { nome: string } };
}

export function ProjetoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [projeto, setProjeto] = useState<Projeto | null>(null);
    const [horas, setHoras] = useState<HoraProjeto[]>([]);
    const [servicos, setServicos] = useState<ServicoLancado[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'geral' | 'horas' | 'servicos'>('geral');

    // Modals state
    const [isHoraModalOpen, setIsHoraModalOpen] = useState(false);
    const [isServicoModalOpen, setIsServicoModalOpen] = useState(false);

    const fetchData = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const proj = await pb.collection('projetos').getOne<Projeto>(id, {
                expand: 'cliente,responsavel,os'
            });
            setProjeto(proj);

            const hs = await pb.collection('horas_projeto').getFullList<HoraProjeto>({
                filter: `projeto="${id}"`,
                sort: '-data',
                expand: 'responsavel'
            });
            setHoras(hs);

            const svs = await pb.collection('servicos_lancados').getFullList<ServicoLancado>({
                filter: `projeto="${id}"`,
                sort: '-created',
                expand: 'servico'
            });
            setServicos(svs);

        } catch (error) {
            console.error('Error fetching project details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!projeto) return;
        const novoStatus = e.target.value;
        try {
            await pb.collection('projetos').update(projeto.id, { status: novoStatus });
            setProjeto({ ...projeto, status: novoStatus });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Não foi possível atualizar o status.');
        }
    };

    const getDeadlineColor = (data_entrega: string | undefined | null, status: string | undefined) => {
        if (!data_entrega || status === 'Concluído' || status === 'Cancelado') return 'white';
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const entrega = new Date(data_entrega);
        entrega.setHours(0, 0, 0, 0);
        
        const diffTime = entrega.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return '#ff3333'; // Atrasado (Vermelho)
        if (diffDays <= 3) return '#ffaa00'; // Próximo (Laranja/Amarelo)
        return 'white'; // Normal
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando detalhes do projeto...</div>;
    if (!projeto) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Projeto não encontrado.</div>;

    const totalHorasEmMinutos = horas.reduce((acc, h) => acc + h.minutos_gastos, 0);
    const totalHoras = Math.floor(totalHorasEmMinutos / 60);
    const minutosRestantes = totalHorasEmMinutos % 60;
    const custoHoras = (totalHorasEmMinutos / 60) * (projeto.valor_hora || 0);
    
    const custoServicos = servicos.reduce((acc, s) => acc + s.valor_total, 0);
    const custoTotal = custoHoras + custoServicos;

    return (
        <>
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%', paddingBottom: '2rem' }}>
            
            {/* Header (Bitrix Style) */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'linear-gradient(145deg, rgba(20,20,20,0.9) 0%, rgba(10,10,10,0.95) 100%)', borderTop: '4px solid var(--accent-primary)' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <button onClick={() => navigate('/projetos')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <ArrowLeft size={20} />
                     </button>
                    <div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <span style={{ 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                textTransform: 'uppercase', 
                                background: 'rgba(182, 255, 0, 0.15)', 
                                color: 'var(--accent-primary)',
                                letterSpacing: '0.5px'
                            }}>
                                {projeto.categoria}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Projeto #{(projeto.id).substring(0,6).toUpperCase()}</span>
                         </div>
                         <h1 className="text-3xl font-bold" style={{ color: 'white' }}>{projeto.titulo}</h1>
                    </div>
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {projeto.expand?.os && (
                            <div style={{ textAlign: 'right', paddingRight: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Ordem de Serviço</div>
                                <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{projeto.expand.os.titulo}</div>
                            </div>
                        )}
                        <div style={{ textAlign: 'right', paddingRight: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Cliente</div>
                             <div style={{ fontWeight: 600, color: 'white' }}>{projeto.expand?.cliente?.nome}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {projeto.expand?.responsavel ? (
                                <>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Responsável</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{projeto.expand.responsavel.name}</div>
                                    </div>
                                    <img 
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(projeto.expand.responsavel.name)}&background=random`} 
                                        alt="Avatar"
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }}
                                    />
                                </>
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Sem responsável</div>
                            )}
                        </div>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}>
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                     <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                             <CheckSquare size={16} /> Status
                         </div>
                         <div style={{ fontWeight: 600 }}>
                             <select 
                                value={projeto.status} 
                                onChange={handleStatusChange}
                                style={{ 
                                    padding: '0.25rem 0.5rem', 
                                    borderRadius: '8px', 
                                    fontSize: '0.9rem', 
                                    fontWeight: 600,
                                    background: projeto.status === 'Concluído' ? 'rgba(182, 255, 0, 0.1)' : 'rgba(255,255,255,0.05)',
                                    color: projeto.status === 'Concluído' ? 'var(--accent-primary)' : 'white',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    width: '100%'
                                }}
                            >
                                <option value="Não Iniciado" style={{ color: 'black' }}>Não Iniciado</option>
                                <option value="Em Andamento" style={{ color: 'black' }}>Em Andamento</option>
                                <option value="Aguardando Cliente" style={{ color: 'black' }}>Aguardando Cliente</option>
                                <option value="Concluído" style={{ color: 'black' }}>Concluído</option>
                                <option value="Cancelado" style={{ color: 'black' }}>Cancelado</option>
                            </select>
                         </div>
                     </div>
                     <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                             <Calendar size={16} /> Prazo / Entrega
                         </div>
                         <div style={{ fontWeight: 600, color: getDeadlineColor(projeto.data_entrega, projeto.status) }}>
                             {projeto.data_entrega ? new Date(projeto.data_entrega).toLocaleDateString('pt-BR') : 'Não definido'}
                         </div>
                     </div>
                     <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                             <Clock size={16} /> Horas Gastas
                         </div>
                         <div style={{ fontWeight: 600, color: 'white' }}>
                             {totalHoras}h {minutosRestantes}m
                         </div>
                     </div>
                     <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                             <Receipt size={16} /> Custo Total (Estimado)
                         </div>
                         <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotal)}
                         </div>
                     </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', padding: '0 0.5rem' }}>
                 <button 
                    onClick={() => setActiveTab('geral')} 
                    style={{ background: 'transparent', border: 'none', color: activeTab === 'geral' ? 'white' : 'var(--text-muted)', fontWeight: activeTab === 'geral' ? 600 : 400, padding: '0.5rem 1rem', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ListTodo size={18} /> Visão Geral
                    {activeTab === 'geral' && <div style={{ position: 'absolute', bottom: '-0.6rem', left: 0, right: 0, height: '2px', background: 'var(--accent-primary)', borderRadius: '2px' }} />}
                 </button>
                 <button 
                    onClick={() => setActiveTab('horas')} 
                    style={{ background: 'transparent', border: 'none', color: activeTab === 'horas' ? 'white' : 'var(--text-muted)', fontWeight: activeTab === 'horas' ? 600 : 400, padding: '0.5rem 1rem', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Clock size={18} /> Apontamento de Horas
                    {activeTab === 'horas' && <div style={{ position: 'absolute', bottom: '-0.6rem', left: 0, right: 0, height: '2px', background: 'var(--accent-primary)', borderRadius: '2px' }} />}
                 </button>
                 <button 
                    onClick={() => setActiveTab('servicos')} 
                    style={{ background: 'transparent', border: 'none', color: activeTab === 'servicos' ? 'white' : 'var(--text-muted)', fontWeight: activeTab === 'servicos' ? 600 : 400, padding: '0.5rem 1rem', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Tag size={18} /> Serviços Avulsos
                    {activeTab === 'servicos' && <div style={{ position: 'absolute', bottom: '-0.6rem', left: 0, right: 0, height: '2px', background: 'var(--accent-primary)', borderRadius: '2px' }} />}
                 </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1 }}>
                
                {/* Aba: Visão Geral */}
                {activeTab === 'geral' && (
                    <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: 'white' }}>Sobre o Projeto</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                             {projeto.descricao || 'Nenhuma descrição detalhada fornecida para este projeto.'}
                        </p>
                    </div>
                )}

                {/* Aba: Apontamento de Horas */}
                {activeTab === 'horas' && (
                    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>Time Tracking</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Valor cobrado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projeto.valor_hora)} / hora</p>
                            </div>
                            <button onClick={() => setIsHoraModalOpen(true)} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }} className="hover:bg-[rgba(255,255,255,0.15)] transition-colors">
                                <Plus size={16} /> Lançar Horas
                            </button>
                        </div>
                        
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Data</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Profissional</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Tempo Gasto</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Descrição do Trabalho</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Faturado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {horas.length === 0 ? (
                                        <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma hora lançada ainda.</td></tr>
                                    ) : horas.map(h => (
                                        <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="hover:bg-white/5 transition-colors">
                                            <td style={{ padding: '1rem', color: 'white' }}>{new Date(h.data).toLocaleDateString('pt-BR')}</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{h.expand?.responsavel?.name || 'N/A'}</td>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                                                {Math.floor(h.minutos_gastos/60)}h {h.minutos_gastos%60}m
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', maxWidth: '300px' }}>{h.descricao}</td>
                                            <td style={{ padding: '1rem' }}>
                                                {h.faturado ? (
                                                    <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(182, 255, 0, 0.1)', color: 'var(--accent-primary)', borderRadius: '4px', fontSize: '0.75rem' }}>Sim</span>
                                                ) : (
                                                    <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', borderRadius: '4px', fontSize: '0.75rem' }}>Não</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Aba: Serviços Avulsos */}
                {activeTab === 'servicos' && (
                    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>Serviços Adicionais / Produtos</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Itens ou serviços extras agregados a este projeto.</p>
                            </div>
                            <button onClick={() => setIsServicoModalOpen(true)} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }} className="hover:bg-[rgba(255,255,255,0.15)] transition-colors">
                                <Plus size={16} /> Adicionar Serviço
                            </button>
                        </div>

                         <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Serviço</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Qtd</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Vlr Unitário</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Total</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Observação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {servicos.length === 0 ? (
                                        <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum serviço extra lançado.</td></tr>
                                    ) : servicos.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="hover:bg-white/5 transition-colors">
                                            <td style={{ padding: '1rem', color: 'white', fontWeight: 500 }}>{s.expand?.servico?.nome || 'Item avulso'}</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{s.quantidade}x</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.valor_unitario)}</td>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.valor_total)}</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{s.observacao}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            
            </div>
            
            <NovaHoraModal 
                isOpen={isHoraModalOpen} 
                onClose={() => setIsHoraModalOpen(false)} 
                onSaved={fetchData} 
                projetoId={projeto.id} 
                responsavelId={projeto.responsavel} 
            />
            <NovoServicoLancadoModal 
                isOpen={isServicoModalOpen} 
                onClose={() => setIsServicoModalOpen(false)} 
                onSaved={fetchData} 
                projetoId={projeto.id} 
            />
        </>
    );
}
