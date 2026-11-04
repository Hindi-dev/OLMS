import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { 
  Award, 
  FileCheck2, 
  AlertTriangle, 
  BookOpen, 
  BarChart3, 
  CheckCircle2, 
  ShieldAlert, 
  Plus, 
  X,
  Search,
  Upload,
  FileText,
  Download,
  Copy,
  Check,
  Trash2,
  Eye,
  Tag,
  Calendar,
  Building,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const PolicyCompliance = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('readyReference'); // Default to readyReference!
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [qprList, setQprList] = useState([]);
  const [sec33Categories, setSec33Categories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ready Reference States
  const [policyDocs, setPolicyDocs] = useState([]);
  const [policySearchQuery, setPolicySearchQuery] = useState('');
  const [policySearchResults, setPolicySearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploadPolicyModalOpen, setIsUploadPolicyModalOpen] = useState(false);
  const [viewPolicyDoc, setViewPolicyDoc] = useState(null);
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Policy Upload Form
  const [policyForm, setPolicyForm] = useState({
    title: '',
    circular_no: '',
    issuing_authority: 'गृह मंत्रालय, राजभाषा विभाग',
    issue_date: '',
    policy_category: 'General Order',
    summary_notes: '',
    file: null
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // QPR Form state
  const [isQprModalOpen, setIsQprModalOpen] = useState(false);
  const [qprEvaluation, setQprEvaluation] = useState(null);
  const [qprForm, setQprForm] = useState({
    year: 2026,
    quarter: 'Q4',
    office_name: 'केंद्रीय मंडल प्रशासनिक कार्यालय',
    office_region: 'A',
    letters_to_region_a_total: 600,
    letters_to_region_a_hi: 580,
    letters_to_region_b_total: 150,
    letters_to_region_b_hi: 140,
    letters_to_region_c_total: 80,
    letters_to_region_c_hi: 50,
    letters_received_hindi: 250,
    letters_replied_hindi: 250,
    total_computers: 85,
    computers_with_hindi_facility: 85,
    remarks: 'नियमों के अनुसार अनुपालन',
    section3_3_items: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [kb, qprs, cats, docs] = await Promise.all([
        api.getKnowledgeBase(),
        api.getQprList(),
        api.getSection33Categories(),
        api.getPolicyDocs(selectedCategoryFilter ? `?category=${encodeURIComponent(selectedCategoryFilter)}` : '')
      ]);
      setKnowledgeBase(kb);
      setQprList(qprs);
      setSec33Categories(cats);
      setPolicyDocs(docs);

      if (cats && cats.length > 0) {
        setQprForm(prev => ({
          ...prev,
          section3_3_items: cats.map(c => ({
            document_category: c.name_hi,
            total_issued: 10,
            bilingual_issued: 10,
            only_english_issued: 0
          }))
        }));
      }

      if (qprs.length > 0) {
        const evalRes = await api.evaluateQpr(qprs[0].id);
        setQprEvaluation(evalRes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategoryFilter]);

  const handleSearchPolicy = async (e) => {
    if (e) e.preventDefault();
    if (!policySearchQuery.trim()) {
      setPolicySearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await api.searchPolicyReference(policySearchQuery, selectedCategoryFilter);
      setPolicySearchResults(results);
    } catch (err) {
      console.error("Policy search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUploadPolicy = async (e) => {
    e.preventDefault();
    if (!policyForm.file || !policyForm.title) {
      setUploadError("कृपया शीर्षक और फाइल दोनों प्रदान करें");
      return;
    }
    setUploadLoading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('title', policyForm.title);
    formData.append('circular_no', policyForm.circular_no || '');
    formData.append('issuing_authority', policyForm.issuing_authority || 'गृह मंत्रालय, राजभाषा विभाग');
    formData.append('issue_date', policyForm.issue_date || '');
    formData.append('policy_category', policyForm.policy_category || 'General Order');
    formData.append('summary_notes', policyForm.summary_notes || '');
    formData.append('file', policyForm.file);

    try {
      await api.uploadPolicyDoc(formData);
      setIsUploadPolicyModalOpen(false);
      setPolicyForm({
        title: '',
        circular_no: '',
        issuing_authority: 'गृह मंत्रालय, राजभाषा विभाग',
        issue_date: '',
        policy_category: 'General Order',
        summary_notes: '',
        file: null
      });
      loadData();
    } catch (err) {
      setUploadError(err.message || "अपलोड में त्रुटि उत्पन्न हुई");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeletePolicy = async (id) => {
    if (!window.confirm("क्या आप इस नीति दस्तावेज़ को हटाना चाहते हैं?")) return;
    try {
      await api.deletePolicyDoc(id);
      loadData();
    } catch (err) {
      alert("दस्तावेज़ हटाने में त्रुटि: " + err.message);
    }
  };

  const handleCopySnippet = (snippet, docTitle, circNo, pageNo, idx) => {
    const citation = `"${snippet.trim()}"\n\n[संदर्भ: ${docTitle}${circNo ? ` (परिपत्र सं. ${circNo})` : ''}, पृष्ठ संख्या ${pageNo}]`;
    navigator.clipboard.writeText(citation);
    setCopiedSnippetIdx(idx);
    setTimeout(() => setCopiedSnippetIdx(null), 2000);
  };

  const handleViewDetail = async (id) => {
    try {
      const detail = await api.getPolicyDocDetail(id);
      setViewPolicyDoc(detail);
    } catch (err) {
      alert("विवरण लोड करने में त्रुटि: " + err.message);
    }
  };

  const handleQprSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await api.submitQpr(qprForm);
      setIsQprModalOpen(false);
      loadData();
      const evalRes = await api.evaluateQpr(created.id);
      setQprEvaluation(evalRes);
    } catch (err) {
      alert("क्यूपीआर सबमिशन में त्रुटि: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-rajbhasha-navy" />
            <span>राजभाषा नीति अनुपालन एवं संदर्भ आर्काइव (Policy & Compliance)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            अपलोड किए गए नीतिगत परिपत्रों से रेडी रेफरेंस, धारा 3(3) चेकलिस्ट, तथा तिमाही प्रगति रिपोर्ट (QPR) विश्लेषण।
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsUploadPolicyModalOpen(true)}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow transition"
          >
            <Upload className="w-4 h-4 text-emerald-200" />
            <span>नीति दस्तावेज़ अपलोड करें (Upload Circular)</span>
          </button>

          <button
            onClick={() => setIsQprModalOpen(true)}
            className="flex items-center space-x-1.5 bg-rajbhasha-navy hover:bg-slate-800 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>नई क्यूपीआर दर्ज करें</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('readyReference')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'readyReference'
              ? 'border-rajbhasha-navy text-rajbhasha-navy bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>नीति दस्तावेज़ रेडी रेफरेंस (Policy References)</span>
        </button>

        <button
          onClick={() => setActiveTab('section33')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'section33'
              ? 'border-rajbhasha-navy text-rajbhasha-navy bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>धारा 3(3) अनुपालन चेकलिस्ट (Section 3(3))</span>
        </button>

        <button
          onClick={() => setActiveTab('qpr')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'qpr'
              ? 'border-rajbhasha-navy text-rajbhasha-navy bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>क्यूपीआर प्रगति विश्लेषण (QPR Gap Analysis)</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'knowledge'
              ? 'border-rajbhasha-navy text-rajbhasha-navy bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>राजभाषा नियम एवं कानूनी प्रावधान (Knowledge Base)</span>
        </button>
      </div>

      {/* Tab: Ready Reference from Uploaded Policy Documents */}
      {activeTab === 'readyReference' && (
        <div className="space-y-6">
          
          {/* Live Search & Citation Engine */}
          <div className="bg-gradient-to-r from-rajbhasha-navy to-slate-800 p-6 rounded-xl text-white shadow-md space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> रेडी रेफरेंस सर्च इंजन (Instant Policy Citation)
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                अपलोड किए गए परिपत्रों, नियमों व सरकारी आदेशों में तत्काल खोजें
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                विषय, धारा, कीवर्ड या परिपत्र संख्या टाइप करें (उदा. "नकद पुरस्कार", "धारा 3(3)", "नियम 10(4)", "वार्षिक कार्यक्रम")।
              </p>
            </div>

            <form onSubmit={handleSearchPolicy} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={policySearchQuery}
                  onChange={(e) => setPolicySearchQuery(e.target.value)}
                  placeholder="किसी भी नीति नियम, भत्ते या परिपत्र कीवर्ड से खोजें..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white font-devanagari"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="py-2.5 px-3 rounded-lg text-xs bg-white/10 text-white border border-white/20 focus:outline-none w-full sm:w-auto"
              >
                <option value="" className="text-slate-900">सभी श्रेणियां (All Categories)</option>
                <option value="Incentives & Cash Awards" className="text-slate-900">नकद पुरस्कार एवं प्रोत्साहन</option>
                <option value="Notified Offices (Rule 10(4))" className="text-slate-900">नियम 10(4) अधिसूचना</option>
                <option value="Section 3(3)" className="text-slate-900">धारा 3(3) आदेश</option>
                <option value="Annual Programme" className="text-slate-900">वार्षिक कार्यक्रम</option>
                <option value="General Order" className="text-slate-900">सामान्य आदेश / परिपत्र</option>
              </select>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full sm:w-auto px-5 py-2.5 bg-rajbhasha-saffron hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow transition flex items-center justify-center space-x-1.5"
              >
                <span>{isSearching ? "खोजा जा रहा है..." : "रेफरेंस खोजें"}</span>
              </button>
            </form>
          </div>

          {/* Search Results Display */}
          {policySearchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>पहचाने गए नीतिगत उद्धरण ({policySearchResults.length} परिणाम मिले):</span>
                <button
                  onClick={() => setPolicySearchResults([])}
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  परिणाम छुपाएं
                </button>
              </div>

              <div className="space-y-3">
                {policySearchResults.map((m, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-amber-300 shadow-sm text-xs space-y-2 bg-gradient-to-r from-amber-50/30 to-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-rajbhasha-navy text-sm font-devanagari">
                          {m.document_title}
                        </span>
                        {m.circular_no && (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                            {m.circular_no}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                          पृष्ठ {m.page_number} (Page {m.page_number})
                        </span>
                        <span>{m.issuing_authority}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 font-devanagari text-xs leading-relaxed whitespace-pre-line">
                      {m.matched_snippet}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-400">श्रेणी: {m.policy_category}</span>
                      <button
                        onClick={() => handleCopySnippet(m.matched_snippet, m.document_title, m.circular_no, m.page_number, idx)}
                        className="flex items-center space-x-1.5 text-xs text-rajbhasha-navy font-semibold hover:text-blue-800 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                      >
                        {copiedSnippetIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSnippetIdx === idx ? "नोटिंग हेतु कॉपी हो गया!" : "नोटिंग/ड्राफ्टिंग हेतु उद्धरण कॉपी करें"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Documents Archive Vault */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-rajbhasha-navy" />
                <span>अपलोड किए गए नीतिगत परिपत्र एवं आदेश आर्काइव (Document Vault):</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {policyDocs.length} दस्तावेज़ उपलब्ध
              </span>
            </div>

            {loading ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                नीति दस्तावेज़ लोड हो रहे हैं...
              </div>
            ) : policyDocs.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs space-y-2">
                <p>कोई नीति दस्तावेज़ अपलोड नहीं किया गया है।</p>
                <button
                  onClick={() => setIsUploadPolicyModalOpen(true)}
                  className="px-4 py-2 bg-rajbhasha-navy text-white rounded-lg text-xs font-semibold"
                >
                  पहला परिपत्र अपलोड करें
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policyDocs.map((doc) => (
                  <div key={doc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-rajbhasha-navy border border-blue-100">
                          {doc.policy_category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.page_count} पृष्ठ | {doc.file_type}
                        </span>
                      </div>

                      <h5 className="font-bold text-slate-900 text-sm font-devanagari line-clamp-2" title={doc.title}>
                        {doc.title}
                      </h5>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        {doc.circular_no && <div><span className="font-semibold">परिपत्र संख्या:</span> {doc.circular_no}</div>}
                        <div><span className="font-semibold">जारीकर्ता प्राधिकारी:</span> {doc.issuing_authority}</div>
                        {doc.issue_date && <div><span className="font-semibold">जारी तिथि:</span> {doc.issue_date}</div>}
                      </div>

                      {doc.summary_notes && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-devanagari line-clamp-3">
                          {doc.summary_notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(doc.id)}
                          className="flex items-center space-x-1 text-slate-700 hover:text-rajbhasha-navy font-semibold text-xs p-1 rounded"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>पूर्ण पाठ देखें</span>
                        </button>

                        <a
                          href={`/api/policy-docs/${doc.id}/download`}
                          download
                          className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs p-1 rounded"
                          title="मूल फाइल डाउनलोड करें"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <button
                        onClick={() => handleDeletePolicy(doc.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab: Section 3(3) Checklist */}
      {activeTab === 'section33' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-950 block">राजभाषा अधिनियम 1963 की धारा 3(3) का वैधानिक अधिदेश:</span>
              <span>
                निम्नलिखित सभी 14 श्रेणियों के दस्तावेज़ अनिवार्य रूप से द्विभाषी (हिंदी एवं अंग्रेजी दोनों) में जारी किए जाने चाहिए।
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sec33Categories.map((cat, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-rajbhasha-navy font-bold flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 font-devanagari text-sm">{cat.name_hi}</span>
                  </div>
                  <div className="text-slate-500 pl-8">{cat.name_en}</div>
                </div>

                <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px] font-semibold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% द्विभाषी अनिवार्य</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: QPR Gap Analysis */}
      {activeTab === 'qpr' && (
        <div className="space-y-6">
          {qprEvaluation ? (
            <div className="space-y-6">
              {qprEvaluation.evaluation?.flags?.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-1.5">
                  <div className="font-bold text-rose-950 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>पहचाने गए अनुपालन अंतराल / कमियां (Compliance Gaps):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-rose-800">
                    {qprEvaluation.evaluation.flags.map((f, i) => (
                      <li key={i} className="font-medium font-devanagari">{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">'क' क्षेत्र को पत्राचार</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      लक्ष्य: {qprEvaluation.evaluation?.correspondence?.region_a?.target}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {qprEvaluation.evaluation?.correspondence?.region_a?.percent}%
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    कुल पत्र: {qprEvaluation.evaluation?.correspondence?.region_a?.total} | हिंदी में: {qprEvaluation.evaluation?.correspondence?.region_a?.hindi}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">'ख' क्षेत्र को पत्राचार</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      लक्ष्य: {qprEvaluation.evaluation?.correspondence?.region_b?.target}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {qprEvaluation.evaluation?.correspondence?.region_b?.percent}%
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    कुल पत्र: {qprEvaluation.evaluation?.correspondence?.region_b?.total} | हिंदी में: {qprEvaluation.evaluation?.correspondence?.region_b?.hindi}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">नियम 5 (हिंदी पत्रों के उत्तर)</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      अनिवार्य: 100%
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${qprEvaluation.evaluation?.rule_5?.is_compliant ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {qprEvaluation.evaluation?.rule_5?.percent}%
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    प्राप्त: {qprEvaluation.evaluation?.rule_5?.received} | उत्तर हिंदी में: {qprEvaluation.evaluation?.rule_5?.replied_in_hindi}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              कोई क्यूपीआर विश्लेषण उपलब्ध नहीं है।
            </div>
          )}
        </div>
      )}

      {/* Tab: Knowledge Base */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          {knowledgeBase.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 font-devanagari text-sm">{item.title_hi}</h4>
                <span className="text-[11px] text-slate-400 italic">{item.title_en}</span>
              </div>
              <p className="text-slate-700 font-devanagari whitespace-pre-line leading-relaxed">{item.description_hi}</p>
              {item.mandate && (
                <div className="bg-amber-50 p-2 rounded text-amber-900 font-medium text-[11px] border border-amber-200">
                  <span className="font-bold">अधिदेश (Mandate):</span> {item.mandate}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Upload New Policy Document */}
      {isUploadPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">नीतिगत परिपत्र / आदेश अपलोड करें</h3>
              </div>
              <button onClick={() => setIsUploadPolicyModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadPolicy} className="p-5 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">दस्तावेज़ का शीर्षक (Title): *</label>
                <input
                  type="text"
                  required
                  value={policyForm.title}
                  onChange={(e) => setPolicyForm({...policyForm, title: e.target.value})}
                  placeholder="उदा. हिंदी में मूल टिप्पण हेतु नकद पुरस्कार योजना"
                  className="w-full p-2 border border-slate-300 rounded-lg font-devanagari"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">परिपत्र संख्या (Circular No):</label>
                  <input
                    type="text"
                    value={policyForm.circular_no}
                    onChange={(e) => setPolicyForm({...policyForm, circular_no: e.target.value})}
                    placeholder="उदा. No. 11013/02/2024-OL"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">नीति श्रेणी (Category):</label>
                  <select
                    value={policyForm.policy_category}
                    onChange={(e) => setPolicyForm({...policyForm, policy_category: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="General Order">सामान्य आदेश / परिपत्र</option>
                    <option value="Incentives & Cash Awards">नकद पुरस्कार एवं प्रोत्साहन</option>
                    <option value="Notified Offices (Rule 10(4))">नियम 10(4) अधिसूचना</option>
                    <option value="Section 3(3)">धारा 3(3) आदेश</option>
                    <option value="Annual Programme">वार्षिक कार्यक्रम</option>
                    <option value="TOLIC Guidelines">नराकास / राकास निर्देश</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">जारीकर्ता प्राधिकारी:</label>
                  <input
                    type="text"
                    value={policyForm.issuing_authority}
                    onChange={(e) => setPolicyForm({...policyForm, issuing_authority: e.target.value})}
                    placeholder="गृह मंत्रालय, राजभाषा विभाग"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">जारी करने की तिथि:</label>
                  <input
                    type="date"
                    value={policyForm.issue_date}
                    onChange={(e) => setPolicyForm({...policyForm, issue_date: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">संक्षिप्त मुख्य बिंदु (Summary Takeaways):</label>
                <textarea
                  rows={2}
                  value={policyForm.summary_notes}
                  onChange={(e) => setPolicyForm({...policyForm, summary_notes: e.target.value})}
                  placeholder="मुख्य नियम, पात्रता, पुरस्कार राशि या शर्तें दर्ज करें..."
                  className="w-full p-2 border border-slate-300 rounded-lg font-devanagari"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">दस्तावेज़ फाइल चुनें (PDF / DOCX): *</label>
                <input
                  type="file"
                  required
                  accept=".pdf, .docx, .doc, .txt"
                  onChange={(e) => setPolicyForm({...policyForm, file: e.target.files[0]})}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-rajbhasha-navy file:text-white cursor-pointer"
                />
              </div>

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {uploadError}
                </div>
              )}

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadPolicyModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow disabled:opacity-50"
                >
                  {uploadLoading ? "अपलोड व इंडेक्स हो रहा है..." : "अपलोड एवं इंडेक्स करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Full Extracted Document Text */}
      {viewPolicyDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden text-xs max-h-[90vh] flex flex-col">
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <div>
                <h3 className="font-bold text-sm text-white">{viewPolicyDoc.title}</h3>
                <span className="text-[10px] text-slate-300 font-mono">
                  {viewPolicyDoc.circular_no || 'परिपत्र सं. उपलब्ध नहीं'} | कुल पृष्ठ: {viewPolicyDoc.page_count}
                </span>
              </div>
              <button onClick={() => setViewPolicyDoc(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1 font-devanagari text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50/50">
              {viewPolicyDoc.extracted_text}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <a
                href={`/api/policy-docs/${viewPolicyDoc.id}/download`}
                download
                className="flex items-center space-x-1.5 text-xs text-rajbhasha-navy font-semibold hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>मूल फाइल डाउनलोड करें</span>
              </a>

              <button
                onClick={() => setViewPolicyDoc(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New QPR */}
      {isQprModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden text-xs max-h-[90vh] flex flex-col">
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <h3 className="font-bold text-sm">तिमाही प्रगति रिपोर्ट (QPR) आंकड़े दर्ज करें</h3>
              <button onClick={() => setIsQprModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQprSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">वर्ष (Year):</label>
                  <input
                    type="number"
                    value={qprForm.year}
                    onChange={(e) => setQprForm({...qprForm, year: parseInt(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">तिमाही (Quarter):</label>
                  <select
                    value={qprForm.quarter}
                    onChange={(e) => setQprForm({...qprForm, quarter: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Q1">Q1 (अप्रैल - जून)</option>
                    <option value="Q2">Q2 (जुलाई - सितंबर)</option>
                    <option value="Q3">Q3 (अक्टूबर - दिसंबर)</option>
                    <option value="Q4">Q4 (जनवरी - मार्च)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">कार्यालय का क्षेत्र:</label>
                  <select
                    value={qprForm.office_region}
                    onChange={(e) => setQprForm({...qprForm, office_region: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="A">'क' क्षेत्र (Region A)</option>
                    <option value="B">'ख' क्षेत्र (Region B)</option>
                    <option value="C">'ग' क्षेत्र (Region C)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQprModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rajbhasha-navy text-white rounded-lg hover:bg-slate-800 font-medium"
                >
                  सबमिट करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
