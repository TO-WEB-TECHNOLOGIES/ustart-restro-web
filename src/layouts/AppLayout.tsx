import { Outlet } from 'react-router-dom';

export const AppLayout = () => {
    return (
        <div className="flex h-screen w-full bg-slate-50">
            {/* Sidebar Placeholder */}
            <aside className="w-64 bg-white border-r hidden md:block">
                <div className="p-4 font-bold text-xl border-b">Admin</div>
                <nav className="p-4 space-y-2">
                    <div className="p-2 bg-slate-100 rounded">Dashboard</div>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header Placeholder */}
                <header className="h-16 bg-white border-b flex items-center px-4">
                    <div className="font-semibold">Header</div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
