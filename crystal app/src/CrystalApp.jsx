import React, { useState, useEffect, useRef } from 'react';
import Login from './Login';
import Upload from './Upload';
import Results from './Results';
import Analysis from './Analysis';
import Export from './Export';

export default function CrystalApp() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const navigate = (page) => {
    setAnimKey(k => k + 1); // triggers re-mount → re-runs animation
    setCurrentPage(page);
  };

  const goToLogin  = () => { navigate('login');    setIsLoggedIn(false); };
  const goToUpload = () => { navigate('upload');   setIsLoggedIn(true);  };
  const goToResults  = () => navigate('results');
  const goToAnalysis = () => navigate('analysis');
  const goToExport   = () => navigate('export');

  const pageClass = currentPage === 'login' ? 'login-enter' : 'page-enter';

  return (
    <div key={animKey} className={pageClass}>
      {currentPage === 'login'    && <Login onLogin={goToUpload} />}
      {currentPage === 'upload'   && <Upload   goToResults={goToResults}   goToAnalysis={goToAnalysis} goToExport={goToExport}   goToLogin={goToLogin} />}
      {currentPage === 'results'  && <Results  goToUpload={goToUpload}     goToAnalysis={goToAnalysis} goToExport={goToExport}   goToLogin={goToLogin} />}
      {currentPage === 'analysis' && <Analysis goToUpload={goToUpload}     goToResults={goToResults}   goToExport={goToExport}   goToLogin={goToLogin} />}
      {currentPage === 'export'   && <Export   goToUpload={goToUpload}     goToResults={goToResults}   goToAnalysis={goToAnalysis} goToLogin={goToLogin} />}
    </div>
  );
}