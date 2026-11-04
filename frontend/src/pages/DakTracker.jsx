import React, { useState, useEffect, useRef } from 'react';
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
  Send,
  RefreshCw,
  Settings,
  ShieldCheck,
  Download,
  DownloadCloud,
  Eye,
  EyeOff,
  Check,
  AlertTriangle
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
  const [emailConfigModalOpen, setEmailConfigModalOpen] = useState(false);
  
  // Gov Email Integration State
  const [emailConfig, setEmailConfig] = useState({
    email_address: '',
    display_name: '',
    imap_server: 'imap.mail.gov.in',
    imap_port: 993,
    imap_use_ssl: true,
    smtp_server: 'smtp.mail.gov.in',
    smtp_port: 465,
    smtp_use_ssl: true,
    app_password: '',
    folder_name: 'INBOX',
    fetch_filter: 'UNSEEN',
    fetch_limit: 15,
    auto_mark_read: false,
    has_password: false,
    last_sync_at: null,
    last_sync_status: ''
  });
  const [isSyncingEmail, setIsSyncingEmail] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncBanner, setSyncBanner] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const emlInputRef = useRef(null);
  const [isImportingEml, setIsImportingEml] = useState(false);

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

  const loadEmailConfig = async () => {
    try {
      const data = await api.getEmailConfig();
      setEmailConfig(prev => ({ ...prev, ...data, app_password: '' }));
    } catch (err) {
      console.error("Failed to load email config:", err);
    }
  };

  useEffect(() => {
    loadDak();
    loadEmailConfig();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDak();
  };

  const handleSyncEmail = async () => {
    setIsSyncingEmail(true);
    setSyncBanner(null);
    try {
      const res = await api.syncEmailDak();
      if (res.success) {
        setSyncBanner({ type: 'success', message: res.message });
        loadDak();
        loadEmailConfig();
      } else {
        setSyncBanner({ type: 'error', message: res.message });
        if (res.message.includes('कॉन्फ़िगर')) {
          setEmailConfigModalOpen(true);
        }
      }
    } catch (err) {
      setSyncBanner({ type: 'error', message: 'ईमेल सिंक करने में त्रुटि: ' + (err.message || err) });
    } finally {
      setIsSyncingEmail(false);
    }
  };

  const handleEmlUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImportingEml(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.importEmlDak(formData);
      setSyncBanner({
        type: 'success',
        message: `सफलतापूर्वक ईमेल आयात किया गया: '${res.subject_hi}' (डाक क्रमांक: ${res.dak_unique_no}, संलग्नक: ${res.attachments?.length || 0})`
      });
      loadDak();
    } catch (err) {
      setSyncBanner({ type: 'error', message: 'ईमेल फ़ाइल (.eml) आयात करने में त्रुटि: ' + err.message });
    } finally {
      setIsImportingEml(false);
      if (emlInputRef.current) emlInputRef.current.value = '';
    }
  };

  const handleTestConnection = async () => {
    setIsTestingEmail(true);
    setTestResult(null);
    try {
      const res = await api.testEmailConnection({
        email_address: emailConfig.email_address,
        app_password: emailConfig.app_password,
        imap_server: emailConfig.imap_server,
        imap_port: emailConfig.imap_port,
        imap_use_ssl: emailConfig.imap_use_ssl
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: 'परीक्षण त्रुटि: ' + (err.message || err), folders: [] });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleSaveEmailConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await api.saveEmailConfig(emailConfig);
      alert(res.message || "सेटिंग्स सफलतापूर्वक सुरक्षित की गईं।");
      loadEmailConfig();
      setEmailConfigModalOpen(false);
    } catch (err) {
      alert("सेटिंग्स सुरक्षित करने में त्रुटि: " + (err.message || err));
    }
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

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            type="file"
            ref={emlInputRef}
            onChange={handleEmlUpload}
            accept=".eml,.msg,.txt"
            className="hidden"
          />

          <button
            onClick={() => emlInputRef.current?.click()}
            disabled={isImportingEml}
            className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-medium px-3.5 py-2 rounded-lg text-xs shadow-sm transition"
            title="NIC वेबमेल से सेव की गई .eml फ़ाइल सीधे डाक में आयात करें (Zero-VPN & 100% Reliable)"
          >
            <DownloadCloud className={`w-3.5 h-3.5 text-amber-700 ${isImportingEml ? 'animate-spin' : ''}`} />
            <span>{isImportingEml ? 'आयात हो रहा है...' : '.eml ईमेल फ़ाइल आयात'}</span>
          </button>

          <button
            onClick={handleSyncEmail}
            disabled={isSyncingEmail}
            className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-medium px-3.5 py-2 rounded-lg text-xs shadow-sm transition"
            title="mail.gov.in से नए परिपत्र व ईमेल सीधे डाक ट्रैकर में आयात करें"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isSyncingEmail ? 'animate-spin' : ''}`} />
            <span>{isSyncingEmail ? 'सिंक हो रहा है...' : 'mail.gov.in सिंक'}</span>
          </button>

          <button
            onClick={() => {
              setTestResult(null);
              setEmailConfigModalOpen(true);
            }}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium px-3 py-2 rounded-lg text-xs shadow-sm transition"
            title="NIC / Kavach ईमेल सेटिंग्स"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>ईमेल सेटिंग्स</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 bg-rajbhasha-navy hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs shadow transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>नया डाक दर्ज करें</span>
          </button>
        </div>
      </div>

      {/* Sync Banner notification */}
      {syncBanner && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs transition shadow-sm ${
          syncBanner.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center space-x-2.5">
            {syncBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{syncBanner.message}</span>
          </div>
          <button
            onClick={() => setSyncBanner(null)}
            className="text-slate-400 hover:text-slate-600 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
                  <div className="pt-2 text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-900 block mb-0.5">विशेष निर्देश / सारांश:</span>
                    <pre className="font-sans whitespace-pre-wrap text-slate-700 text-[11px]">{selectedDak.summary_notes}</pre>
                  </div>
                )}

                {/* Attachments Section */}
                {selectedDak.attachments && selectedDak.attachments.length > 0 && (
                  <div className="pt-2">
                    <span className="font-semibold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      <span>संलग्न दस्तावेज़ (Attachments):</span>
                    </span>
                    <div className="space-y-1.5">
                      {selectedDak.attachments.map((att) => {
                        const filename = att.stored_filepath.split(/[/\\]/).pop();
                        return (
                          <div key={att.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs shadow-sm">
                            <div className="flex items-center space-x-2 truncate">
                              <FileText className="w-4 h-4 text-rajbhasha-navy shrink-0" />
                              <span className="font-medium text-slate-800 truncate" title={att.original_filename}>
                                {att.original_filename}
                              </span>
                              {att.file_size_bytes && (
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  ({Math.round(att.file_size_bytes / 1024)} KB)
                                </span>
                              )}
                            </div>
                            <a
                              href={`/uploads/${encodeURIComponent(filename)}`}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0 ml-2 transition border border-blue-200"
                            >
                              <Download className="w-3 h-3" />
                              <span>डाउनलोड / देखें</span>
                            </a>
                          </div>
                        );
                      })}
                    </div>
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

      {/* Modal: Government Email Integration Settings (mail.gov.in) */}
      {emailConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col text-xs">
            
            {/* Header */}
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-sm text-white">सरकारी ईमेल एकीकरण सेटिंग्स (mail.gov.in / Kavach 2FA)</h3>
                  <p className="text-[11px] text-slate-300">NIC / Gov ईमेल इनबॉक्स से आवक डाक व संलग्नकों का सीधा स्थानीय आयात</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setTestResult(null);
                  setEmailConfigModalOpen(false);
                }} 
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEmailConfig} className="p-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Security Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-900 flex items-start space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">100% स्थानीय व सुरक्षित (Air-gapped & Offline Compliance):</span> आपके क्रेडेंशियल्स केवल आपके इस कंप्यूटर के स्थानीय डेटाबेस में सुरक्षित रहते हैं। कोई भी डेटा या पासवर्ड किसी बाहरी क्लाउड सर्वर पर नहीं भेजा जाता।
                </div>
              </div>

              {/* Email Address & Display Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    सरकारी ईमेल पता (mail.gov.in / nic.in): *
                  </label>
                  <input
                    type="email"
                    required
                    value={emailConfig.email_address}
                    onChange={(e) => setEmailConfig({...emailConfig, email_address: e.target.value})}
                    placeholder="उदा. adhikari.name@nic.in या @gov.in"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rajbhasha-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    अधिकारी / अनुभाग का नाम (Display Name):
                  </label>
                  <input
                    type="text"
                    value={emailConfig.display_name || ''}
                    onChange={(e) => setEmailConfig({...emailConfig, display_name: e.target.value})}
                    placeholder="उदा. राजभाषा अनुभाग / सहायक निदेशक"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rajbhasha-navy focus:outline-none"
                  />
                </div>
              </div>

              {/* Kavach App Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    कवच ऐप पासवर्ड (Kavach App-Specific Password): *
                  </label>
                  {emailConfig.has_password && (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> पासवर्ड सुरक्षित रूप से सहेजा गया है
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={emailConfig.app_password || ''}
                    onChange={(e) => setEmailConfig({...emailConfig, app_password: e.target.value})}
                    placeholder={emailConfig.has_password ? "नया पासवर्ड दर्ज करने के लिए यहाँ टाइप करें (अन्यथा खाली छोड़ें)" : "कवच ऐप-पासवर्ड यहाँ दर्ज करें"}
                    className="w-full p-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rajbhasha-navy focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Kavach Instruction Tip */}
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>कवच 2FA ऐप पासवर्ड कैसे बनाएं?</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 text-amber-800 pl-1">
                    <li>NIC वेबमेल पोर्टल (<a href="https://mail.gov.in" target="_blank" rel="noreferrer" className="underline font-semibold">mail.gov.in</a>) में सामान्य रूप से लॉगिन करें।</li>
                    <li>ऊपर <strong>Preferences (प्राथमिकताएं)</strong> ➔ <strong>Security (सुरक्षा)</strong> ➔ <strong>App Passwords</strong> पर जाएँ।</li>
                    <li>एक नया नाम (उदा. <em>OLMS Desktop</em>) देकर <strong>Generate Password</strong> करें और प्राप्त पासवर्ड यहाँ पेस्ट करें।</li>
                  </ol>
                </div>
              </div>

              {/* Server Host & Port Settings */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  सर्वर प्रोटोकॉल सेटिंग्स (NIC Defaults):
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">IMAP सर्वर (आवक डाक):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={emailConfig.imap_server}
                        onChange={(e) => setEmailConfig({...emailConfig, imap_server: e.target.value})}
                        className="flex-1 p-1.5 border border-slate-300 rounded text-xs bg-white"
                      />
                      <input
                        type="number"
                        value={emailConfig.imap_port}
                        onChange={(e) => setEmailConfig({...emailConfig, imap_port: parseInt(e.target.value) || 993})}
                        className="w-16 p-1.5 border border-slate-300 rounded text-xs bg-white text-center"
                        title="पोर्ट (डिफ़ॉल्ट 993 SSL)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">SMTP सर्वर (जावक प्रेषण):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={emailConfig.smtp_server}
                        onChange={(e) => setEmailConfig({...emailConfig, smtp_server: e.target.value})}
                        className="flex-1 p-1.5 border border-slate-300 rounded text-xs bg-white"
                      />
                      <input
                        type="number"
                        value={emailConfig.smtp_port}
                        onChange={(e) => setEmailConfig({...emailConfig, smtp_port: parseInt(e.target.value) || 465})}
                        className="w-16 p-1.5 border border-slate-300 rounded text-xs bg-white text-center"
                        title="पोर्ट (डिफ़ॉल्ट 465 SSL)"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">मेलबॉक्स फ़ोल्डर:</label>
                    <input
                      type="text"
                      value={emailConfig.folder_name}
                      onChange={(e) => setEmailConfig({...emailConfig, folder_name: e.target.value})}
                      placeholder="INBOX"
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">सिंक फ़िल्टर:</label>
                    <select
                      value={emailConfig.fetch_filter}
                      onChange={(e) => setEmailConfig({...emailConfig, fetch_filter: e.target.value})}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="UNSEEN">केवल अपठित (UNSEEN Mails)</option>
                      <option value="ALL">हालिया सभी (All Recent Mails)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">अधिकतम संख्या (Limit):</label>
                    <select
                      value={emailConfig.fetch_limit}
                      onChange={(e) => setEmailConfig({...emailConfig, fetch_limit: parseInt(e.target.value) || 15})}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="10">10 ईमेल</option>
                      <option value="15">15 ईमेल</option>
                      <option value="25">25 ईमेल</option>
                      <option value="30">30 ईमेल</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {emailConfig.last_sync_at ? `अंतिम स्थिति: ${emailConfig.last_sync_status || 'सफल'}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingEmail || (!emailConfig.email_address)}
                    className="flex items-center space-x-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isTestingEmail ? 'animate-spin' : ''}`} />
                    <span>{isTestingEmail ? 'जांच हो रही है...' : 'कनेक्शन जांचें (Test Connection)'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg border text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}>
                    <div className="flex items-start space-x-2.5 font-medium">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      <span className="whitespace-pre-line leading-relaxed text-[11px]">{testResult.message}</span>
                    </div>
                    {testResult.folders && testResult.folders.length > 0 && (
                      <div className="mt-2 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-700">उपलब्ध मेलबॉक्स फ़ोल्डर: </span>
                        {testResult.folders.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setTestResult(null);
                    setEmailConfigModalOpen(false);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rajbhasha-navy text-white rounded-lg hover:bg-slate-800 font-semibold flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>सेटिंग्स सुरक्षित करें (Save)</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
