import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Paperclip, 
  FileText, 
  X,
  History,
  Send
} from 'lucide-react';

export const DakTracker = () => {
  const { t } = useLanguage();
  const [dakList, setDakList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDak, setSelectedDak] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  
  // New Dak form
  const [newDak, setNewDak] = useState({
    subject_hi: '',
    subject_en: '',
    sender_name: '',
    sender_department: '',
    sender_region: 'A',
    letter_no: '',
    letter_date: '',
    receipt_date: new Date().toISOString().split('T')[0],
    category: 'General',
    priority: 'Normal',
    target_date: '',
    assigned_to: '',
    summary_notes: ''
  });

  // Action form
  const [actionForm, setActionForm] = useState({
    action_taken_by: '',
    action_details: '',
    status_after_action: 'In Progress'
  });

  const loadDak = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      if (statusFilter) queryParams.push(`status=${encodeURIComponent(statusFilter)}`);
      if (priorityFilter) queryParams.push(`priority=${encodeURIComponent(priorityFilter)}`);
      if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      const qs = queryParams.length ? `?${queryParams.join('&')}` : '';
      const data = await api.getDak(qs);
      setDakList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDak();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDak();
  };

  const handleCreateDak = async (e) => {
    e.preventDefault();
    if (!newDak.subject_hi) return;
    try {
      const payload = {
        ...newDak,
        letter_date: newDak.letter_date?.trim() ? newDak.letter_date : null,
        target_date: newDak.target_date?.trim() ? newDak.target_date : null,
        receipt_date: newDak.receipt_date?.trim() ? newDak.receipt_date : new Date().toISOString().split('T')[0],
      };
      await api.createDak(payload);
      setIsAddModalOpen(false);
      setNewDak({
        subject_hi: '',
        subject_en: '',
        sender_name: '',
        sender_department: '',
        sender_region: 'A',
        letter_no: '',
        letter_date: '',
        receipt_date: new Date().toISOString().split('T')[0],
        category: 'General',
        priority: 'Normal',
        target_date: '',
        assigned_to: '',
        summary_notes: ''
      });
      loadDak();
    } catch (err) {
      alert("डाक जोड़ने में त्रुटि: " + err.message);
    }
  };

  const handleAddAction = async (e) => {
    e.preventDefault();
    if (!selectedDak || !actionForm.action_details) return;
    try {
      await api.addDakAction(selectedDak.id, actionForm);
      setActionModalOpen(false);
      setActionForm({
        action_taken_by: '',
        action_details: '',
        status_after_action: 'In Progress'
      });
      loadDak();
      // Reload selected dak
      const updated = await api.getDak(`/${selectedDak.id}`);
      setSelectedDak(updated);
    } catch (err) {
      alert("कार्रवाई जोड़ने में त्रुटि: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-rajbhasha-navy" />
            <span>आवक डाक एवं कार्य ट्रैकर (Inward Dak & Task Tracker)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            राजभाषा से संबंधित प्राप्त पत्राचार, परिपत्र, निर्देश एवं समयबद्ध कार्यों का पंजीकरण व निगरानी।
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1.5 bg-rajbhasha-navy hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs shadow transition shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>नया डाक दर्ज करें</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="डाक क्रमांक, विषय या प्रेषक से खोजें..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rajbhasha-navy focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </form>

        {/* Filters */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">स्थिति:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none"
            >
              <option value="">सभी (All)</option>
              <option value="Pending">लंबित (Pending)</option>
              <option value="In Progress">प्रक्रियाधीन (In Progress)</option>
              <option value="Dispatched">निर्गमित / प्रेषित (Dispatched)</option>
              <option value="Disposed">निस्तारित (Disposed)</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">प्राथमिकता:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none"
            >
              <option value="">सभी (All)</option>
              <option value="Normal">सामान्य (Normal)</option>
              <option value="Urgent">आवश्यक (Urgent)</option>
              <option value="Top Priority">अति आवश्यक (Top Priority)</option>
              <option value="Immediate">तत्काल (Immediate)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Dak Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">डाक क्रमांक</th>
                <th className="px-4 py-3">प्राप्ति तिथि</th>
                <th className="px-4 py-3">प्रेषक / विभाग</th>
                <th className="px-4 py-3">पत्र संख्या एवं तिथि</th>
                <th className="px-4 py-3">विषय (हिंदी)</th>
                <th className="px-4 py-3">प्राथमिकता</th>
                <th className="px-4 py-3">लक्ष्य तिथि</th>
                <th className="px-4 py-3">स्थिति</th>
                <th className="px-4 py-3 text-right">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">डाक सूची लोड हो रही है...</td>
                </tr>
              ) : dakList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">कोई डाक रिकॉर्ड उपलब्ध नहीं मिला</td>
                </tr>
              ) : (
                dakList.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{d.dak_unique_no}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{d.receipt_date}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{d.sender_name || '-'}</div>
                      <div className="text-[11px] text-slate-400">{d.sender_department || '-'} (क्षेत्र: {d.sender_region})</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{d.letter_no || '-'}</div>
                      <div className="text-[11px] text-slate-400">{d.letter_date || ''}</div>
                    </td>
                    <td className="px-4 py-3 font-devanagari max-w-sm">
                      <div className="font-medium text-slate-900 line-clamp-2" title={d.subject_hi}>{d.subject_hi}</div>
                      {d.subject_en && <div className="text-[11px] text-slate-400 italic line-clamp-1">{d.subject_en}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        d.priority === 'Urgent' || d.priority === 'Top Priority' || d.priority === 'Immediate'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {d.target_date ? (
                        <span className="font-medium text-amber-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {d.target_date}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        d.current_status === 'Dispatched'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : d.current_status === 'Disposed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : d.current_status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {d.current_status === 'Dispatched'
                          ? 'निर्गमित / प्रेषित'
                          : d.current_status === 'Disposed'
                          ? 'निस्तारित'
                          : d.current_status === 'In Progress'
                          ? 'प्रक्रियाधीन'
                          : 'लंबित'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedDak(d)}
                          className="text-xs text-rajbhasha-navy font-semibold hover:underline bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition whitespace-nowrap"
                        >
                          विवरण
                        </button>
                        {d.current_status !== 'Dispatched' && d.current_status !== 'Disposed' && (
                          <button
                            onClick={() => {
                              setSelectedDak(d);
                              setActionForm({
                                action_taken_by: '',
                                action_details: 'सक्षम प्राधिकारी के अनुमोदनोपरांत उत्तर / परिपत्र निर्गमित एवं प्रेषित किया गया। निर्गम सं: ',
                                status_after_action: 'Dispatched'
                              });
                              setActionModalOpen(true);
                            }}
                            title="डाक को निर्गमित / प्रेषित चिह्नित करें"
                            className="text-xs text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 font-semibold px-2 py-1 rounded transition flex items-center gap-1 whitespace-nowrap"
                          >
                            <Send className="w-3 h-3" />
                            <span>प्रेषित करें</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register New Dak */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <h3 className="font-bold text-sm">नया डाक / पत्राचार पंजीकृत करें</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDak} className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">प्राप्ति तिथि (Receipt Date): *</label>
                  <input
                    type="date"
                    required
                    value={newDak.receipt_date}
                    onChange={(e) => setNewDak({...newDak, receipt_date: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">प्राथमिकता (Priority):</label>
                  <select
                    value={newDak.priority}
                    onChange={(e) => setNewDak({...newDak, priority: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Normal">सामान्य (Normal)</option>
                    <option value="Urgent">आवश्यक (Urgent)</option>
                    <option value="Top Priority">अति आवश्यक (Top Priority)</option>
                    <option value="Immediate">तत्काल (Immediate)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">पत्र संख्या (Letter No):</label>
                  <input
                    type="text"
                    value={newDak.letter_no}
                    onChange={(e) => setNewDak({...newDak, letter_no: e.target.value})}
                    placeholder="उदा. MHA/OL/2026/01"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">पत्र तिथि (Letter Date):</label>
                  <input
                    type="date"
                    value={newDak.letter_date}
                    onChange={(e) => setNewDak({...newDak, letter_date: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">प्रेषक क्षेत्र (Region):</label>
                  <select
                    value={newDak.sender_region}
                    onChange={(e) => setNewDak({...newDak, sender_region: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="A">'क' क्षेत्र (Region A)</option>
                    <option value="B">'ख' क्षेत्र (Region B)</option>
                    <option value="C">'ग' क्षेत्र (Region C)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">प्रेषक का नाम / पद:</label>
                  <input
                    type="text"
                    value={newDak.sender_name}
                    onChange={(e) => setNewDak({...newDak, sender_name: e.target.value})}
                    placeholder="उदा. निदेशक (राजभाषा)"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">प्रेषक विभाग / मंत्रालय:</label>
                  <input
                    type="text"
                    value={newDak.sender_department}
                    onChange={(e) => setNewDak({...newDak, sender_department: e.target.value})}
                    placeholder="उदा. गृह मंत्रालय, राजभाषा विभाग"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">विषय (हिंदी में) - Subject: *</label>
                <textarea
                  required
                  rows={2}
                  value={newDak.subject_hi}
                  onChange={(e) => setNewDak({...newDak, subject_hi: e.target.value})}
                  placeholder="पत्र का मुख्य विषय हिंदी में दर्ज करें..."
                  className="w-full p-2 border border-slate-300 rounded-lg font-devanagari"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">श्रेणी (Category):</label>
                  <select
                    value={newDak.category}
                    onChange={(e) => setNewDak({...newDak, category: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="General">सामान्य (General)</option>
                    <option value="Policy">नीति / आदेश (Policy)</option>
                    <option value="Training">प्रशिक्षण (Training)</option>
                    <option value="Translation">अनुवाद (Translation)</option>
                    <option value="Section 3(3)">धारा 3(3) (Section 3(3))</option>
                    <option value="Parliament Question">संसद प्रश्न (Parliament Q)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">निस्तारण लक्ष्य तिथि (Target Date):</label>
                  <input
                    type="date"
                    value={newDak.target_date}
                    onChange={(e) => setNewDak({...newDak, target_date: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">टिप्पणी / मुख्य निर्देश:</label>
                <textarea
                  rows={2}
                  value={newDak.summary_notes}
                  onChange={(e) => setNewDak({...newDak, summary_notes: e.target.value})}
                  placeholder="विशेष निर्देश या टिप्पणी..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rajbhasha-navy text-white rounded-lg hover:bg-slate-800 font-medium"
                >
                  पंजीकृत करें
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: View Details & Actions Timeline */}
      {selectedDak && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col text-xs">
            
            {/* Header */}
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <div>
                <span className="font-mono text-amber-300 font-semibold">{selectedDak.dak_unique_no}</span>
                <h3 className="font-bold text-sm text-white">डाक विवरण एवं कार्रवाई इतिहास</h3>
              </div>
              <button onClick={() => setSelectedDak(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-sm font-bold text-slate-900 font-devanagari">
                  {selectedDak.subject_hi}
                </div>
                {selectedDak.subject_en && (
                  <div className="text-xs text-slate-500 italic">{selectedDak.subject_en}</div>
                )}
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-600 text-[11px]">
                  <div><span className="font-semibold">प्रेषक:</span> {selectedDak.sender_name} ({selectedDak.sender_department})</div>
                  <div><span className="font-semibold">पत्र संख्या:</span> {selectedDak.letter_no || '-'}</div>
                  <div><span className="font-semibold">प्राप्ति तिथि:</span> {selectedDak.receipt_date}</div>
                  <div><span className="font-semibold">लक्ष्य तिथि:</span> {selectedDak.target_date || 'निर्धारित नहीं'}</div>
                  <div><span className="font-semibold">प्राथमिकता:</span> {selectedDak.priority}</div>
                  <div><span className="font-semibold">वर्तमान स्थिति:</span> <span className="font-bold text-slate-800">{selectedDak.current_status}</span></div>
                </div>

                {selectedDak.summary_notes && (
                  <div className="pt-2 text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200">
                    <span className="font-semibold">विशेष निर्देश:</span> {selectedDak.summary_notes}
                  </div>
                )}
              </div>

              {/* Action History Timeline */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-rajbhasha-navy" />
                    <span>की गई कार्रवाई का विवरण (Action Timeline):</span>
                  </h4>
                  <div className="flex items-center space-x-2">
                    {selectedDak.current_status !== 'Dispatched' && selectedDak.current_status !== 'Disposed' && (
                      <button
                        onClick={() => {
                          setActionForm({
                            action_taken_by: '',
                            action_details: 'सक्षम प्राधिकारी के अनुमोदनोपरांत उत्तर / परिपत्र निर्गमित एवं प्रेषित किया गया। निर्गम संख्या: ',
                            status_after_action: 'Dispatched'
                          });
                          setActionModalOpen(true);
                        }}
                        className="text-xs bg-purple-700 hover:bg-purple-800 text-white font-medium px-2.5 py-1 rounded shadow flex items-center gap-1 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>प्रेषित / निर्गमित करें</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActionForm({
                          action_taken_by: '',
                          action_details: '',
                          status_after_action: 'In Progress'
                        });
                        setActionModalOpen(true);
                      }}
                      className="text-xs bg-rajbhasha-saffron hover:bg-amber-600 text-white font-medium px-2.5 py-1 rounded shadow transition"
                    >
                      + कार्रवाई दर्ज करें
                    </button>
                  </div>
                </div>

                {selectedDak.actions?.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400">
                    अभी तक कोई कार्रवाई दर्ज नहीं की गई है
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDak.actions?.map((act) => (
                      <div key={act.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-semibold text-slate-800">{act.action_taken_by}</span>
                          <span>{act.action_date}</span>
                        </div>
                        <p className="text-slate-700 font-devanagari">{act.action_details}</p>
                        <div className="mt-1.5 text-[10px] flex items-center gap-1.5 font-semibold">
                          <span className="text-slate-500">स्थिति परिवर्तन:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${
                            act.status_after_action === 'Dispatched'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : act.status_after_action === 'Disposed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : act.status_after_action === 'In Progress'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {act.status_after_action === 'Dispatched' ? 'निर्गमित / प्रेषित (Dispatched)' : act.status_after_action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDak(null)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-white"
              >
                बंद करें
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Mini Modal: Add Action */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4 text-xs">
            <h4 className="font-bold text-sm text-slate-900">डाक पर कार्रवाई दर्ज करें</h4>

            <form onSubmit={handleAddAction} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">कार्रवाईकर्ता अधिकारी / कर्मचारी:</label>
                <input
                  type="text"
                  required
                  value={actionForm.action_taken_by}
                  onChange={(e) => setActionForm({...actionForm, action_taken_by: e.target.value})}
                  placeholder="उदा. अनुभाग अधिकारी"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">की गई कार्रवाई का विवरण (हिंदी में):</label>
                <textarea
                  required
                  rows={3}
                  value={actionForm.action_details}
                  onChange={(e) => setActionForm({...actionForm, action_details: e.target.value})}
                  placeholder="उदा. उत्तर तैयार करके सक्षम अधिकारी के अनुमोदनार्थ प्रस्तुत किया गया..."
                  className="w-full p-2 border border-slate-300 rounded-lg font-devanagari"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">कार्रवाई उपरांत स्थिति:</label>
                <select
                  value={actionForm.status_after_action}
                  onChange={(e) => setActionForm({...actionForm, status_after_action: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="In Progress">प्रक्रियाधीन (In Progress)</option>
                  <option value="Dispatched">निर्गमित / प्रेषित (Dispatched)</option>
                  <option value="Disposed">निस्तारित (Disposed / Completed)</option>
                  <option value="Pending">लंबित (Pending Follow-up)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rajbhasha-navy text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
