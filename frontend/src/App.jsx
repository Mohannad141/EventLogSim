import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import PageContainer from './components/layout/PageContainer.jsx';
import HomePage from './pages/HomePage.jsx';
import ConfigurationPage from './pages/ConfigurationPage.jsx';
import RunsPage from './pages/RunsPage.jsx';
import RunDetailPage from './pages/RunDetailPage.jsx';
import { RunsProvider } from './hooks/useRuns.jsx';


const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <BrowserRouter>
      <RunsProvider>
        <div className="min-h-screen bg-slate-100 text-slate-900">
          <Sidebar
          isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((value) => !value)}
          /> 
          <div
           className={sidebarOpen ? 'ml-72 min-h-screen' : 'ml-24 min-h-screen'}
           >
          <PageContainer>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/configuration" element={<ConfigurationPage />} />
              <Route path="/runs" element={<RunsPage />} />
              <Route path="/runs/:id" element={<RunDetailPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </PageContainer>
        </div>
        </div>
      </RunsProvider>
    </BrowserRouter>
  );
};

export default App;
