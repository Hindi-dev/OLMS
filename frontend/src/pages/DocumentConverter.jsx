import React, { useState } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { 
  UploadCloud, 
  FileCheck2, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  Languages, 
  RefreshCw 
} from 'lucide-react';

export const DocumentConverter = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [inspectData, setInspectData] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [loadingConvert, setLoadingConvert] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setError("केवल पीडीएफ (.pdf) फाइलें ही स्वीकार्य हैं।");
      return;
    }

    setFile(selected);
    setError(null);
    setConversionResult(null);

    // Auto-inspect PDF
    const formData = new FormData();
    formData.append('file', selected);
    setLoadingInspect(true);
    try {
      const data = await api.inspectPdf(formData);
      setInspectData(data);
    } catch (err) {
      console.error(err);
      setError("दस्तावेज़ की जांच में त्रुटि: " + err.message);
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoadingConvert(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.convertPdf(formData);
      setConversionResult(res);
    } catch (err) {
      console.error(err);
      setError("रूपांतरण में त्रुटि: " + err.message);
    } finally {
      setLoadingConvert(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-rajbhasha-navy rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">दस्तावेज़ रूपांतरण इंजन (PDF → DOCX)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              देवनागरी लिपि (हिंदी यूनिकोड), टेबल, कॉलम और सरकारी प्रारूपों की अखंडता के साथ संपादन योग्य वर्ड (.docx) में बदलें।
            </p>
          </div>
        </div>
      </div>

      {/* Main Upload Area */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Drag and Drop Zone */}
        <div className="border-2 border-dashed border-slate-300 hover:border-rajbhasha-navy rounded-xl p-8 text-center transition bg-slate-50/50">
          <input
            type="file"
            id="pdf-upload"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-14 h-14 bg-blue-100/60 text-rajbhasha-navy rounded-full flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              {file ? file.name : "पीडीएफ फाइल यहाँ ड्रैग करें अथवा ब्राउज़ करने के लिए क्लिक करें"}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "अधिकतम आकार: 50MB | समर्थित: डिजिटल एवं स्कैन की गई पीडीएफ"}
            </span>
          </label>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pre-conversion Inspection Details */}
        {inspectData && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" /> दस्तावेज़ संरचना विश्लेषण (Pre-check)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {inspectData.page_count} पृष्ठ (Pages)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block">कुल पृष्ठ:</span>
                <span className="font-bold text-slate-800 text-sm">{inspectData.page_count}</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block">टेक्स्ट प्रकार:</span>
                <span className={`font-semibold ${inspectData.is_digital_text ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {inspectData.is_digital_text ? "डिजिटल टेक्स्ट (Digital Stream)" : "स्कैन/इमेज आधारित"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block">देवनागरी पहचान:</span>
                  <span className={`font-semibold ${inspectData.has_devanagari ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {inspectData.has_devanagari ? "उपलब्ध (Hindi Unicode)" : "अन्य / अंग्रेजी"}
                  </span>
                </div>
                <Languages className="w-5 h-5 text-slate-300" />
              </div>

            </div>

            {inspectData.sample_preview && (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">पूर्वावलोकन (Preview Snippet):</span>
                <p className="text-xs text-slate-700 font-devanagari line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100">
                  {inspectData.sample_preview}
                </p>
              </div>
            )}

            {/* Convert Trigger */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleConvert}
                disabled={loadingConvert}
                className="flex items-center space-x-2 bg-rajbhasha-navy hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition disabled:opacity-50 text-xs"
              >
                {loadingConvert ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>डीओसीएक्स में रूपांतरित हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>वर्ड (.docx) में बदलें</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* Post-conversion Result & Download Block */}
        {conversionResult && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">रूपांतरण सफलतापूर्वक संपन्न!</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  फाइल: <span className="font-semibold">{conversionResult.filename}</span> ({(conversionResult.output_size_bytes / 1024).toFixed(1)} KB)
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  विधि: {conversionResult.method_used} | फॉन्ट अखंडता संरक्षित
                </p>
              </div>
            </div>

            <a
              href={conversionResult.download_url}
              download={conversionResult.filename}
              className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-lg shadow transition text-xs shrink-0 self-end md:self-center"
            >
              <Download className="w-4 h-4" />
              <span>वर्ड फाइल डाउनलोड करें (.docx)</span>
            </a>
          </div>
        )}

      </div>

      {/* Feature Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-slate-800">१. देवनागरी यूनिकोड विश्वसनीयता</div>
          <p className="text-slate-500">
            मङ्गल (Mangal), कोकिला, अपराजिता एवं अन्य यूनिकोड फॉन्ट्स की मात्राएं एवं संयुक्ताक्षर बिना विखंडन के सुरक्षित रहते हैं।
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-slate-800">२. सारिणी एवं लेआउट संरेखण</div>
          <p className="text-slate-500">
            सरकारी आदेशों में सम्मिलित जटिल तालिकाओं (Tables) की बॉर्डर, सेल एलाइनमेंट तथा मल्टी-कॉलम को वर्ड टेबल्स में रूपांतरित करता है।
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-slate-800">३. १००% स्थानीय एवं निजी</div>
          <p className="text-slate-500">
            कोई भी दस्तावेज़ किसी भी बाहरी क्लाउड सर्वर पर नहीं भेजा जाता। संपूर्ण प्रोसेसिंग केवल आपके कंप्यूटर पर होती है।
          </p>
        </div>

      </div>

    </div>
  );
};
