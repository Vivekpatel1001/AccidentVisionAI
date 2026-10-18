import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CityProvider } from './context/CityContext';
import { Layout } from './components/layout/Layout';

// Page components
import { OverviewPage } from './pages/OverviewPage';
import { AccidentMapPage } from './pages/AccidentMapPage';
import { HotspotsPage } from './pages/HotspotsPage';
import { TemporalAnalyticsPage } from './pages/TemporalAnalyticsPage';
import { SeverityPage } from './pages/SeverityPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { PredictionWorkspacePage } from './pages/PredictionWorkspacePage';
import { DatasetExplorerPage } from './pages/DatasetExplorerPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { MethodologyPage } from './pages/MethodologyPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CityProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<OverviewPage />} />
              <Route path="map" element={<AccidentMapPage />} />
              <Route path="hotspots" element={<HotspotsPage />} />
              <Route path="temporal" element={<TemporalAnalyticsPage />} />
              <Route path="severity" element={<SeverityPage />} />
              <Route path="model" element={<ModelPerformancePage />} />
              <Route path="predictions" element={<PredictionWorkspacePage />} />
              <Route path="explorer" element={<DatasetExplorerPage />} />
              <Route path="data-quality" element={<DataQualityPage />} />
              <Route path="methodology" element={<MethodologyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CityProvider>
    </QueryClientProvider>
  );
};

export default App;
