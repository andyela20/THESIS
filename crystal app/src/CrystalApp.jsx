import React, { useState, useEffect, useRef } from 'react';
import Login from './Login';
import Upload from './Upload';
import Results from './Results';
import Analysis from './Analysis';
import Export from './Export';
import Patients from './Patients';


export default function App() {
  const [currentPage, setCurrentPage] = useState('upload');

  // Navigation functions
  const goToLogin = () => setCurrentPage('login');
  const goToUpload = () => setCurrentPage('upload');
  const goToResults = () => setCurrentPage('results');
  const goToAnalysis = () => setCurrentPage('analysis');
  const goToExport = () => setCurrentPage('export');
  const goToPatients = () => setCurrentPage('patients');  
 

  // Conditional rendering
  return (
    <div>
      {currentPage === 'upload' && (
        <Upload 
          goToResults={goToResults}
          goToAnalysis={goToAnalysis}
          goToExport={goToExport}
          goToPatients={goToPatients}  
          goToLogin={goToLogin}
        />
      )}
      {currentPage === 'results' && (
        <Results 
          goToUpload={goToUpload}
          goToAnalysis={goToAnalysis}
          goToExport={goToExport}
          goToPatients={goToPatients}  
          goToLogin={goToLogin}
        />
      )}
      {currentPage === 'analysis' && (
        <Analysis 
          goToUpload={goToUpload}
          goToResults={goToResults}
          goToExport={goToExport}
          goToPatients={goToPatients}  
          goToLogin={goToLogin}
        />
      )}
      {currentPage === 'export' && (
        <Export 
          goToUpload={goToUpload}
          goToResults={goToResults}
          goToAnalysis={goToAnalysis}
          goToPatients={goToPatients}  
          goToLogin={goToLogin}
        />
      )}
      {currentPage === 'patients' && (  
        <Patients 
          goToLogin={goToLogin}
          goToUpload={goToUpload}
          goToResults={goToResults}
          goToAnalysis={goToAnalysis}
          goToExport={goToExport}  
        />
      )}
    </div>
  );
}