import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="app-container">
            <Sidebar isOpen={isSidebarOpen} />
            <main className="main-content">
                <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
