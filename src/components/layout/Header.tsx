import { useState, useEffect, useRef } from 'react';
import { Search, BellRing, Menu, Users, Briefcase, LayoutDashboard, X, Check, Loader2 } from 'lucide-react';
import { pb } from '../../lib/pocketbase';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
    const user = pb.authStore.model;
    const navigate = useNavigate();
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<{ type: string; id: string; title: string; subtitle?: string; icon: any; path: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Notifications State
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState([
        { id: '1', title: 'Novo Lead Comercial', message: 'Um novo lead foi qualificado no funil de vendas.', time: '5 min atrás', unread: true },
        { id: '2', title: 'Contrato Assinado', message: 'O contrato HZ-2026 foi assinado digitalmente.', time: '1 hora atrás', unread: true },
        { id: '3', title: 'Novo Membro', message: 'Um novo membro acabou de se juntar à equipe.', time: 'Ontem', unread: false },
    ]);

    const unreadCount = notifications.filter(n => n.unread).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchDropdown(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (!searchTerm.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const results: any[] = [];
                // Clientes
                try {
                    const clientes = await pb.collection('clientes').getList(1, 3, { filter: `nome ~ "${searchTerm}" || email ~ "${searchTerm}"` });
                    clientes.items.forEach(c => results.push({ type: 'Cliente', id: c.id, title: c.nome, subtitle: c.email, icon: Users, path: `/clientes/${c.id}` }));
                } catch(e) {}

                // Negócios
                try {
                    const negocios = await pb.collection('negocios').getList(1, 3, { filter: `titulo ~ "${searchTerm}"`, expand: 'cliente' });
                    negocios.items.forEach(n => results.push({ type: 'Negócio', id: n.id, title: n.titulo, subtitle: n.expand?.cliente?.nome, icon: Briefcase, path: `/negocios` }));
                } catch(e) {}

                // Projetos
                try {
                    const projetos = await pb.collection('projetos').getList(1, 3, { filter: `nome ~ "${searchTerm}"` });
                    projetos.items.forEach(p => results.push({ type: 'Projeto', id: p.id, title: p.nome, subtitle: 'Status: ' + p.status, icon: LayoutDashboard, path: `/projetos/${p.id}` }));
                } catch(e) {}

                setSearchResults(results);
            } catch (error) {
                console.error("Search error", error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleResultClick = (path: string) => {
        setShowSearchDropdown(false);
        setSearchTerm('');
        navigate(path);
    };

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    };

    const avatarUrl = user?.avatar ? pb.files.getURL(user, user.avatar) : null;

    return (
        <header className="header animate-fade-in" style={{ position: 'relative', zIndex: 110 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <button onClick={onMenuToggle} className="icon-btn" style={{ flexShrink: 0 }}>
                    <Menu size={20} strokeWidth={1.25} style={{ strokeWidth: 1.25 }} />
                </button>
                
                <div ref={searchRef} className="header-search" style={{ position: 'relative' }}>
                    <Search className="header-search-icon" size={20} strokeWidth={1.25} style={{ strokeWidth: 1.25, color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Pesquisar negócios, clientes, projetos..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowSearchDropdown(true);
                        }}
                        onFocus={() => setShowSearchDropdown(true)}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.65rem 1rem 0.65rem 2.8rem', width: '100%', color: 'white', outline: 'none', transition: 'all 0.2s' }}
                        className="focus:bg-[rgba(255,255,255,0.05)] focus:border-[var(--accent-primary)]"
                    />
                    
                    {searchTerm && (
                        <button onClick={() => { setSearchTerm(''); setShowSearchDropdown(false); }} className="hover:text-white" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}>
                            <X size={16} />
                        </button>
                    )}

                    {/* Dropdown de Busca */}
                    {showSearchDropdown && searchTerm && (
                        <div className="glass-panel animate-fade-in custom-scrollbar" style={{ position: 'absolute', top: '110%', left: 0, right: 0, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 120 }}>
                            {isSearching ? (
                                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                    <Loader2 className="animate-spin" size={24} />
                                </div>
                            ) : searchResults.length > 0 ? (
                                <>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Resultados da Busca</div>
                                    {searchResults.map((result) => {
                                        const Icon = result.icon;
                                        return (
                                            <div key={`${result.type}-${result.id}`} onClick={() => handleResultClick(result.path)} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(182, 255, 0, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Icon size={18} />
                                                </div>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.title}</span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{result.type}</span>
                                                    </div>
                                                    {result.subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.subtitle}</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Nenhum resultado encontrado para "{searchTerm}".
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div ref={notifRef} style={{ position: 'relative' }}>
                    <button className="icon-btn hover:bg-[rgba(255,255,255,0.05)]" onClick={() => setShowNotifications(!showNotifications)} style={{ position: 'relative', background: showNotifications ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: '50%', padding: '0.5rem', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <BellRing size={20} strokeWidth={1.5} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px',
                                backgroundColor: '#B6FF00', borderRadius: '50%', boxShadow: '0 0 8px rgba(182, 255, 0, 0.8)'
                            }}></span>
                        )}
                    </button>

                    {/* Dropdown de Notificações */}
                    {showNotifications && (
                        <div className="glass-panel animate-fade-in custom-scrollbar" style={{ position: 'absolute', top: '120%', right: 0, width: '320px', padding: '0', display: 'flex', flexDirection: 'column', maxHeight: '450px', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', zIndex: 121, borderRadius: '16px' }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px 16px 0 0' }}>
                                <div style={{ fontWeight: 600, fontSize: '1rem' }}>Notificações {unreadCount > 0 && <span style={{ background: 'var(--accent-primary)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{unreadCount} novas</span>}</div>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }} className="hover:opacity-80 transition-opacity">
                                        <Check size={14} /> Marcar lidas
                                    </button>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {notifications.length > 0 ? notifications.map((notif) => (
                                    <div key={notif.id} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '1rem', cursor: 'pointer', position: 'relative' }}>
                                        {notif.unread && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '40%', background: 'var(--accent-primary)', borderRadius: '0 4px 4px 0' }}></div>}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'flex-start' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: notif.unread ? 'white' : 'var(--text-muted)' }}>{notif.title}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>{notif.time}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{notif.message}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        Nenhuma notificação por enquanto.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="user-profile-btn" style={{ 
                    padding: '0.25rem 1rem 0.25rem 0.25rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    borderRadius: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer'
                }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        padding: '2px',
                        background: 'linear-gradient(135deg, #B6FF00, #8bcc00)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(182, 255, 0, 0.2)'
                    }}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="User Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #111' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#3b82f6', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                {getInitials(user?.name || user?.email || '')}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1, color: 'white' }}>
                            {user?.name || user?.email?.split('@')[0] || 'Usuário'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {pb.authStore.isSuperuser ? 'Super Admin' : (user?.role || 'Membro')}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
