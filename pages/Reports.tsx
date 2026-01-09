
import React, { useState } from 'react';
import { Sparkles, FileText, Loader2, Download, CheckCircle2 } from 'lucide-react';
import { generateAttendanceReport } from '../geminiService';
import { AttendanceRecord } from '../types';

// Fix: Updated property names to match AttendanceRecord interface (snake_case) to resolve "Object literal may only specify known properties" errors.
const MOCK_RECORDS: AttendanceRecord[] = [
  { id: '1', employee_id: 'E1', employee_name: 'أحمد علي', check_in: '08:00', check_out: '16:00', date: '2024-05-01', status: 'present' },
  { id: '2', employee_id: 'E1', employee_name: 'أحمد علي', check_in: '08:30', check_out: '16:00', date: '2024-05-02', status: 'late' },
  { id: '3', employee_id: 'E2', employee_name: 'فاطمة الزهراء', check_in: '07:55', check_out: '16:00', date: '2024-05-01', status: 'present' },
  { id: '4', employee_id: 'E2', employee_name: 'فاطمة الزهراء', check_in: '07:58', check_out: '16:05', date: '2024-05-02', status: 'present' },
];

const Reports: React.FC = () => {
  const [reportText, setReportText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    const result = await generateAttendanceReport(MOCK_RECORDS);
    setReportText(result || '');
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-full mb-2">
          <Sparkles size={32} />
        </div>
        <h1 className="text-3xl font-bold">التقارير التحليلية الذكية</h1>
        <p className="text-gray-500 text-lg">استخدم قوة الذكاء الاصطناعي لتحليل بيانات الحضور واستخلاص الرؤى.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold mb-1">تقرير أداء الموظفين</h3>
            <p className="text-blue-100 text-sm">تحليل شامل لشهر مايو 2024</p>
          </div>
          <button 
            onClick={handleGenerateReport}
            disabled={loading}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
            {loading ? 'جاري التحليل...' : 'إنشاء تقرير ذكي'}
          </button>
        </div>

        <div className="p-8 min-h-[400px]">
          {!reportText && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
              <FileText size={64} strokeWidth={1} className="mb-4 opacity-20" />
              <p>اضغط على "إنشاء تقرير ذكي" لبدء تحليل البيانات</p>
            </div>
          ) : loading ? (
            <div className="space-y-4 py-10">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3"></div>
            </div>
          ) : (
            <div className="prose prose-blue max-w-none animate-in fade-in duration-500 rtl">
              <div className="flex items-center gap-2 text-green-600 mb-6 bg-green-50 p-4 rounded-lg">
                <CheckCircle2 size={20} />
                <span className="font-bold">تم إنشاء التقرير بنجاح بناءً على أحدث سجلات البصمة.</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-gray-700 text-right">
                {reportText}
              </div>
              
              <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download size={18} />
                  <span>تحميل بصيغة PDF</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <span>مشاركة مع الإدارة</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
          title="دقة متناهية" 
          desc="ربط مباشر مع أجهزة البصمة لضمان صحة البيانات." 
          icon={<CheckCircle2 className="text-blue-500" />}
        />
        <FeatureCard 
          title="تنبيهات فورية" 
          desc="إرسال تنبيهات تلقائية للمتأخرين أو المتغيبين." 
          icon={<Sparkles className="text-orange-500" />}
        />
        <FeatureCard 
          title="تحليل ذكي" 
          desc="اكتشاف أنماط الحضور وتقديم توصيات لتحسين العمل." 
          icon={<FileText className="text-green-500" />}
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ title, desc, icon }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <div className="mb-4">{icon}</div>
    <h4 className="font-bold mb-2">{title}</h4>
    <p className="text-sm text-gray-500">{desc}</p>
  </div>
);

export default Reports;
