import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { 
  GraduationCap, 
  Plus, 
  Users, 
  CheckCircle, 
  Clock, 
  Award, 
  BookOpen, 
  Search, 
  Filter, 
  X,
  Info,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  Trash2
} from 'lucide-react';

export const TrainingRoster = () => {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [rosterSummary, setRosterSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isNomModalOpen, setIsNomModalOpen] = useState(false);
  const [selectedEmpForNom, setSelectedEmpForNom] = useState(null);

  // Bulk Import state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState(null);
  const [clearExisting, setClearExisting] = useState(false);

  // Form states
  const [empForm, setEmpForm] = useState({
    emp_code: '',
    name_hi: '',
    name_en: '',
    designation: '',
    department: '',
    employee_category: 'A',
    mother_tongue: '',
    hindi_qualification: 'Matriculation',
    hindi_knowledge_level: 'Proficient',
    is_typist: false,
    is_stenographer: false
  });

  const [nomForm, setNomForm] = useState({
    course_id: '',
    status: 'Nominated',
    batch_number: '',
    training_center: 'केंद्रीय हिंदी प्रशिक्षण संस्थान (CHTI)',
    nomination_date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    setLoading(true);
    try {
      let params = [];
      if (categoryFilter) params.push(`category=${categoryFilter}`);
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      const qs = params.length ? `?${params.join('&')}` : '';

      const [empList, courseList, nomList, summary] = await Promise.all([
        api.getEmployees(qs),
        api.getCourses(),
        api.getNominations(),
        api.getRosterSummary()
      ]);
      setEmployees(empList);
      setCourses(courseList);
      setNominations(nomList);
      setRosterSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const handleCreateEmp = async (e) => {
    e.preventDefault();
    try {
      await api.createEmployee(empForm);
      setIsEmpModalOpen(false);
      setEmpForm({
        emp_code: '',
        name_hi: '',
        name_en: '',
        designation: '',
        department: '',
        employee_category: 'A',
        mother_tongue: '',
        hindi_qualification: 'Matriculation',
        hindi_knowledge_level: 'Proficient',
        is_typist: false,
        is_stenographer: false
      });
      loadData();
    } catch (err) {
      alert("कर्मचारी जोड़ने में त्रुटि: " + err.message);
    }
  };

  const handleCreateNomination = async (e) => {
    e.preventDefault();
    if (!selectedEmpForNom || !nomForm.course_id) return;
    try {
      await api.createNomination({
        employee_id: selectedEmpForNom.id,
        course_id: parseInt(nomForm.course_id),
        ...nomForm
      });
      setIsNomModalOpen(false);
      setSelectedEmpForNom(null);
      loadData();
    } catch (err) {
      alert("नामांकन दर्ज करने में त्रुटि: " + err.message);
    }
  };

  const openNominationModal = (emp) => {
    setSelectedEmpForNom(emp);
    // Auto-select course based on Presidential rules
    let defaultCourseId = courses[0]?.id;
    if (emp.employee_category === 'D') {
      const prabodh = courses.find(c => c.course_code === 'PRABODH');
      if (prabodh) defaultCourseId = prabodh.id;
    } else if (emp.employee_category === 'C') {
      const praveen = courses.find(c => c.course_code === 'PRAVEEN');
      if (praveen) defaultCourseId = praveen.id;
    } else if (emp.employee_category === 'B') {
      const pragya = courses.find(c => c.course_code === 'PRAGYA');
      if (pragya) defaultCourseId = pragya.id;
    } else if (emp.is_typist) {
      const typ = courses.find(c => c.course_code === 'TYPING');
      if (typ) defaultCourseId = typ.id;
    }
    setNomForm(prev => ({ ...prev, course_id: defaultCourseId }));
    setIsNomModalOpen(true);
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      setBulkError("कृपया एक्सेल (.xlsx) अथवा सीएसवी (.csv) फाइल चुनें");
      return;
    }
    setBulkLoading(true);
    setBulkError(null);
    setBulkResult(null);

    const formData = new FormData();
    formData.append('file', bulkFile);
    formData.append('clear_existing', clearExisting ? 'true' : 'false');

    try {
      const res = await api.bulkImportEmployees(formData);
      setBulkResult(res);
      loadData();
    } catch (err) {
      setBulkError(err.message || "इम्पोर्ट में त्रुटि उत्पन्न हुई");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("चेतावनी: क्या आप वाकई पूरे रोस्टर डेटा (सभी कर्मचारियों और उनके नामांकनों) को पूरी तरह साफ़ करना चाहते हैं? यह क्रिया वापस नहीं की जा सकती।")) {
      return;
    }
    try {
      const res = await api.clearRosterData();
      alert(res.message);
      loadData();
    } catch (err) {
      alert("डेटा साफ़ करने में त्रुटि: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-rajbhasha-navy" />
            <span>हिंदी शिक्षण योजना - रोस्टर प्रबंधन (Training Roster)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            राष्ट्रपति के आदेशों के अनुसार कर्मचारियों का वर्गीकरण (क, ख, ग, घ वर्ग) तथा प्रबोध, प्रवीण, प्राज्ञ व टंकण/आशुलिपि रोस्टर।
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium px-3 py-2 rounded-lg text-xs shadow-sm transition"
            title="मौजूदा सभी कर्मचारियों और नामांकनों का डेटा पूरी तरह साफ़ करें"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>रोस्टर साफ़ करें</span>
          </button>

          <button
            onClick={() => {
              setBulkFile(null);
              setBulkResult(null);
              setBulkError(null);
              setClearExisting(false);
              setIsBulkModalOpen(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>एक्सेल से बल्क इम्पोर्ट (Excel Import)</span>
          </button>

          <button
            onClick={() => setIsEmpModalOpen(true)}
            className="flex items-center space-x-1.5 bg-rajbhasha-navy hover:bg-slate-800 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>नया कर्मचारी जोड़ें</span>
          </button>
        </div>
      </div>

      {/* Presidential Order Rule Guide Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start space-x-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-950">राष्ट्रपति के आदेशों के तहत हिंदी प्रशिक्षण हेतु कर्मचारी श्रेणियां:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="bg-white/80 p-2 rounded border border-amber-200">
              <span className="font-bold block text-slate-800">क वर्ग (Category A):</span>
              मातृभाषा हिंदी / मैट्रिक हिंदी माध्यम। (भाषा प्रशिक्षण से छूट प्राप्त)
            </div>
            <div className="bg-white/80 p-2 rounded border border-amber-200">
              <span className="font-bold block text-slate-800">ख वर्ग (Category B):</span>
              उर्दू, पंजाबी, कश्मीरी आदि। (प्राज्ञ प्रशिक्षण आवश्यक)
            </div>
            <div className="bg-white/80 p-2 rounded border border-amber-200">
              <span className="font-bold block text-slate-800">ग वर्ग (Category C):</span>
              मराठी, गुजराती, बंगाली, उड़िया, असमिया। (प्रवीण व प्राज्ञ आवश्यक)
            </div>
            <div className="bg-white/80 p-2 rounded border border-amber-200">
              <span className="font-bold block text-slate-800">घ वर्ग (Category D):</span>
              दक्षिण भारतीय व अन्य भाषाएं। (प्रबोध, प्रवीण एवं प्राज्ञ आवश्यक)
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      {rosterSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 block uppercase font-semibold">कुल कर्मचारी</span>
            <span className="text-xl font-bold text-slate-800">{rosterSummary.total_employees}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 block uppercase font-semibold">प्रशिक्षणाधीन (Under Training)</span>
            <span className="text-xl font-bold text-blue-600">{rosterSummary.nomination_stats?.under_training || 0}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 block uppercase font-semibold">उत्तीर्ण (Passed)</span>
            <span className="text-xl font-bold text-emerald-600">{rosterSummary.nomination_stats?.passed || 0}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 block uppercase font-semibold">प्रशिक्षण योग्य (ख, ग, घ)</span>
            <span className="text-xl font-bold text-amber-600">
              {(rosterSummary.by_category?.B || 0) + (rosterSummary.by_category?.C || 0) + (rosterSummary.by_category?.D || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        <div className="flex items-center space-x-2 w-full md:w-80">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="कर्मचारी का नाम, कोड या पदनाम से खोजें..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rajbhasha-navy focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button onClick={loadData} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium">
            खोजें
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">कर्मचारी वर्ग (Category):</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">सभी वर्ग (All Categories)</option>
            <option value="A">क वर्ग (Category A - Exempted)</option>
            <option value="B">ख वर्ग (Category B)</option>
            <option value="C">ग वर्ग (Category C)</option>
            <option value="D">घ वर्ग (Category D)</option>
          </select>
        </div>

      </div>

      {/* Employees Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">कर्मचारी कोड</th>
                <th className="px-4 py-3">नाम (हिंदी / English)</th>
                <th className="px-4 py-3">पदनाम एवं विभाग</th>
                <th className="px-4 py-3">वर्ग (Category)</th>
                <th className="px-4 py-3">मातृभाषा</th>
                <th className="px-4 py-3">हिंदी ज्ञान स्तर</th>
                <th className="px-4 py-3">टंकण/स्टेनो</th>
                <th className="px-4 py-3 text-right">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">रोस्टर डेटा लोड हो रहा है...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">कोई कर्मचारी रिकॉर्ड नहीं मिला</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{emp.emp_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-devanagari">{emp.name_hi}</div>
                      <div className="text-[11px] text-slate-400">{emp.name_en}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{emp.designation}</div>
                      <div className="text-[11px] text-slate-400">{emp.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        emp.employee_category === 'A'
                          ? 'bg-slate-100 text-slate-700'
                          : emp.employee_category === 'B'
                          ? 'bg-blue-100 text-blue-800'
                          : emp.employee_category === 'C'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {emp.employee_category} वर्ग
                      </span>
                    </td>
                    <td className="px-4 py-3">{emp.mother_tongue || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        emp.hindi_knowledge_level === 'Proficient'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : emp.hindi_knowledge_level === 'Working'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {emp.hindi_knowledge_level === 'Proficient' ? 'कार्यसाधक ज्ञान' : emp.hindi_knowledge_level === 'Working' ? 'कामकाजी ज्ञान' : 'अपेक्षित'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      {emp.is_typist ? <span className="text-amber-700 font-semibold block">टंकक (Typist)</span> : null}
                      {emp.is_stenographer ? <span className="text-blue-700 font-semibold block">स्टेनो (Steno)</span> : null}
                      {!emp.is_typist && !emp.is_stenographer ? <span className="text-slate-400">-</span> : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openNominationModal(emp)}
                        className="text-xs bg-rajbhasha-navy hover:bg-slate-800 text-white font-medium px-2.5 py-1 rounded shadow"
                      >
                        नामित करें (Nominate)
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register New Employee */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <h3 className="font-bold text-sm">नया कर्मचारी विवरण दर्ज करें</h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmp} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">कर्मचारी कोड (Emp Code): *</label>
                  <input
                    type="text"
                    required
                    value={empForm.emp_code}
                    onChange={(e) => setEmpForm({...empForm, emp_code: e.target.value})}
                    placeholder="उदा. EMP-1006"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">राष्ट्रपति आदेशानुसार वर्ग: *</label>
                  <select
                    value={empForm.employee_category}
                    onChange={(e) => setEmpForm({...empForm, employee_category: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="A">क वर्ग (Category A - Hindi Native)</option>
                    <option value="B">ख वर्ग (Category B - Urdu/Punjabi)</option>
                    <option value="C">ग वर्ग (Category C - Marathi/Bengali etc)</option>
                    <option value="D">घ वर्ग (Category D - South Indian/Other)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">नाम (हिंदी में): *</label>
                  <input
                    type="text"
                    required
                    value={empForm.name_hi}
                    onChange={(e) => setEmpForm({...empForm, name_hi: e.target.value})}
                    placeholder="उदा. अमित कुमार"
                    className="w-full p-2 border border-slate-300 rounded-lg font-devanagari"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Name (English): *</label>
                  <input
                    type="text"
                    required
                    value={empForm.name_en}
                    onChange={(e) => setEmpForm({...empForm, name_en: e.target.value})}
                    placeholder="e.g. Amit Kumar"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">पदनाम (Designation): *</label>
                  <input
                    type="text"
                    required
                    value={empForm.designation}
                    onChange={(e) => setEmpForm({...empForm, designation: e.target.value})}
                    placeholder="उदा. वरिष्ठ लिपिक"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">विभाग (Department): *</label>
                  <input
                    type="text"
                    required
                    value={empForm.department}
                    onChange={(e) => setEmpForm({...empForm, department: e.target.value})}
                    placeholder="उदा. स्थापना शाखा"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">मातृभाषा (Mother Tongue):</label>
                  <input
                    type="text"
                    value={empForm.mother_tongue}
                    onChange={(e) => setEmpForm({...empForm, mother_tongue: e.target.value})}
                    placeholder="उदा. तमिल, तेलुगु, बंगाली"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">हिंदी ज्ञान स्तर:</label>
                  <select
                    value={empForm.hindi_knowledge_level}
                    onChange={(e) => setEmpForm({...empForm, hindi_knowledge_level: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Proficient">कार्यसाधक ज्ञान (Proficient)</option>
                    <option value="Working">कामकाजी ज्ञान (Working)</option>
                    <option value="None">कोई ज्ञान नहीं (None - Training needed)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={empForm.is_typist}
                    onChange={(e) => setEmpForm({...empForm, is_typist: e.target.checked})}
                    className="rounded border-slate-300"
                  />
                  <span>कंप्यूटर टंकक (Typist)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={empForm.is_stenographer}
                    onChange={(e) => setEmpForm({...empForm, is_stenographer: e.target.checked})}
                    className="rounded border-slate-300"
                  />
                  <span>आशुलिपिक (Stenographer)</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
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

      {/* Modal: Nominate for Training */}
      {isNomModalOpen && selectedEmpForNom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <h3 className="font-bold text-sm">हिंदी प्रशिक्षण हेतु नामांकन (Nomination)</h3>
              <button onClick={() => setIsNomModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNomination} className="p-5 space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 font-devanagari">{selectedEmpForNom.name_hi} ({selectedEmpForNom.emp_code})</div>
                <div className="text-[11px] text-slate-500">{selectedEmpForNom.designation} | वर्ग: {selectedEmpForNom.employee_category}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">पाठ्यक्रम चुनें (Select Course): *</label>
                <select
                  required
                  value={nomForm.course_id}
                  onChange={(e) => setNomForm({...nomForm, course_id: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_hi} ({c.name_en})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">बैच संख्या / सत्र (Batch Number):</label>
                <input
                  type="text"
                  value={nomForm.batch_number}
                  onChange={(e) => setNomForm({...nomForm, batch_number: e.target.value})}
                  placeholder="उदा. CHTI/2026/बैच-1"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">प्रशिक्षण केंद्र (Training Center):</label>
                <input
                  type="text"
                  value={nomForm.training_center}
                  onChange={(e) => setNomForm({...nomForm, training_center: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">प्रारंभिक स्थिति (Status):</label>
                <select
                  value={nomForm.status}
                  onChange={(e) => setNomForm({...nomForm, status: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Nominated">नामित (Nominated)</option>
                  <option value="Under Training">प्रशिक्षणाधीन (Under Training)</option>
                  <option value="Passed">उत्तीर्ण (Passed)</option>
                  <option value="Exempted">छूट प्राप्त (Exempted)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNomModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rajbhasha-navy text-white rounded-lg hover:bg-slate-800 font-medium"
                >
                  नामांकन दर्ज करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Import from Excel/CSV */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="bg-rajbhasha-navy text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">एक्सेल फाइल से एक साथ कई कर्मचारी जोड़ें</h3>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Step 1: Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">चरण 1: मानक एक्सेल टेम्पलेट डाउनलोड करें</span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    इसमें आवश्यक कॉलम (कोड, हिंदी नाम, अंग्रेजी नाम, पदनाम, विभाग, वर्ग क/ख/ग/घ) तथा नमूना डेटा सम्मिलित है।
                  </span>
                </div>
                <a
                  href="/api/training/employees/template"
                  download="rajbhasha_employee_roster_template.xlsx"
                  className="flex items-center space-x-1.5 bg-rajbhasha-navy hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>टेम्पलेट डाउनलोड</span>
                </a>
              </div>

              {/* Step 2: Upload File */}
              <form onSubmit={handleBulkImport} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    चरण 2: भरी हुई एक्सेल (.xlsx) या सीएसवी (.csv) फाइल चुनें:
                  </label>
                  <input
                    type="file"
                    required
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      setBulkFile(e.target.files[0]);
                      setBulkResult(null);
                      setBulkError(null);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-rajbhasha-navy file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                </div>

                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <label className="flex items-start space-x-2 cursor-pointer text-amber-950 font-medium">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={(e) => setClearExisting(e.target.checked)}
                      className="mt-0.5 rounded border-amber-300 text-rajbhasha-navy focus:ring-amber-500"
                    />
                    <span>
                      <strong>मौजूदा सभी पुराने कर्मचारियों का डेटा हटाकर फ्रेश फाइल लोड करें</strong>
                      <span className="block text-[11px] text-amber-800 font-normal">
                        (टिक करने पर पहले का रोस्टर पूरी तरह मिट जाएगा और केवल इस फाइल का डेटा रहेगा)
                      </span>
                    </span>
                  </label>
                </div>

                {bulkError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {/* Import Results Summary */}
                {bulkResult && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3.5 text-xs text-emerald-950 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>डेटा सफलतापूर्वक प्रोसेस हुआ!</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="text-slate-500 block">कुल पंक्तियाँ:</span>
                        <span className="font-bold">{bulkResult.total_rows_processed}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="text-emerald-700 block font-semibold">नये कर्मचारी:</span>
                        <span className="font-bold text-emerald-800">{bulkResult.imported_count}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="text-blue-700 block font-semibold">अद्यतन (Updated):</span>
                        <span className="font-bold text-blue-800">{bulkResult.updated_count}</span>
                      </div>
                    </div>

                    {bulkResult.errors?.length > 0 && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded text-[11px]">
                        <span className="font-bold block mb-1">चेतावनी / अमान्य पंक्तियाँ:</span>
                        <ul className="list-disc list-inside space-y-0.5">
                          {bulkResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex justify-end space-x-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                  >
                    बंद करें
                  </button>
                  <button
                    type="submit"
                    disabled={bulkLoading || !bulkFile}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{bulkLoading ? "इम्पोर्ट हो रहा है..." : "रोस्टर में जोड़ें (Import Now)"}</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
