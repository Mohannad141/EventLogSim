import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopNav from './components/layout/TopNav.jsx';
import PageContainer from './components/layout/PageContainer.jsx';
import HomePage from './pages/HomePage.jsx';
import ConfigurationPage from './pages/ConfigurationPage.jsx';
import RunsPage from './pages/RunsPage.jsx';
import RunDetailPage from './pages/RunDetailPage.jsx';
import { RunsProvider } from './hooks/useRuns.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <RunsProvider>
        <div className="min-h-screen bg-gray-50">
          <TopNav />
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
      </RunsProvider>
    </BrowserRouter>
  );
};

export default App;
