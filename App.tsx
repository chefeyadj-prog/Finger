
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  FileBarChart, 
  Fingerprint, 
  Bell,
  Settings,
  Menu,
  X,
  Cpu
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import AttendanceLogs from './pages/AttendanceLogs';
import Reports from './pages/Reports';
import Devices from './pages/Devices';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { name: 'لوحة التحكم', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'الموظفين', path: '/employees', icon: <Users size={20} /> },
    { name: 'إدارة الأجهزة', path: '/devices', icon: <Cpu size={20} /> },
    { name: 'سجلات الحضور', path: '/logs', icon: <Clock size={20} /> },
    { name: 'التقارير الذكية', path: '/reports', icon: <FileBarChart size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white w-64 fixed h-full transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 z-50`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Fingerprint className="text-white" />
          </div>
          <span className="text-xl font-bold">بصمة ذكية</span>
        </div>
        
        <nav className="mt-8 px-4">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
          <button className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
            <Settings size={20} />
            <span>الإعدادات</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:mr-64' : 'mr-0'}`}>
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-md md:hidden"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="flex items-center gap-4 mr-auto">
            <button className="relative p-2 text-gray-400 hover:text-blue-600">
              <Bell size={22} />
              <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 border-r pr-4 border-gray-200">
              <div className="text-left">
                <p className="text-sm font-bold">أحمد المسؤول</p>
                <p className="text-xs text-gray-500">مدير النظام</p>
              </div>
              <img src="https://picsum.photos/40/40" alt="Admin" className="w-10 h-10 rounded-full border border-gray-300" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/logs" element={<AttendanceLogs />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
