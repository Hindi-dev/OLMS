import React, { useState } from 'react';
import { api } from '../api/client';
import { X, Copy, Check, ArrowRightLeft, Sparkles } from 'lucide-react';

export const KrutiDevModal = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConvert = async (textToConvert = inputText) => {
    if (!textToConvert.trim()) {
      setOutputText('');
      return;
    }
    setLoading(true);
    try {
      const res = await api.convertKrutiDev(textToConvert);
      setOutputText(res.unicode_text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const samplePresets = [
    { label: "भारत सरकार (Hkkjr ljdkj)", val: "Hkkjr ljdkj" },
    { label: "कार्यालय आदेश (dk;kZy; vkns'k)", val: "dk;kZy; vkns'k" },
    { label: "राजभाषा नीति (jktHkk" + "kk uhfr)", val: "jktHkkkk uhfr" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-rajbhasha-navy text-white px-5 py-4 flex items-center justify-between border-b-2 border-rajbhasha-saffron">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base">कृति देव ↔ यूनीकोड फॉन्ट कनवर्टर</h3>
              <p className="text-xs text-slate-300">Kruti Dev 010 / DevLys to Standard Unicode Devanagari</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Quick Presets */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> नमूना टेक्स्ट:
            </span>
            {samplePresets.map((p, i) => (
              <button
                key={i}
                onClick={() => { setInputText(p.val); handleConvert(p.val); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-[11px] border border-slate-200 transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input Kruti Dev */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex justify-between">
                <span>कृति देव / DevLys 010 टेक्स्ट:</span>
                <span className="text-slate-400 font-normal">{inputText.length} वर्ण</span>
              </label>
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleConvert(e.target.value);
                }}
                placeholder="यहाँ कृति देव फॉन्ट में टाइप किया गया टेक्स्ट पेस्ट करें..."
                rows={7}
                className="w-full text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rajbhasha-navy focus:border-transparent resize-none font-mono"
              />
            </div>

            {/* Output Unicode */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  मानक यूनीकोड (मङ्गल / यूनिकोड देवनागरी):
                </label>
                <button
                  onClick={handleCopy}
                  disabled={!outputText}
                  className="flex items-center space-x-1 text-xs text-rajbhasha-navy hover:text-blue-800 disabled:opacity-40 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "कॉपी हो गया!" : "कॉपी करें"}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={outputText}
                placeholder="परिवर्तित मानक यूनीकोड टेक्स्ट यहाँ दिखाई देगा..."
                rows={7}
                className="w-full text-sm p-3 rounded-lg border border-emerald-300 bg-emerald-50/40 text-slate-900 focus:outline-none resize-none font-devanagari font-medium"
              />
            </div>

          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
            <span className="font-bold">सूचना:</span>
            <span>
              यह टूल पुराने सरकारी प्रारूपों और पत्रों को बिना फॉन्ट मिसमैच के मानक यूनीकोड (Mangal/Noto Sans) में बदलने हेतु डिज़ाइन किया गया है।
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg shadow-sm"
          >
            बंद करें
          </button>
          <button
            onClick={() => handleConvert()}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-white bg-rajbhasha-navy hover:bg-slate-800 rounded-lg shadow-sm"
          >
            {loading ? "रूपांतरित हो रहा है..." : "पुनः रूपांतरित करें"}
          </button>
        </div>

      </div>
    </div>
  );
};
