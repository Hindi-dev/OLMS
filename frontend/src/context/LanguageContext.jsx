import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const translations = {
  hi: {
    appTitle: "राजभाषा-प्रबंधक",
    appSubtitle: "प्रशासनिक कार्यप्रवाह, अनुपालन निगरानी एवं अनुवाद प्रबंधन सूट",
    govIndia: "भारत सरकार / Government of India",
    dashboard: "डैशबोर्ड",
    docConverter: "दस्तावेज़ रूपांतरण",
    dakTracker: "काम / डाक ट्रैकर",
    trainingRoster: "प्रशिक्षण रोस्टर",
    translationArchive: "अनुवाद संदर्भ कोष",
    meetingAtr: "कार्यवृत्त एवं एटीआर",
    policyCompliance: "राजभाषा नीति एवं क्यूपीआर",
    krutiConverter: "कृति देव कनवर्टर",
    totalDak: "कुल डाक रिकॉर्ड",
    pendingDak: "लंबित डाक",
    urgentDak: "अति आवश्यक / तात्कालिक",
    trainedEmployees: "प्रशिक्षित कर्मचारी",
    openAtr: "खुले एटीआर संकल्प",
    sec33Compliance: "धारा 3(3) अनुपालन दर",
    quickActions: "त्वरित कार्रवाइयां",
    recentDak: "हालिया डाक आवक",
    status: "स्थिति",
    priority: "प्राथमिकता",
    category: "श्रेणी",
    date: "तिथि",
    subject: "विषय",
    actions: "कार्रवाई",
    save: "सुरक्षित करें",
    cancel: "रद्द करें",
    uploadPdf: "पीडीएफ अपलोड करें",
    convertNow: "डीओसीएक्स (.docx) में बदलें",
    downloadDocx: "वर्ड दस्तावेज़ डाउनलोड करें",
    searchPlaceholder: "खोजें...",
    all: "सभी",
  },
  en: {
    appTitle: "Rajbhasha Prabandhak",
    appSubtitle: "Administrative Workflows, Compliance Tracking & Translation Management Suite",
    govIndia: "Government of India",
    dashboard: "Dashboard",
    docConverter: "Document Converter",
    dakTracker: "Dak & Task Tracker",
    trainingRoster: "Training Roster",
    translationArchive: "Translation Memory",
    meetingAtr: "Minutes & ATR",
    policyCompliance: "Policy & QPR Compliance",
    krutiConverter: "Kruti Dev Converter",
    totalDak: "Total Dak Records",
    pendingDak: "Pending Dak",
    urgentDak: "Urgent / Immediate",
    trainedEmployees: "Trained Employees",
    openAtr: "Open ATR Resolutions",
    sec33Compliance: "Section 3(3) Compliance",
    quickActions: "Quick Actions",
    recentDak: "Recent Inward Dak",
    status: "Status",
    priority: "Priority",
    category: "Category",
    date: "Date",
    subject: "Subject",
    actions: "Actions",
    save: "Save",
    cancel: "Cancel",
    uploadPdf: "Upload PDF",
    convertNow: "Convert to DOCX",
    downloadDocx: "Download Word (.docx)",
    searchPlaceholder: "Search...",
    all: "All",
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('hi'); // Default to Hindi

  const toggleLanguage = () => {
    setLang(prev => (prev === 'hi' ? 'en' : 'hi'));
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
