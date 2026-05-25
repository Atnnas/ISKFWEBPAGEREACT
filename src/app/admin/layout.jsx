import { auth } from "../../auth";
import { redirect } from "next/navigation";
import Link from 'next/link';

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex pt-28 md:pt-32">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-950 border-r border-neutral-800 hidden md:block fixed h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Panel Admin
          </h2>
          <nav className="space-y-2">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-300 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-300 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Usuarios
            </Link>
            <Link href="/admin/dojos" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-300 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Dojos
            </Link>
            <Link href="/admin/events" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-300 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendario
            </Link>
            <Link href="/admin/entities" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-300 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Organizaciones
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
