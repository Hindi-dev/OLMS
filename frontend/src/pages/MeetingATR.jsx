import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { 
  Users, 
  FileText, 
  Plus, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Sparkles, 
  X,
  History,
  FileCheck
} from 'lucide-react';

export const MeetingATR = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('meetings'); // meetings or atr
  const [meetings, setMeetings] = useState([]);
  const [atrItems, setAtrItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atrFilter, setAtrFilter] = useState('');
  
  // Modals
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedResForAtr, setSelectedResForAtr] = useState(null);
  const [isAtrModalOpen, setIsAtrModalOpen] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);

  // Forms
  const [meetingForm, setMeetingForm] = useState({
    meeting_type: 'OLIC',
    meeting_number: '57th OLIC Meeting',
    quarter: 'Q4 (जनवरी - मार्च)',
    financial_year: '2025-2026',
    meeting_date: new Date().toISOString().split('T')[0],
    venue: 'मुख्यालय समिति कक्ष',
    chairperson_name: 'श्री आलोक वर्मा',
    chairperson_designation: 'महाप्रबंधक',
    attendees_list: '1. श्री आलोक वर्मा (अध्यक्ष)\n2. सदस्य सचिव एवं सभी विभागाध्यक्ष',
    agenda_items: [
      {
        item_number: 1,
        title_hi: 'विगत बैठक के कार्यवृत्त की पुष्टि एवं अनुपालन रिपोर्ट (ATR)',
        title_en: 'Confirmation of Minutes & Review of ATR',
        discussion_summary: 'समिति द्वारा विगत बैठक के निर्णयों की समीक्षा की गई।',
        resolutions: [
          {
            resolution_number: 'OLIC/57/RES-01',
            decision_text_hi: 'सभी विभागों से शेष अनुपालन रिपोर्ट 15 दिनों में प्राप्त की जाए।',
            responsible_officer: 'अनुभाग अधिकारी (प्रशासन)',
            responsible_department: 'प्रशासन शाखा',
            target_date: '2026-04-15',
            resolution_status: 'Open'
          }
        ]
      }
    ]
  });

  const [atrForm, setAtrForm] = useState({
    action_taken_summary: '',
    current_status: 'Complied',
    reporting_officer: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [mList, aList] = await Promise.all([
        api.getMeetings(),
        api.getAtrItems(atrFilter)
      ]);
      setMeetings(mList);
      setAtrItems(aList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [atrFilter]);

  const handleGenerateMinutes = async (meetingId) => {
    setGeneratingId(meetingId);
    try {
      const res = await api.generateMinutesDocx(meetingId);
      loadData();
      window.open(res.download_url, '_blank');
    } catch (err) {
      alert("कार्यवृत्त दस्तावेज़ निर्माण में त्रुटि: " + err.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      await api.createMeeting(meetingForm);
      setIsMeetingModalOpen(false);
      loadData();
    } catch (err) {
      alert("बैठक दर्ज करने में त्रुटि: " + err.message);
    }
  };

  const handleRecordAtr = async (e) => {
    e.preventDefault();
    if (!selectedResForAtr) return;
    try {
      await api.recordAtr({
        resolution_id: selectedResForAtr.resolution_id,
        ...atrForm
      });
      setIsAtrModalOpen(false);
      setSelectedResForAtr(null);
      setAtrForm({ action_taken_summary: '', current_status: 'Complied', reporting_officer: '' });
      loadData();
    } catch (err) {
      alert("एटीआर अद्यतन में त्रुटि: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-rajbhasha-navy" />
            <span>राकास/नराकास कार्यवृत्त एवं कार्रवाई रिपोर्ट (OLIC / ATR Tracker)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            राजभाषा कार्यान्वयन समिति की त्रैमासिक बैठकों का कार्यवृत्त प्रारूपण, संकल्प निर्माण एवं कार्रवाई की गई रिपोर्ट (Action Taken Report)।
          </p>
        </div>

        <button
          onClick={() => setIsMeetingModalOpen(true)}
          className="flex items-center space-x-1.5 bg-rajbhasha-navy hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs shadow transition shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>नई बैठक पंजीकृत करें</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('meetings')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'meetings'
              ? 'border-rajbhasha-navy text-rajbhasha-navy bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>बैठकें एवं कार्यवृत्त (Meetings & Minutes)</span>
        </button>

        <button
          onClick={() => setActiveTab('atr')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'atr'
              ? 'border-rajbhasha-navy text-rajbhasha-navy bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>कार्रवाई की गई रिपोर्ट (Action Taken Report - ATR)</span>
        </button>
      </div>

      {/* Content: Meetings View */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              बैठक सूची लोड हो रही है...
            </div>
          ) : meetings.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              कोई बैठक उपलब्ध नहीं मिली
            </div>
          ) : (
            meetings.map((m) => (
              <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">
                        {m.meeting_type === 'OLIC' ? 'राजभाषा कार्यान्वयन समिति (राकास)' : 'नगर राजभाषा कार्यान्वयन समिति (नराकास)'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px]">
                        {m.quarter} ({m.financial_year})
                      </span>
                    </div>
                    <div className="text-slate-500 mt-1 flex items-center gap-3 text-[11px]">
                      <span>तिथि: <strong className="text-slate-700">{m.meeting_date}</strong></span>
                      <span>स्थान: <strong className="text-slate-700">{m.venue || '-'}</strong></span>
                      <span>अध्यक्षता: <strong className="text-slate-700">{m.chairperson_name} ({m.chairperson_designation})</strong></span>
                    </div>
                  </div>

                  {/* 1-Click DOCX Minutes Generator */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleGenerateMinutes(m.id)}
                      disabled={generatingId === m.id}
                      className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-lg shadow text-xs transition disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{generatingId === m.id ? 'कार्यवृत्त तैयार हो रहा है...' : 'कार्यवृत्त वर्ड (.docx) बनाएं'}</span>
                    </button>

                    {m.minutes_filepath && (
                      <a
                        href={`/api/meetings/download-minutes/${m.minutes_filepath.split(/[\\/]/).pop()}`}
                        download
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition"
                        title="पूर्व में निर्मित कार्यवृत्त डाउनलोड करें"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Agenda Items & Resolutions */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    कार्यसूची एवं पारित संकल्प:
                  </span>

                  {m.agenda_items?.map((ag) => (
                    <div key={ag.id} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-800 font-devanagari flex items-center gap-2">
                        <span className="bg-white text-rajbhasha-navy px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                          मद {ag.item_number}
                        </span>
                        <span>{ag.title_hi}</span>
                      </div>
                      
                      {ag.discussion_summary && (
                        <p className="text-slate-600 text-[11px]">{ag.discussion_summary}</p>
                      )}

                      {ag.resolutions?.map((res) => (
                        <div key={res.id} className="bg-white p-2.5 rounded border border-slate-200 flex items-start justify-between gap-3 text-[11px]">
                          <div>
                            <div className="font-bold text-slate-700">{res.resolution_number}:</div>
                            <div className="font-devanagari text-slate-900 mt-0.5">{res.decision_text_hi}</div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              उत्तरदायी: {res.responsible_officer} ({res.responsible_department}) | लक्ष्य: {res.target_date || 'शीघ्र'}
                            </div>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            res.resolution_status === 'Complied'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {res.resolution_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* Content: ATR Master Tracker View */}
      {activeTab === 'atr' && (
        <div className="space-y-4">
          
          {/* ATR Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
            <div className="font-bold text-slate-800">
              संकल्पवार कार्रवाई की गई रिपोर्ट (Action Taken Reports)
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">स्थिति:</span>
              <select
                value={atrFilter}
                onChange={(e) => setAtrFilter(e.target.value)}
                className="py-1 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none"
              >
                <option value="">सभी संकल्प (All)</option>
                <option value="Open">खुले / लंबित (Open)</option>
                <option value="In-Progress">प्रगति पर (In-Progress)</option>
                <option value="Complied">अनुपालन पूर्ण (Complied)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">संकल्प संख्या</th>
                    <th className="px-4 py-3">बैठक / सत्र</th>
                    <th className="px-4 py-3">निर्णय / संकल्प (हिंदी)</th>
                    <th className="px-4 py-3">उत्तरदायी अधिकारी</th>
                    <th className="px-4 py-3">अंतिम कार्रवाई (ATR Summary)</th>
                    <th className="px-4 py-3">स्थिति</th>
                    <th className="px-4 py-3 text-right">अपडेट</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">एटीआर रिकॉर्ड लोड हो रहे हैं...</td>
                    </tr>
                  ) : atrItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">कोई संकल्प नहीं मिला</td>
                    </tr>
                  ) : (
                    atrItems.map((item) => {
                      const latestAtr = item.atrs?.length ? item.atrs[item.atrs.length - 1] : null;
                      return (
                        <tr key={item.resolution_id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-mono font-medium text-slate-900">{item.resolution_number}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-semibold">{item.meeting_quarter}</span>
                            <div className="text-[10px] text-slate-400">{item.financial_year}</div>
                          </td>
                          <td className="px-4 py-3 font-devanagari max-w-xs">
                            <div className="font-medium text-slate-900">{item.decision_text_hi}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">लक्ष्य तिथि: {item.target_date || 'शीघ्र'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{item.responsible_officer}</div>
                            <div className="text-[10px] text-slate-400">{item.responsible_department}</div>
                          </td>
                          <td className="px-4 py-3 max-w-xs font-devanagari">
                            {latestAtr ? (
                              <div>
                                <div className="text-slate-800">{latestAtr.action_taken_summary}</div>
                                <div className="text-[10px] text-slate-400">({latestAtr.report_date} - {latestAtr.reporting_officer || ''})</div>
                              </div>
                            ) : (
                              <span className="text-amber-700 italic">कार्रवाई रिपोर्ट प्रतीक्षित</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.resolution_status === 'Complied'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.resolution_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => { setSelectedResForAtr(item); setIsAtrModalOpen(true); }}
                              className="text-xs text-rajbhasha-navy font-semibold hover:underline bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                            >
                              एटीआर जोड़ें
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Modal: Add ATR Status */}
      {isAtrModalOpen && selectedResForAtr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <h3 className="font-bold text-sm">कार्रवाई रिपोर्ट (ATR) दर्ज करें</h3>
              <button onClick={() => setIsAtrModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordAtr} className="p-5 space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-mono text-slate-500 font-bold">{selectedResForAtr.resolution_number}</div>
                <div className="font-devanagari text-slate-800 mt-1">{selectedResForAtr.decision_text_hi}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">की गई कार्रवाई का विवरण (Action Taken Summary): *</label>
                <textarea
                  required
                  rows={3}
                  value={atrForm.action_taken_summary}
                  onChange={(e) => setAtrForm({...atrForm, action_taken_summary: e.target.value})}
                  placeholder="उदा. आदेश जारी कर दिए गए हैं एवं शत-प्रतिशत अनुपालन सुनिश्चित किया गया है..."
                  className="w-full p-2 border border-slate-300 rounded-lg font-devanagari"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">प्रतिवेदक अधिकारी (Reporting Officer):</label>
                <input
                  type="text"
                  value={atrForm.reporting_officer}
                  onChange={(e) => setAtrForm({...atrForm, reporting_officer: e.target.value})}
                  placeholder="उदा. अनुभाग अधिकारी"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">संकल्प की अद्यतन स्थिति (Resolution Status):</label>
                <select
                  value={atrForm.current_status}
                  onChange={(e) => setAtrForm({...atrForm, current_status: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Complied">अनुपालन पूर्ण (Complied / Closed)</option>
                  <option value="In-Progress">प्रगति पर (In-Progress / Ongoing)</option>
                  <option value="Open">खुला (Open / Pending)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAtrModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rajbhasha-navy text-white rounded-lg hover:bg-slate-800 font-medium"
                >
                  एटीआर सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Meeting */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs max-h-[90vh] flex flex-col">
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <h3 className="font-bold text-sm">राकास बैठक विवरण पंजीकृत करें</h3>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-5 space-y-3 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">समिति प्रकार (Committee):</label>
                  <select
                    value={meetingForm.meeting_type}
                    onChange={(e) => setMeetingForm({...meetingForm, meeting_type: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="OLIC">राकास (OLIC)</option>
                    <option value="TOLIC">नराकास (TOLIC)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">बैठक संख्या:</label>
                  <input
                    type="text"
                    value={meetingForm.meeting_number}
                    onChange={(e) => setMeetingForm({...meetingForm, meeting_number: e.target.value})}
                    placeholder="उदा. 57th Meeting"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">तिमाही (Quarter):</label>
                  <select
                    value={meetingForm.quarter}
                    onChange={(e) => setMeetingForm({...meetingForm, quarter: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Q1 (अप्रैल - जून)">Q1 (अप्रैल - जून)</option>
                    <option value="Q2 (जुलाई - सितंबर)">Q2 (जुलाई - सितंबर)</option>
                    <option value="Q3 (अक्टूबर - दिसंबर)">Q3 (अक्टूबर - दिसंबर)</option>
                    <option value="Q4 (जनवरी - मार्च)">Q4 (जनवरी - मार्च)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">वित्तीय वर्ष (Financial Year):</label>
                  <input
                    type="text"
                    value={meetingForm.financial_year}
                    onChange={(e) => setMeetingForm({...meetingForm, financial_year: e.target.value})}
                    placeholder="2025-2026"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">बैठक की तिथि: *</label>
                  <input
                    type="date"
                    required
                    value={meetingForm.meeting_date}
                    onChange={(e) => setMeetingForm({...meetingForm, meeting_date: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">स्थान (Venue):</label>
                  <input
                    type="text"
                    value={meetingForm.venue}
                    onChange={(e) => setMeetingForm({...meetingForm, venue: e.target.value})}
                    placeholder="मुख्यालय सम्मेलन कक्ष"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">अध्यक्ष का नाम: *</label>
                  <input
                    type="text"
                    required
                    value={meetingForm.chairperson_name}
                    onChange={(e) => setMeetingForm({...meetingForm, chairperson_name: e.target.value})}
                    placeholder="श्री आलोक वर्मा"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">अध्यक्ष का पदनाम: *</label>
                  <input
                    type="text"
                    required
                    value={meetingForm.chairperson_designation}
                    onChange={(e) => setMeetingForm({...meetingForm, chairperson_designation: e.target.value})}
                    placeholder="महाप्रबंधक"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">उपस्थिति विवरण:</label>
                <textarea
                  rows={2}
                  value={meetingForm.attendees_list}
                  onChange={(e) => setMeetingForm({...meetingForm, attendees_list: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rajbhasha-navy text-white rounded-lg hover:bg-slate-800 font-medium"
                >
                  बैठक सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
