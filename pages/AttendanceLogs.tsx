
import React, { useState, useEffect } from 'react';
import { Calendar, Download, Loader2, UserCircle, Trash2, ShieldCheck, CheckSquare, Square, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { AttendanceRecord } from '../types';

const ADMIN_PIN = "2025";

const AttendanceLogs: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات التحديد
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // حالات الحماية والحذف
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .order('date', { ascending: false })
      .order('check_in', { ascending: false });

    if (!error) setLogs(data || []);
    setLoading(false);
    setSelectedIds([]);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // وظائف التحديد
  const toggleSelectAll = () => {
    if (selectedIds.length === logs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map(log => log.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const promptDelete = (ids: string[]) => {
    setTargetIds(ids);
    setPinInput('');
    setPinError(false);
    setShowSecurityModal(true);
  };

  const confirmDelete = async () => {
    if (pinInput === ADMIN_PIN) {
      const { error } = await supabase.from('attendance_logs').delete().in('id', targetIds);
      if (error) alert(error.message);
      else {
        fetchLogs();
        setSelectedIds([]);
      }
      setShowSecurityModal(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 500);
    }
  };

  return (
    <div className="relative space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">سجلات الحضور اليومية</h1>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={18} />
            <span>تصدير Excel</span>
          </button>
          <button onClick={fetchLogs} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Calendar size={18} />}
            <span>تحديث السجلات</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-blue-600">
                      {selectedIds.length === logs.length && logs.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right">التاريخ</th>
                  <th className="px-6 py-4 text-right">الموظف</th>
                  <th className="px-6 py-4 text-right">وقت الحضور</th>
                  <th className="px-6 py-4 text-right">وقت الانصراف</th>
                  <th className="px-6 py-4 text-right">الحالة</th>
                  <th className="px-6 py-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(log.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleSelect(log.id)} className={`${selectedIds.includes(log.id) ? 'text-blue-600' : 'text-gray-300'}`}>
                        {selectedIds.includes(log.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{log.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-start gap-2">
                        <UserCircle size={16} className="text-gray-400" />
                        <span className="font-bold">{log.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-blue-600 font-mono">{log.check_in || '--:--'}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{log.check_out || '--:--'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        log.status === 'present' ? 'bg-green-100 text-green-700' : 
                        log.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status === 'present' ? 'منتظم' : log.status === 'late' ? 'تأخير' : 'غائب'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button onClick={() => promptDelete([log.id])} className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-300 z-[70]">
          <div className="flex flex-col border-l border-slate-700 pl-8">
            <span className="text-xs text-slate-400">تم اختيار</span>
            <span className="text-xl font-black text-blue-400">{selectedIds.length} سجلات</span>
          </div>
          <button 
            onClick={() => promptDelete(selectedIds)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/20"
          >
            <Trash2 size={18} />
            <span>حذف المحدد</span>
          </button>
          <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white transition-colors">إلغاء</button>
        </div>
      )}

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden transform transition-all ${pinError ? 'animate-bounce' : 'animate-in zoom-in duration-200'}`}>
            <div className="bg-red-600 p-8 text-white text-center">
              <ShieldCheck size={48} className="mx-auto mb-4" />
              <h3 className="text-xl font-black">حذف جماعي</h3>
              <p className="text-red-100 text-sm mt-1">سيتم حذف {targetIds.length} سجل من قاعدة البيانات</p>
            </div>
            <div className="p-8">
              <input 
                type="password"
                autoFocus
                className="w-full p-4 mb-6 bg-gray-50 rounded-2xl border-2 text-center text-2xl font-black tracking-[1em] outline-none border-transparent focus:border-blue-500"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmDelete()}
              />
              <div className="flex gap-3">
                <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold">تأكيد الحذف</button>
                <button onClick={() => setShowSecurityModal(false)} className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold">تجاهل</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceLogs;
