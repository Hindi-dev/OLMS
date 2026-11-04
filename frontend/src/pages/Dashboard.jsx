import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { 
  Mail, 
  Clock, 
  AlertTriangle, 
  GraduationCap, 
  CheckCircle2, 
  FileText, 
  Award, 
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';

export const Dashboard = ({ setActiveTab }) => {
  const { t } = useLanguage();
  const [dakStats, setDakStats] = useState({ total: 0, pending: 0, in_progress: 0, urgent_unresolved: 0 });
  const [rosterStats, setRosterStats] = useState({ total_employees: 0, by_category: {}, nomination_stats: {} });
  const [recentDak, setRecentDak] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dakSummary, rosterSummary, dakList] = await Promise.all([
        api.getDakSummary(),
        api.getRosterSummary(),
        api.getDak('?limit=5')
      ]);
      setDakStats(dakSummary);
      setRosterStats(rosterSummary);
      setRecentDak(dakList.slice(0, 5));
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-rajbhasha-navy to-slate-800 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-rajbhasha-saffron">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-medium border border-amber-400/20">
              केंद्रीय प्रशासनिक कार्यप्रणाली
            </span>
            <span className="text-xs text-slate-300">क्षेत्र: 'क' (Region A)</span>
          </div>
          <h2 className="text-2xl font-bold mt-1 text-white">राजभाषा अनुपालन एवं प्रशासनिक डैशबोर्ड</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            गृह मंत्रालय, राजभाषा विभाग के वार्षिक कार्यक्रम के अनुरूप डाक प्रबंधन, हिंदी प्रशिक्षण रोस्टर, अनुवाद संदर्भ एवं धारा 3(3) अनुपालन।
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center space-x-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg border border-white/20 transition self-end md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>रिफ्रेश</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Dak */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('totalDak')}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{dakStats.total}</h3>
            <p className="text-xs text-slate-400 mt-0.5">प्रक्रियाधीन: {dakStats.in_progress}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Dak */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('pendingDak')}</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{dakStats.pending}</h3>
            <p className="text-xs text-amber-700 mt-0.5 font-medium">कार्रवाई हेतु अपेक्षित</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Urgent Unresolved Dak */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('urgentDak')}</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{dakStats.urgent_unresolved}</h3>
            <p className="text-xs text-rose-700 mt-0.5 font-medium">शीघ्र निस्तारण योग्य</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Training Roster Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">कर्मचारी रोस्टर</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{rosterStats.total_employees}</h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              क:{rosterStats.by_category?.A || 0} | ख:{rosterStats.by_category?.B || 0} | ग:{rosterStats.by_category?.C || 0} | घ:{rosterStats.by_category?.D || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Quick Access Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div 
          onClick={() => setActiveTab('converter')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-rajbhasha-navy hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-50 text-rajbhasha-navy rounded-lg group-hover:bg-rajbhasha-navy group-hover:text-white transition">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rajbhasha-navy transition" />
          </div>
          <h4 className="font-bold text-slate-800 mt-3 group-hover:text-rajbhasha-navy">दस्तावेज़ रूपांतरण इंजन</h4>
          <p className="text-xs text-slate-500 mt-1">
            किसी भी पीडीएफ (स्कैन अथवा डिजिटल) को देवनागरी यूनिकोड एवं फॉन्ट अखंडता के साथ संपादन योग्य DOCX में बदलें।
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('dak')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-600 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
              <Mail className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
          </div>
          <h4 className="font-bold text-slate-800 mt-3 group-hover:text-amber-700">काम एवं डाक ट्रैकर</h4>
          <p className="text-xs text-slate-500 mt-1">
            आवक डाक रजिस्टर करें, प्राथमिकता एवं अंतिम तिथि दर्ज करें तथा अनुभागवार निस्तारण की स्थिति ट्रैक करें।
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('compliance')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
              <Award className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <h4 className="font-bold text-slate-800 mt-3 group-hover:text-emerald-700">धारा 3(3) एवं क्यूपीआर सहायक</h4>
          <p className="text-xs text-slate-500 mt-1">
            14 वैधानिक द्विभाषी श्रेणियों की जांच करें और गृह मंत्रालय के निर्धारित लक्ष्यों के विरुद्ध स्वतः अंतराल विश्लेषण प्राप्त करें।
          </p>
        </div>

      </div>

      {/* Recent Inward Dak Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-800 text-sm">{t('recentDak')}</h3>
          </div>
          <button
            onClick={() => setActiveTab('dak')}
            className="text-xs text-rajbhasha-navy font-semibold hover:underline flex items-center gap-1"
          >
            सभी डाक देखें &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">डाक क्रमांक</th>
                <th className="px-4 py-3">प्राप्ति तिथि</th>
                <th className="px-4 py-3">प्रेषक / विभाग</th>
                <th className="px-4 py-3">विषय</th>
                <th className="px-4 py-3">प्राथमिकता</th>
                <th className="px-4 py-3">स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDak.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">कोई हालिया डाक उपलब्ध नहीं है</td>
                </tr>
              ) : (
                recentDak.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{d.dak_unique_no}</td>
                    <td className="px-4 py-3">{d.receipt_date}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{d.sender_name || d.sender_department || '-'}</td>
                    <td className="px-4 py-3 font-devanagari max-w-xs truncate" title={d.subject_hi}>{d.subject_hi}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        d.priority === 'Urgent' || d.priority === 'Top Priority' || d.priority === 'Immediate'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        d.current_status === 'Dispatched'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : d.current_status === 'Disposed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : d.current_status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {d.current_status === 'Dispatched'
                          ? 'निर्गमित (Dispatched)'
                          : d.current_status === 'Disposed'
                          ? 'निस्तारित'
                          : d.current_status === 'In Progress'
                          ? 'प्रक्रियाधीन'
                          : 'लंबित'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
