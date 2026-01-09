
import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, UserPlus, Loader2, X, ShieldCheck, Lock, CheckSquare, Square } from 'lucide-react';
import { Employee } from '../types';
import { supabase } from '../supabaseClient';

const ADMIN_PIN = "2025";

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // حالات التحديد
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // حالات الحذف والأمان
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    position: '',
    fingerprint_id: ''
  });

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setEmployees(data || []);
    setLoading(false);
    setSelectedIds([]); // إعادة تعيين التحديد عند التحديث
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await supabase.from('employees').insert([formData]);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ name: '', department: '', position: '', fingerprint_id: '' });
      fetchEmployees();
    } else {
      alert('خطأ: ' + error.message);
    }
    setIsSaving(false);
  };

  // وظائف التحديد
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(emp => emp.id));
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
      const { error } = await supabase.from('employees').delete().in('id', targetIds);
      if (error) alert(error.message);
      else {
        fetchEmployees();
        setSelectedIds([]);
      }
      setShowSecurityModal(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 500);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.includes(searchTerm) || (emp.fingerprint_id && emp.fingerprint_id.includes(searchTerm))
  );

  return (
    <div className="relative space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الموظفين</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus size={20} />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full text-right">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو معرف البصمة..." 
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchEmployees} className="p-2 text-gray-500 hover:text-blue-600">
            <Loader2 className={loading ? 'animate-spin' : ''} size={20} />
          </button>
        </div>

        <div className="overflow-x-auto min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-blue-600">
                      {selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-6 py-4">الموظف</th>
                  <th className="px-6 py-4">القسم والمنصب</th>
                  <th className="px-6 py-4">معرف البصمة</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(emp.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleSelect(emp.id)} className={`${selectedIds.includes(emp.id) ? 'text-blue-600' : 'text-gray-300'}`}>
                        {selectedIds.includes(emp.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-start">
                        <img src={`https://picsum.photos/seed/${emp.id}/40/40`} className="w-10 h-10 rounded-full" alt="" />
                        <span className="font-bold text-gray-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{emp.position}</div>
                      <div className="text-xs text-gray-500">{emp.department}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{emp.fingerprint_id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {emp.status === 'active' ? 'نشط' : 'إجازة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button onClick={() => promptDelete([emp.id])} className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                        <Trash2 size={18} />
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
            <span className="text-xs text-slate-400">تم تحديد</span>
            <span className="text-xl font-black text-blue-400">{selectedIds.length} موظفين</span>
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

      {/* Security PIN Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden transform transition-all ${pinError ? 'animate-bounce' : 'animate-in zoom-in duration-200'}`}>
            <div className="bg-red-600 p-8 text-white text-center">
              <ShieldCheck size={48} className="mx-auto mb-4" />
              <h3 className="text-xl font-black">تحقق أمني</h3>
              <p className="text-red-100 text-sm mt-1">
                {targetIds.length > 1 ? `أنت على وشك حذف ${targetIds.length} موظفين` : 'حذف موظف'}
              </p>
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
                <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold">تأكيد</button>
                <button onClick={() => setShowSecurityModal(false)} className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 text-right">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              <h3 className="text-xl font-bold">إضافة موظف جديد</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                <input required className="w-full p-3 border rounded-xl outline-none text-right" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                  <input className="w-full p-3 border rounded-xl outline-none text-right" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المنصب</label>
                  <input className="w-full p-3 border rounded-xl outline-none text-right" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">معرف البصمة</label>
                <input required className="w-full p-3 border rounded-xl font-mono outline-none text-left" value={formData.fingerprint_id} onChange={e => setFormData({...formData, fingerprint_id: e.target.value})} />
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">حفظ الموظف</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
