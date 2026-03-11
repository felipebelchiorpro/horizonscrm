import { useState, useEffect } from 'react';
import { TrendingUp, Users2, WalletCards, LineChart, BarChart3, ArrowUpRight, Calendar as CalendarIcon, DollarSign, UserPlus, Briefcase } from 'lucide-react';
import { pb } from '../lib/pocketbase';
import { startOfMonth, endOfMonth, subMonths, parseISO, format, isValid, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Metric {
    label: string;
    value: string | number;
    suffix?: string;
    icon: any;
    trend: string;
    color: string;
    isPositive: boolean;
}

interface Activity {
    id: string;
    type: 'negocio' | 'cliente';
    title: string;
    description: string;
    date: Date;
    amount?: number;
}

export function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Data
            const [negociosBase, clientesBase] = await Promise.all([
                pb.collection('negocios').getFullList({ expand: 'cliente' }),
                pb.collection('clientes').getFullList()
            ]);

            const currentStart = parseISO(startDate);
            const currentEnd = parseISO(endDate);
            const diffTime = Math.abs(currentEnd.getTime() - currentStart.getTime());
            
            // Previous Period calculation
            const prevEnd = subDays(currentStart, 1);
            const prevStart = new Date(prevEnd.getTime() - diffTime);

            // Filter tools
            const isCurrent = (dateStr: string) => {
                const d = parseISO(dateStr);
                if (!isValid(d)) return false;
                return d >= currentStart && d <= currentEnd;
            };

            const isPrevious = (dateStr: string) => {
                const d = parseISO(dateStr);
                if (!isValid(d)) return false;
                return d >= prevStart && d <= prevEnd;
            };

            // Calculate Metrics
            const currentNegocios = negociosBase.filter(n => isCurrent(n.created));
            const prevNegocios = negociosBase.filter(n => isPrevious(n.created));

            const currentFechados = currentNegocios.filter(n => n.fase === 'Fechado');
            const prevFechados = prevNegocios.filter(n => n.fase === 'Fechado');

            const currentRevenue = currentFechados.reduce((sum, n) => sum + (n.valor || 0), 0);
            const prevRevenue = prevFechados.reduce((sum, n) => sum + (n.valor || 0), 0);
            const revenueTrend = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

            const currentClients = clientesBase.filter(c => isCurrent(c.created)).length;
            const prevClients = clientesBase.filter(c => isPrevious(c.created)).length;
            const clientsTrend = prevClients === 0 ? 100 : ((currentClients - prevClients) / prevClients) * 100;

            const currentConvRate = currentNegocios.length === 0 ? 0 : (currentFechados.length / currentNegocios.length) * 100;
            const prevConvRate = prevNegocios.length === 0 ? 0 : (prevFechados.length / prevNegocios.length) * 100;
            const convTrend = currentConvRate - prevConvRate; // absolute difference for rate

            const newMetrics: Metric[] = [
                { 
                    label: 'Receita do Período', 
                    value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(currentRevenue), 
                    icon: WalletCards, 
                    trend: `${revenueTrend > 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`, 
                    color: 'var(--accent-primary)',
                    isPositive: revenueTrend >= 0
                },
                { 
                    label: 'Novos Clientes', 
                    value: currentClients.toString(), 
                    icon: Users2, 
                    trend: `${clientsTrend > 0 ? '+' : ''}${clientsTrend.toFixed(1)}%`, 
                    color: 'var(--accent-secondary)',
                    isPositive: clientsTrend >= 0
                },
                { 
                    label: 'Taxa de Conversão', 
                    value: currentConvRate.toFixed(1), 
                    suffix: '%', 
                    icon: LineChart, 
                    trend: `${convTrend > 0 ? '+' : ''}${convTrend.toFixed(1)}%`, 
                    color: 'var(--accent-tertiary)',
                    isPositive: convTrend >= 0
                },
                { 
                    label: 'Negócios Ganhos', 
                    value: currentFechados.length.toString(),
                    icon: BarChart3, 
                    trend: `${currentFechados.length - prevFechados.length > 0 ? '+' : ''}${currentFechados.length - prevFechados.length}`, 
                    color: '#f43f5e',
                    isPositive: currentFechados.length >= prevFechados.length
                },
            ];

            setMetrics(newMetrics);

            // Chart Data Generation (Grouping fechados by month using all records to show history of current year)
            // Or grouping by the selected period months
            const timelineData: Record<string, number> = {};
            const monthsToFetch = 6;
            for (let i = monthsToFetch - 1; i >= 0; i--) {
                const date = subMonths(new Date(), i);
                const monthKey = format(date, 'MMM', { locale: ptBR });
                timelineData[monthKey] = 0;
            }

            const recent6Months = subMonths(new Date(), 6);
            negociosBase.forEach(n => {
                if (n.fase === 'Fechado') {
                    const date = parseISO(n.data_fechamento || n.updated);
                    if (isValid(date) && date >= recent6Months) {
                        const monthKey = format(date, 'MMM', { locale: ptBR });
                        if (timelineData[monthKey] !== undefined) {
                            timelineData[monthKey] += (n.valor || 0);
                        }
                    }
                }
            });

            setChartData(Object.keys(timelineData).map(key => ({
                name: key.toUpperCase(),
                Receita: timelineData[key]
            })));

            // Recent Activities
            const allActivities: Activity[] = [];
            
            negociosBase.forEach(n => {
                allActivities.push({
                    id: `neg-${n.id}`,
                    type: 'negocio',
                    title: n.fase === 'Fechado' ? 'Negócio Fechado' : 'Negócio Atualizado',
                    description: `${n.titulo} • ${n.expand?.cliente?.nome || 'Sem cliente'}`,
                    date: parseISO(n.updated),
                    amount: n.valor
                });
            });

            clientesBase.forEach(c => {
                allActivities.push({
                    id: `cli-${c.id}`,
                    type: 'cliente',
                    title: 'Novo Cliente',
                    description: `${c.nome} • ${c.empresa || 'Pessoa Física'}`,
                    date: parseISO(c.created)
                });
            });

            const sortedActs = allActivities
                .filter(a => isValid(a.date))
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 5);

            setActivities(sortedActs);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const handleExport = () => {
        window.print(); // Simple way to export view, could be upgraded to PDF
    };

    const formatActDate = (date: Date) => {
        const diffMs = new Date().getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHrs < 24) return `${diffHrs}h`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays}d`;
    };

    return (
        <div className="animate-fade-in" style={{ padding: '0.5rem', paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        Visão <span className="text-gradient">Geral</span>
                    </h1>
                    <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Acompanhe o desempenho das suas vendas em tempo real.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.25rem', gap: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem' }}>
                            <CalendarIcon size={16} style={{ color: 'var(--text-muted)' }} />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                            />
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>até</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem' }}>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <button onClick={handleExport} className="glass-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 500 }}>
                        Exportar Relatório <ArrowUpRight size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
                    Atualizando métricas...
                </div>
            ) : (
                <>
                    <div className="dashboard-grid">
                        {metrics.map((stat, i) => (
                            <div className="stat-card" key={i} style={{ position: 'relative', animationDelay: `${i * 0.1}s`, background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                                <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: `radial-gradient(circle, ${stat.color} 0%, transparent 70%)`, opacity: 0.1, filter: 'blur(20px)' }}></div>

                                <div className="stat-header" style={{ position: 'relative' }}>
                                    <span className="stat-header-title">{stat.label}</span>
                                    <div className="stat-icon-wrap" style={{ color: stat.color }}>
                                        <stat.icon size={22} strokeWidth={1.25} style={{ strokeWidth: 1.25 }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: '0.5rem', position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                        <span className="stat-value">{stat.value}</span>
                                        {stat.suffix && <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.suffix}</span>}
                                    </div>

                                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className="stat-trend" style={{ background: stat.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: stat.isPositive ? 'var(--accent-tertiary)' : '#f43f5e', borderColor: stat.isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)' }}>
                                            <TrendingUp size={14} style={{ transform: stat.isPositive ? 'none' : 'rotate(180deg)' }} />
                                            {stat.trend}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>vs. período anterior</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', marginTop: '3rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem', gridColumn: 'span 8', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h2 className="text-xl font-bold">Resumo de Receita</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Desempenho dos últimos 6 meses</p>
                                </div>
                            </div>
                            
                            <div style={{ flex: 1, position: 'relative', minHeight: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis 
                                            stroke="var(--text-muted)" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                            tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(15, 15, 15, 0.95)', 
                                                border: '1px solid rgba(182, 255, 0, 0.2)',
                                                backdropFilter: 'blur(10px)',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                            formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0), 'Receita']}
                                        />
                                        <Area type="monotone" dataKey="Receita" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', gridColumn: 'span 4', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                            <h2 className="text-xl font-bold" style={{ marginBottom: '2rem' }}>Atividades Recentes</h2>
                            
                            <div className="custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {activities.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>Nenhuma atividade registrada no período.</div>
                                ) : (
                                    activities.map((act) => (
                                        <div key={act.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                            <div style={{ 
                                                width: '2.5rem', 
                                                height: '2.5rem', 
                                                borderRadius: 'var(--radius-full)', 
                                                background: act.type === 'negocio' ? 'rgba(182, 255, 0, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                border: `1px solid ${act.type === 'negocio' ? 'rgba(182, 255, 0, 0.2)' : 'rgba(59, 130, 246, 0.2)'}` 
                                            }}>
                                                {act.title.includes('Fechado') ? 
                                                    <DollarSign size={14} style={{ color: 'var(--accent-primary)' }} /> : 
                                                    act.type === 'cliente' ? <UserPlus size={14} style={{ color: '#3b82f6' }} /> :
                                                    <Briefcase size={14} style={{ color: 'var(--text-muted)' }} />
                                                }
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{act.title}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                                    {act.description}
                                                </p>
                                                {act.amount && act.amount > 0 && (
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(act.amount)}
                                                    </p>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {formatActDate(act.date)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
