
import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Clock, Activity, Cpu, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '../supabaseClient';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    onlineDevices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      // جلب إجمالي الموظفين
      const { count: empCount } = await supabase.from('employees').select('*', { count: 'exact', head: true });
      // جلب سجلات اليوم
      const today = new Date().toISOString().split('T')[0];
      const { data: logs } = await supabase.from('attendance_logs').select('*').eq('date', today);
      // جلب الأجهزة المتصلة
      const { count: devCount } = await supabase.from('devices').select('*', { count: 'exact', head: true }).eq('status', 'online');

      setStats({
        totalEmployees: empCount || 0,
        presentToday: logs?.filter(l => l.status === 'present').length || 0,
        lateToday: logs?.filter(l => l.status === 'late').length || 0,
        onlineDevices: devCount || 0
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-500 font-bold">جاري تحليل بيانات النظام...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">نظرة عامة على النظام</h1>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${stats.onlineDevices > 0 ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-red-100 text-red-700'}`}>
          <Cpu size={16} />
          <span>{stats.onlineDevices > 0 ? `متصل (${stats.onlineDevices} جهاز)` : 'لا توجد أجهزة متصلة'}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الموظفين" value={stats.totalEmployees.toString()} icon={<Users className="text-blue-600" />} change="العدد الكلي المسجل" color="bg-blue-50" />
        <StatCard title="الحاضرون اليوم" value={stats.presentToday.toString()} icon={<UserCheck className="text-green-600" />} change="من سجلات البصمة" color="bg-green-50" />
        <StatCard title="المتأخرون" value={stats.lateToday.toString()} icon={<Clock className="text-orange-600" />} change="بناءً على وقت الدخول" color="bg-orange-50" />
        <StatCard title="الأجهزة النشطة" value={stats.onlineDevices.toString()} icon={<Cpu className="text-purple-600" />} change="الأجهزة المرتبطة حالياً" color="bg-purple-50" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6">إحصائيات الحضور (أسبوعية)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'الأحد', present: 45, late: 5 },
                { name: 'الاثنين', present: 48, late: 2 },
                { name: 'الثلاثاء', present: 47, late: 3 },
                { name: 'الأربعاء', present: 42, late: 8 },
                { name: 'الخميس', present: 46, late: 4 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="#3b82f6" name="حاضر" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#f97316" name="تأخير" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6">نشاط الحركات الحية</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { time: '8:00', hits: 12 },
                { time: '9:00', hits: 35 },
                { time: '14:00', hits: 25 },
                { time: '16:00', hits: 40 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hits" stroke="#3b82f6" strokeWidth={2} name="عمليات البصم" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, change, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h4 className="text-3xl font-bold mb-2">{value}</h4>
      <p className="text-xs text-gray-400">{change}</p>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      {icon}
    </div>
  </div>
);

export default Dashboard;
