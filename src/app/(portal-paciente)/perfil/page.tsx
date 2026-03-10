"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { User, Mail, LogOut, ChevronLeft } from "lucide-react";

export default function PerfilPage() {
  const { user, clearAuthData } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    clearAuthData();
    router.push("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      <header className="p-6 bg-white border-b flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Meu Perfil</h1>
      </header>

      <main className="p-6 space-y-6">
        {/* Perfil */}
        <div className="flex flex-col items-center py-4">
          <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-lg mb-4">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
          <p className="text-slate-500">{user?.email}</p>
        </div>

        {/* Informações da conta */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
          <div className="flex items-center gap-4 p-3 border-b border-slate-50">
            <User className="text-blue-500" size={20} />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nome</p>
              <p className="text-slate-700 font-medium">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3">
            <Mail className="text-blue-500" size={20} />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">E-mail</p>
              <p className="text-slate-700 font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

        {/*Logout*/}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl font-bold active:scale-95 transition-all mt-4"
        >
          <LogOut size={20} />
          Sair da Conta
        </button>
      </main>
    </div>
  );
}