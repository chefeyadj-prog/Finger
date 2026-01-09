import React, { useState, useEffect } from 'react';
import {
  Plus,
  Cpu,
  RefreshCw,
  Trash2,
  Fingerprint,
  Users,
  Wifi,
  Loader2,
  Activity,
  Terminal,
  XCircle,
  Hash,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { BiometricDevice, Employee, AttendanceRecord } from '../types';
import { supabase } from '../supabaseClient';
import { connectorStatus, syncUsersFromDevice, syncLogsFromDevice } from '../zkService';

const ADMIN_PIN = "2025";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// محاولات لاستخراج timestamp/userid من أي شكل جاي من zklib
function extractLogTimestamp(log: any): Date | null {
  const raw =
    log?.timestamp ??
    log?.time ??
    log?.datetime ??
    log?.dateTime ??
    log?.date ??
    log?.logTime;

  if (!raw) return null;

  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;

  // لو كان سترينج بصيغة مختلفة
  try {
    const dd = new Date(String(raw));
    return isNaN(dd.getTime()) ? null : dd;
  } catch {
    return null;
  }
}

function extractUserId(obj: any): string {
  return String(
    obj?.userid ??
    obj?.userId ??
    obj?.user_id ??
    obj?.uid ??
    obj?.id ??
    obj?.cardno ??
    ''
  ).trim();
}

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [syncingType, setSyncingType] = useState<{ id: string, type: 'users' | 'fingerprints' } | null>(null);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [showPingModal, setShowPingModal] = useState(false);

  // حالات الحماية
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    port: '4370',
    serial_number: ''
  });

  const fetchDevices = async () => {
    setLoading(true);
    const { data } = await supabase.from('devices').select('*');
    setDevices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // ✅ فحص اتصال حقيقي عبر الكونكتور
  const handleTestConnection = async (device: BiometricDevice) => {
    setPingingId(device.id);
    setPingLogs([]);
    setShowPingModal(true);

    try {
      setPingLogs(prev => [...prev, `بدء فحص الاتصال عبر Cloudflare Tunnel...`]);
      await sleep(400);

      setPingLogs(prev => [...prev, `طلب /status...`]);
      const status = await connectorStatus();
      await sleep(400);

      if (status?.ok !== true && status?.connected !== true) {
        throw new Error('الكونكتور لم يرجع حالة اتصال صحيحة.');
      }

      setPingLogs(prev => [...prev, `الكونكتور متصل ✅`]);
      setPingLogs(prev => [...prev, `connected: ${String(status?.connected ?? true)}`]);

      await supabase.from('devices').update({ status: 'online' }).eq('id', device.id);
      setPingLogs(prev => [...prev, `تم تحديث حالة الجهاز إلى online ✅`]);
    } catch (err: any) {
      setPingLogs(prev => [...prev, `فشل الاتصال ❌: ${err.message}`]);
      await supabase.from('devices').update({ status: 'offline' }).eq('id', device.id);
    } finally {
      await fetchDevices();
      setPingingId(null);
    }
  };

  // ✅ سحب موظفين حقيقيين + إدخال في employees بدون تكرار على fingerprint_id
  const handlePullEmployees = async (deviceId: string) => {
    setSyncingType({ id: deviceId, type: 'users' });

    try {
      const result = await syncUsersFromDevice();
      const users = result?.users || [];
      if (!Array.isArray(users) || users.length === 0) {
        alert('⚠️ لم يتم العثور على موظفين في جهاز البصمة.');
        return;
      }

      // تجهيز بيانات للإدخال حسب نوع Employee في مشروعك
      const toInsert: Omit<Employee, 'id'>[] = users
        .map((u: any) => {
          const fp = extractUserId(u);
          const name = String(u?.name ?? '').trim() || `User ${fp || ''}`.trim();
          return {
            name,
            department: 'مستوردة من جهاز البصمة',
            position: '—',
            fingerprint_id: fp,
            status: 'active'
          };
        })
        .filter((e: any) => e.fingerprint_id); // لا ندخل بدون معرف

      if (!toInsert.length) {
        alert('⚠️ الموظفون المسترجعون لا يحتويون على userid صالح.');
        return;
      }

      // منع التكرار: جلب الموجودين على fingerprint_id
      const ids = toInsert.map(e => e.fingerprint_id);
      const { data: existing, error: exErr } = await supabase
        .from('employees')
        .select('fingerprint_id')
        .in('fingerprint_id', ids);

      if (exErr) throw exErr;

      const existingSet = new Set((existing || []).map((e: any) => String(e.fingerprint_id)));
      const newOnes = toInsert.filter(e => !existingSet.has(String(e.fingerprint_id)));

      if (newOnes.length) {
        const { error } = await supabase.from('employees').insert(newOnes);
        if (error) throw error;
      }

      await supabase.from('devices')
        .update({ last_sync: new Date().toLocaleString('ar-EG') })
        .eq('id', deviceId);

      alert(`✅ تم استيراد (${newOnes.length}) موظف جديد. (إجمالي بالجهاز: ${users.length})`);
      fetchDevices();
    } catch (err: any) {
      alert('فشل الاستيراد: ' + err.message);
    } finally {
      setSyncingType(null);
    }
  };

  // ✅ سحب سجلات بصمة حقيقية + إدخال في attendance_logs مع منع تكرار عملي
  const handlePullFingerprints = async (deviceId: string) => {
    setSyncingType({ id: deviceId, type: 'fingerprints' });

    try {
      // نجيب الموظفين من قاعدة البيانات
      const { data: employees, error: empErr } = await supabase
        .from('employees')
        .select('id, name, fingerprint_id');

      if (empErr) throw empErr;
      if (!employees || employees.length === 0) {
        alert('⚠️ لا يوجد موظفين مسجلين. قم بسحب الموظفين أولاً.');
        return;
      }

      const empByFp = new Map<string, { id: string; name: string }>();
      for (const e of employees as any[]) {
        empByFp.set(String(e.fingerprint_id), { id: e.id, name: e.name });
      }

      const result = await syncLogsFromDevice();
      const logs = result?.logs || [];
      if (!Array.isArray(logs) || logs.length === 0) {
        alert('⚠️ لا توجد سجلات بصمة في الجهاز.');
        return;
      }

      // نحولها لسجلات حسب AttendanceRecord
      const rows: Omit<AttendanceRecord, 'id'>[] = [];
      for (const l of logs as any[]) {
        const fpId = extractUserId(l);
        const emp = empByFp.get(fpId);
        if (!emp) continue; // تجاهل سجل لا يطابق موظف عندك

        const dt = extractLogTimestamp(l);
        if (!dt) continue;

        const date = dt.toISOString().slice(0, 10);
        const check_in = dt.toTimeString().slice(0, 5);

        rows.push({
          employee_id: emp.id,
          employee_name: emp.name,
          date,
          check_in,
          status: 'present'
        });
      }

      if (!rows.length) {
        alert('⚠️ تم جلب سجلات لكن لا يوجد تطابق مع الموظفين (fingerprint_id).');
        return;
      }

      // منع تكرار عملي:
      // 1) نجمع تواريخ السجلات
      const uniqueDates = Array.from(new Set(rows.map(r => r.date))).slice(0, 20);

      // 2) نجيب الموجود في attendance_logs لهذه التواريخ فقط
      const { data: existingLogs, error: exErr } = await supabase
        .from('attendance_logs')
        .select('employee_id, date, check_in')
        .in('date', uniqueDates);

      if (exErr) throw exErr;

      const existingKey = new Set(
        (existingLogs || []).map((x: any) => `${x.employee_id}__${x.date}__${x.check_in}`)
      );

      const newRows = rows.filter(r => !existingKey.has(`${r.employee_id}__${r.date}__${r.check_in}`));

      if (!newRows.length) {
        alert('✅ لا يوجد سجلات جديدة لإضافتها (كلها موجودة مسبقًا).');
        return;
      }

      const { error } = await supabase
        .from('attendance_logs')
        .upsert(newRows, {
          onConflict: 'employee_id,date,check_in',
          ignoreDuplicates: true
        });
      
      if (error) throw error;


      await supabase.from('devices')
        .update({ last_sync: new Date().toLocaleString('ar-EG') })
        .eq('id', deviceId);

      alert(`✅ تم إضافة (${newRows.length}) سجل حضور جديد من الجهاز.`);
      fetchDevices();
    } catch (err: any) {
      alert('فشل سحب البصمات: ' + err.message);
    } finally {
      setSyncingType(null);
    }
  };

  const handleSaveDevice = async () => {
    if (!formData.name || !formData.ip || !formData.serial_number) return alert('أكمل البيانات');
    const { error } = await supabase.from('devices').insert([{
      name: formData.name,
      ip_address: formData.ip,
      port: parseInt(formData.port),
      serial_number: formData.serial_number,
      status: 'offline',
    }]);
    if (!error) {
      setIsAdding(false);
      setFormData({ name: '', ip: '', port: '4370', serial_number: '' });
      fetchDevices();
    }
  };

  const promptDelete = (id: string) => {
    setTargetId(id);
    setPinInput('');
    setPinError(false);
    setShowSecurityModal(true);
  };

  const confirmDelete = async () => {
    if (pinInput === ADMIN_PIN) {
      if (targetId) {
        await supabase.from('devices').delete().eq('id', targetId);
        fetchDevices();
      }
      setShowSecurityModal(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 500);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Cpu className="text-blue-600" /> إدارة أجهزة البصمة
          </h1>
          <p className="text-gray-500 text-sm mt-1">المزامنة الحية مع أجهزة ZKTeco.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} /> إضافة جهاز
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-blue-50 animate-in zoom-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">اسم الجهاز</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-right" placeholder="جهاز البوابة" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">IP Address</label>
              <input value={formData.ip} onChange={e => setFormData({ ...formData, ip: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-mono" placeholder="192.168.X.X" />
            </div>
            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-gray-400">المنفذ</label>
              <input value={formData.port} onChange={e => setFormData({ ...formData, port: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none" placeholder="4370" />
            </div>
            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-gray-400">الرقم التسلسلي (S/N)</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input value={formData.serial_number} onChange={e => setFormData({ ...formData, serial_number: e.target.value })} className="w-full p-4 pl-10 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-200 focus:bg-white transition-all font-mono text-sm" placeholder="S/N..." />
              </div>
            </div>
            <div className="flex items-end gap-3 lg:col-span-1">
              <button onClick={handleSaveDevice} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold">حفظ</button>
              <button onClick={() => setIsAdding(false)} className="px-4 py-4 text-gray-400">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-2xl hover:border-blue-200 transition-all duration-500">
              <div className="p-8 text-right">
                <div className="flex justify-between items-start mb-6">
                  <button
                    onClick={() => handleTestConnection(device)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  >
                    <Wifi size={24} className={pingingId === device.id ? 'animate-spin' : ''} />
                  </button>
                  <div className="flex items-center gap-5">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">{device.name}</h3>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className={`text-sm font-bold uppercase ${device.status === 'online' ? 'text-green-600' : 'text-red-500'}`}>
                          {device.status === 'online' ? 'متصل' : 'غير متصل'}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${device.status === 'online' ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></span>
                      </div>
                    </div>
                    <div className={`p-5 rounded-3xl transition-colors ${device.status === 'online' ? 'bg-green-100 text-green-600 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-gray-100 text-gray-400'}`}>
                      <Activity size={32} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">IP/Port</p>
                    <p className="font-mono text-sm font-bold text-slate-700">{device.ip_address}:{device.port}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">آخر مزامنة</p>
                    <p className="text-slate-600 text-sm font-bold truncate">{device.last_sync || '---'}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handlePullEmployees(device.id)}
                    disabled={device.status !== 'online' || !!syncingType}
                    className={`flex-1 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                      ${device.status === 'online' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-gray-100 text-gray-300'}`}
                  >
                    {syncingType?.id === device.id && syncingType.type === 'users' ? <Loader2 className="animate-spin" size={18} /> : <Users size={18} />}
                    <span>سحب الموظفين</span>
                  </button>

                  <button
                    onClick={() => handlePullFingerprints(device.id)}
                    disabled={device.status !== 'online' || !!syncingType}
                    className={`flex-1 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                      ${device.status === 'online' ? 'bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-200' : 'bg-gray-100 text-gray-300'}`}
                  >
                    {syncingType?.id === device.id && syncingType.type === 'fingerprints' ? <RefreshCw className="animate-spin" size={18} /> : <Fingerprint size={18} />}
                    <span>سجلات البصمة</span>
                  </button>
                </div>
              </div>

              <div className="px-8 py-5 bg-gray-50/50 flex justify-between items-center border-t border-gray-50">
                <button onClick={() => promptDelete(device.id)} className="text-red-300 hover:text-red-500 transition-colors p-2"><Trash2 size={18} /></button>
                <span className="text-[10px] font-bold text-gray-400 font-mono">S/N: {device.serial_number}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden transform transition-all ${pinError ? 'animate-bounce' : 'animate-in zoom-in duration-200'}`}>
            <div className="bg-red-600 p-8 text-white text-center">
              <ShieldAlert size={48} className="mx-auto mb-4" />
              <h3 className="text-xl font-black">حذف الجهاز</h3>
              <p className="text-red-100 text-sm mt-1">يرجى إدخال الرقم السري للتأكيد</p>
            </div>
            <div className="p-8">
              <div className="relative mb-6">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input
                  type="password"
                  autoFocus
                  className="w-full p-4 pr-12 bg-gray-50 rounded-2xl border-2 text-center text-2xl font-black tracking-[1em] outline-none border-transparent focus:border-blue-500"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmDelete()}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold">حذف نهائي</button>
                <button onClick={() => setShowSecurityModal(false)} className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ping Modal */}
      {showPingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800 text-white">
              <button onClick={() => setShowPingModal(false)}><XCircle size={24} /></button>
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <span>تشخيص الاتصال</span>
                <Terminal size={20} />
              </div>
            </div>
            <div className="p-8 font-mono text-sm space-y-2 text-slate-300 text-right">
              {pingLogs.map((log, i) => (
                <div key={i} className="flex justify-end gap-2">
                  <span>{log}</span>
                  <span className="text-blue-500 shrink-0">{'<'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
