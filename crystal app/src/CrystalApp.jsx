
import React, { useState } from 'react';
import Login from "C:\Users\Christine Joyce\Downloads\crystal-app\src\Login.jsx";
import Upload from "C:\Users\Christine Joyce\Downloads\crystal-app\src\Upload.jsx";
import Results from "C:\Users\Christine Joyce\Downloads\crystal-app\src\Results.jsx";
import Analysis from "C:\Users\Christine Joyce\Downloads\crystal-app\src\Analysis.jsx";
import Export from "C:\Users\Christine Joyce\Downloads\crystal-app\src\Export.jsx";

export default function CrystalApp() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Navigation functions
  const goToLogin = () => { setCurrentPage('login'); setIsLoggedIn(false); };
  const goToUpload = () => { setCurrentPage('upload'); setIsLoggedIn(true); };
  const goToResults = () => setCurrentPage('results');
  const goToAnalysis = () => setCurrentPage('analysis');
  const goToExport = () => setCurrentPage('export');

  return (
    <div>
      {currentPage === 'login' && <Login onLogin={goToUpload} />}
      {currentPage === 'upload' && <Upload goToResults={goToResults} goToAnalysis={goToAnalysis} goToExport={goToExport} goToLogin={goToLogin} />}
      {currentPage === 'results' && <Results goToUpload={goToUpload} goToAnalysis={goToAnalysis} goToExport={goToExport} goToLogin={goToLogin} />}
      {currentPage === 'analysis' && <Analysis goToUpload={goToUpload} goToResults={goToResults} goToExport={goToExport} goToLogin={goToLogin} />}
      {currentPage === 'export' && <Export goToUpload={goToUpload} goToResults={goToResults} goToAnalysis={goToAnalysis} goToLogin={goToLogin} />}
    </div>
  );
}
