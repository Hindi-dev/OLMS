import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  FileText, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ currentTab, setCurrentTab }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'converter', label: t('docConverter'), icon: FileText, badge: 'PDF→DOCX' },
    { id: 'dak', label: t('dakTracker'), icon: Mail },
    { id: 'training', label: t('trainingRoster'), icon: GraduationCap },
    { id: 'translation', label: t('translationArchive'), icon: BookOpen },
    { id: 'meetings', label: t('meetingAtr'), icon: Users },
    { id: 'compliance', label: t('policyCompliance'), icon: Award, badge: 'Sec 3(3)' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-100">
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          कार्यक्षेत्र / Navigation
        </span>
      </div>

      <nav className="p-3 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-rajbhasha-navy text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 space-y-1">
        <div className="font-semibold text-slate-700">राजभाषा कार्यान्वयन प्रकोष्ठ</div>
        <div>क्षेत्रीय वर्गीकरण: क, ख, ग क्षेत्र</div>
        <div className="text-[10px] text-slate-400 pt-1">v1.0.0 (स्थानीय एवं सुरक्षित)</div>
      </div>
    </aside>
  );
};
