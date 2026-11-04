import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { KrutiDevModal } from './components/KrutiDevModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { DocumentConverter } from './pages/DocumentConverter';
import { DakTracker } from './pages/DakTracker';
import { TrainingRoster } from './pages/TrainingRoster';
import { TranslationArchive } from './pages/TranslationArchive';
import { MeetingATR } from './pages/MeetingATR';
import { PolicyCompliance } from './pages/PolicyCompliance';

function MainApp() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isKrutiDevOpen, setIsKrutiDevOpen] = useState(false);

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setCurrentTab} />;
      case 'converter':
        return <DocumentConverter />;
      case 'dak':
        return <DakTracker />;
      case 'training':
        return <TrainingRoster />;
      case 'translation':
        return <TranslationArchive />;
      case 'meetings':
        return <MeetingATR />;
      case 'compliance':
        return <PolicyCompliance />;
      default:
        return <Dashboard setActiveTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onOpenKrutiDev={() => setIsKrutiDevOpen(true)} />
      
      <div className="flex flex-1 max-w-7xl w-full mx-auto shadow-sm">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {renderActivePage()}
        </main>
      </div>

      <KrutiDevModal
        isOpen={isKrutiDevOpen}
        onClose={() => setIsKrutiDevOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
