
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, BrainCircuit, Trash2, Edit3, ChevronRight, LayoutDashboard, Users as UsersIcon, Database, AlertCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ClientForm from './components/ClientForm';
import { Client, ClientStatus, CRMStats } from './types';
import { getGeminiInsights } from './services/geminiService';
import { apiService } from './services/apiService';

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('offline');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getClients();
      setClients(data);
      setDbStatus('online');
    } catch (error) {
      console.error(error);
      setDbStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const stats: CRMStats = useMemo(() => {
    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === ClientStatus.ACTIVE).length,
      prospects: clients.filter(c => c.status === ClientStatus.PROSPECT).length,
      recentActivity: clients.length > 2 ? 3 : clients.length,
    };
  }, [clients]);

  const handleAddOrEdit = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      if (editingClient) {
        await apiService.updateClient(editingClient.id, clientData);
      } else {
        const newClient: Client = {
          ...clientData,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
        };
        await apiService.createClient(newClient);
      }
      await loadClients();
      setIsFormOpen(false);
      setEditingClient(null);
    } catch (error) {
      alert('Erro ao salvar no banco de dados. Verifique a API.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover este cliente do banco de dados?')) {
      try {
        await apiService.deleteClient(id);
        await loadClients();
        if (selectedClient?.id === id) setSelectedClient(null);
      } catch (error) {
        alert('Erro ao excluir cliente.');
      }
    }
  };

  const handleGetInsight = async (client: Client) => {
    setSelectedClient(client);
    setIsInsightLoading(true);
    setAiInsight(null);
    const insight = await getGeminiInsights(client);
    setAiInsight(insight);
    setIsInsightLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-indigo-900 text-white p-6 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-white/10 p-2 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-indigo-200" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Nexus CRM</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <button className="flex items-center gap-3 w-full px-4 py-3 bg-white/10 rounded-xl font-medium text-white">
            <UsersIcon className="w-5 h-5" />
            Clientes
          </button>
          <div className="pt-4 px-4 text-xs font-semibold text-indigo-300 uppercase tracking-widest">IA Nexus</div>
          <button className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/5 rounded-xl font-medium text-indigo-100 transition-colors">
            <BrainCircuit className="w-5 h-5" />
            Insights
          </button>
        </nav>

        {/* Database Status Indicator */}
        <div className={`mt-auto p-4 rounded-xl border ${dbStatus === 'online' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} flex items-center gap-3`}>
          <div className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-tighter text-indigo-200">MySQL Database</p>
            <p className="text-[10px] text-white/70 uppercase">{dbStatus === 'online' ? 'Conectado' : 'Desconectado'}</p>
          </div>
          <Database className={`w-4 h-4 ${dbStatus === 'online' ? 'text-green-400' : 'text-red-400'}`} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {dbStatus === 'offline' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium">
            <AlertCircle className="w-5 h-5" />
            A API backend não foi detectada. Certifique-se de que o servidor Node.js está rodando na porta 3001.
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Gerenciamento</h2>
            <p className="text-slate-500">Sincronizado com MySQL em tempo real</p>
          </div>
          <button 
            disabled={dbStatus === 'offline'}
            onClick={() => { setEditingClient(null); setIsFormOpen(true); }}
            className={`flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 ${dbStatus === 'offline' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus className="w-5 h-5" />
            Novo Cliente
          </button>
        </header>

        <Dashboard stats={stats} />

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pesquisar no banco..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={loadClients} className="text-xs font-bold text-indigo-600 hover:underline">Atualizar Dados</button>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-10 flex justify-center">
                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Empresa</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{client.name}</p>
                          <p className="text-sm text-slate-500">{client.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {client.company}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          client.status === ClientStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                          client.status === ClientStatus.PROSPECT ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleGetInsight(client)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                            <BrainCircuit className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingClient(client); setIsFormOpen(true); }} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-200">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(client.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                        Nenhum cliente encontrado no banco de dados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Insight Sidebar */}
      {selectedClient && (
        <aside className="w-full md:w-96 bg-white border-l border-slate-200 p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-indigo-600" />
              Nexus Insight
            </h3>
            <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-600">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Cliente Selecionado</p>
            <p className="text-lg font-bold text-slate-900">{selectedClient.name}</p>
          </div>
          {isInsightLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 text-sm">IA analisando dados do MySQL...</p>
            </div>
          ) : (
            <div className="text-slate-700 prose prose-sm max-w-none">
              {aiInsight?.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          )}
        </aside>
      )}

      {isFormOpen && (
        <ClientForm 
          client={editingClient}
          onClose={() => { setIsFormOpen(false); setEditingClient(null); }}
          onSave={handleAddOrEdit}
        />
      )}
    </div>
  );
};

export default App;
