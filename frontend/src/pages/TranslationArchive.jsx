import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Sparkles, 
  Filter, 
  FileText, 
  X,
  History,
  Tag
} from 'lucide-react';

export const TranslationArchive = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('glossary'); // glossary or memory
  const [glossary, setGlossary] = useState([]);
  const [translationMemory, setTranslationMemory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [isTmModalOpen, setIsTmModalOpen] = useState(false);

  // Forms
  const [termForm, setTermForm] = useState({
    english_term: '',
    hindi_term: '',
    alternate_terms: '',
    domain: 'Administration',
    authority_source: 'CSTT',
    example_sentence: ''
  });

  const [tmForm, setTmForm] = useState({
    source_text: '',
    target_text: '',
    domain: 'Administration',
    reference_circular_no: '',
    context_notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      let params = [];
      if (domainFilter) params.push(`domain=${domainFilter}`);
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      const qs = params.length ? `?${params.join('&')}` : '';

      if (activeTab === 'glossary') {
        const data = await api.getGlossary(qs);
        setGlossary(data);
      } else {
        const data = await api.getTranslationMemory(qs);
        setTranslationMemory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, domainFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    try {
      await api.addGlossaryTerm(termForm);
      setIsTermModalOpen(false);
      setTermForm({
        english_term: '',
        hindi_term: '',
        alternate_terms: '',
        domain: 'Administration',
        authority_source: 'CSTT',
        example_sentence: ''
      });
      loadData();
    } catch (err) {
      alert("शब्दावली जोड़ने में त्रुटि: " + err.message);
    }
  };

  const handleCreateTm = async (e) => {
    e.preventDefault();
    try {
      await api.addTranslationMemory(tmForm);
      setIsTmModalOpen(false);
      setTmForm({
        source_text: '',
        target_text: '',
        domain: 'Administration',
        reference_circular_no: '',
        context_notes: ''
      });
      loadData();
    } catch (err) {
      alert("अनुवाद संदर्भ जोड़ने में त्रुटि: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rajbhasha-navy" />
            <span>अनुवाद संदर्भ कोष एवं मानक शब्दावली (Translation Memory)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            वैज्ञानिक तथा तकनीकी शब्दावली आयोग (CSTT), रेलवे बोर्ड एवं केंद्रीय अनुवाद ब्यूरो द्वारा अनुमोदित मानक प्रशासनिक शब्द एवं विगत अनुवाद।
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'glossary' ? (
            <button
              onClick={() => setIsTermModalOpen(true)}
              className="flex items-center space-x-1.5 bg-rajbhasha-navy hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs shadow transition shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>नया पारिभाषिक शब्द जोड़ें</span>
            </button>
          ) : (
            <button
              onClick={() => setIsTmModalOpen(true)}
              className="flex items-center space-x-1.5 bg-rajbhasha-navy hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs shadow transition shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>नया अनुवाद संदर्भ जोड़ें</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('glossary')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'glossary'
              ? 'border-rajbhasha-navy text-rajbhasha-navy bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>मानक पारिभाषिक शब्दावली (Glossary Terms)</span>
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'memory'
              ? 'border-rajbhasha-navy text-rajbhasha-navy bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>अनुवाद स्मृति एवं वाक्यांश (Translation Memory Units)</span>
        </button>
      </div>

      {/* Search & Domain Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'glossary' ? "अंग्रेजी या हिंदी शब्द से खोजें..." : "वाक्यांश या विषय से खोजें..."}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rajbhasha-navy focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </form>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">कार्यक्षेत्र (Domain):</span>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">सभी क्षेत्र (All Domains)</option>
            <option value="Administration">प्रशासन (Administration)</option>
            <option value="Finance">वित्त एवं लेखा (Finance)</option>
            <option value="Railway">रेलवे (Railway / Technical)</option>
            <option value="Legal/Rajbhasha">विधि एवं राजभाषा (Legal)</option>
          </select>
        </div>

      </div>

      {/* Tab Content: Glossary View */}
      {activeTab === 'glossary' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">अंग्रेजी पद (English Term)</th>
                  <th className="px-4 py-3">मानक हिंदी अनुवाद (Standard Hindi Term)</th>
                  <th className="px-4 py-3">वैकल्पिक / प्रचलित शब्द</th>
                  <th className="px-4 py-3">कार्यक्षेत्र (Domain)</th>
                  <th className="px-4 py-3">प्राधिकरण स्रोत</th>
                  <th className="px-4 py-3 text-right">कॉपी</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">शब्दावली लोड हो रही है...</td>
                  </tr>
                ) : glossary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">कोई शब्दावली नहीं मिली</td>
                  </tr>
                ) : (
                  glossary.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.english_term}</td>
                      <td className="px-4 py-3 font-devanagari font-bold text-rajbhasha-navy text-sm">
                        {item.hindi_term}
                      </td>
                      <td className="px-4 py-3 font-devanagari text-slate-500">{item.alternate_terms || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {item.domain}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.authority_source}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleCopy(item.hindi_term, item.id)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rajbhasha-navy transition"
                          title="हिंदी शब्द कॉपी करें"
                        >
                          {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Translation Memory View */}
      {activeTab === 'memory' && (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              अनुवाद संदर्भ लोड हो रहे हैं...
            </div>
          ) : translationMemory.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              कोई अनुवाद संदर्भ नहीं मिला
            </div>
          ) : (
            translationMemory.map((tm) => (
              <div key={tm.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-50 text-rajbhasha-navy px-2 py-0.5 rounded font-medium">
                      {tm.domain}
                    </span>
                    {tm.reference_circular_no && (
                      <span>संदर्भ: {tm.reference_circular_no}</span>
                    )}
                  </div>
                  <span className="font-mono text-slate-400">उपयोग: {tm.usage_count} बार</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">अंग्रेजी मूल पाठ (English Source):</span>
                    {tm.source_text}
                  </div>

                  <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-200 text-slate-900 font-devanagari relative group">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">मानक हिंदी अनुवाद (Standard Translation):</span>
                    {tm.target_text}
                    <button
                      onClick={() => handleCopy(tm.target_text, tm.id)}
                      className="absolute right-2.5 top-2.5 p-1 rounded hover:bg-white text-emerald-700 transition"
                      title="अनुवाद कॉपी करें"
                    >
                      {copiedId === tm.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Add Glossary Term */}
      {isTermModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <h3 className="font-bold text-sm">नया मानक पारिभाषिक शब्द जोड़ें</h3>
              <button onClick={() => setIsTermModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="p-5 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">अंग्रेजी पद (English Term): *</label>
                <input
                  type="text"
                  required
                  value={termForm.english_term}
                  onChange={(e) => setTermForm({...termForm, english_term: e.target.value})}
                  placeholder="e.g. Disciplinary Proceedings"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">मानक हिंदी अनुवाद: *</label>
                <input
                  type="text"
                  required
                  value={termForm.hindi_term}
                  onChange={(e) => setTermForm({...termForm, hindi_term: e.target.value})}
                  placeholder="उदा. अनुशासनात्मक कार्यवाही"
                  className="w-full p-2 border border-slate-300 rounded-lg font-devanagari"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">वैकल्पिक / समानार्थक शब्द:</label>
                <input
                  type="text"
                  value={termForm.alternate_terms}
                  onChange={(e) => setTermForm({...termForm, alternate_terms: e.target.value})}
                  placeholder="उदा. विभागीय जांच"
                  className="w-full p-2 border border-slate-300 rounded-lg font-devanagari"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">कार्यक्षेत्र (Domain):</label>
                  <select
                    value={termForm.domain}
                    onChange={(e) => setTermForm({...termForm, domain: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Administration">प्रशासन (Administration)</option>
                    <option value="Finance">वित्त (Finance)</option>
                    <option value="Railway">रेलवे (Railway)</option>
                    <option value="Legal">विधि (Legal)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">प्राधिकरण स्रोत:</label>
                  <input
                    type="text"
                    value={termForm.authority_source}
                    onChange={(e) => setTermForm({...termForm, authority_source: e.target.value})}
                    placeholder="CSTT / MoHA"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTermModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rajbhasha-navy text-white rounded-lg hover:bg-slate-800 font-medium"
                >
                  सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Translation Memory Unit */}
      {isTmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <h3 className="font-bold text-sm">नया अनुवाद संदर्भ / वाक्यांश दर्ज करें</h3>
              <button onClick={() => setIsTmModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTm} className="p-5 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">मूल अंग्रेजी वाक्य (Source Text): *</label>
                <textarea
                  required
                  rows={2}
                  value={tmForm.source_text}
                  onChange={(e) => setTmForm({...tmForm, source_text: e.target.value})}
                  placeholder="Enter source English sentence or paragraph..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">मानक हिंदी अनुवाद (Target Translation): *</label>
                <textarea
                  required
                  rows={2}
                  value={tmForm.target_text}
                  onChange={(e) => setTmForm({...tmForm, target_text: e.target.value})}
                  placeholder="मानक हिंदी अनुवाद दर्ज करें..."
                  className="w-full p-2 border border-slate-300 rounded-lg font-devanagari"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">संदर्भ परिपत्र / आदेश संख्या:</label>
                  <input
                    type="text"
                    value={tmForm.reference_circular_no}
                    onChange={(e) => setTmForm({...tmForm, reference_circular_no: e.target.value})}
                    placeholder="उदा. परिपत्र संख्या 12/2026"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">कार्यक्षेत्र (Domain):</label>
                  <select
                    value={tmForm.domain}
                    onChange={(e) => setTmForm({...tmForm, domain: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Administration">प्रशासन (Administration)</option>
                    <option value="Finance">वित्त (Finance)</option>
                    <option value="Railway">रेलवे (Railway)</option>
                    <option value="Legal">विधि (Legal)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTmModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rajbhasha-navy text-white rounded-lg hover:bg-slate-800 font-medium"
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
