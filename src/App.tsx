import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ForecastProvider } from './context/ForecastContext';
import { ForecastingSheetPage } from './components/ForecastingSheetPage';
import { ForecastRowDetailPage } from './components/ForecastRowDetailPage';

function App() {
  return (
    <ForecastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ForecastingSheetPage />} />
          <Route path="/rows/:id" element={<ForecastRowDetailPage />} />
        </Routes>
      </BrowserRouter>
    </ForecastProvider>
  );
}

export default App;
