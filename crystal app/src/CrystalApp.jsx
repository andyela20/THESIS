import React, { useState } from 'react';
import Login from './Login';
import Upload from './Upload';
import Results from './Results';
import Analysis from './Analysis';
import Export from './Export';
import Patients from './Patients';
import CrystalLibrary from './ParticleLibrary';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [crystalRecords, setCrystalRecords] = useState([]);

  // Navigation functions
  const goToLogin    = () => setCurrentPage('login');
  const goToUpload   = () => setCurrentPage('upload');
  const goToResults  = () => setCurrentPage('results');
  const goToAnalysis = () => setCurrentPage('analysis');
  const goToExport   = () => setCurrentPage('export');
  const goToPatients = () => setCurrentPage('patients');
  const goToLibrary  = () => setCurrentPage('library');

  const addCrystalRecords = (newRecords) => {
    setCrystalRecords(prev => [...prev, ...newRecords]);
  };

  return (
    <div>
      {currentPage === 'login' && (
        <Login onLogin={goToUpload} />
      )}
      {currentPage === 'upload' && (
        <Upload
          goToResults={goToResults}
          goToAnalysis={goToAnalysis}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          goToLogin={goToLogin}
        />
      )}
      {currentPage === 'results' && (
        <Results
          goToUpload={goToUpload}
          goToAnalysis={goToAnalysis}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          goToLogin={goToLogin}
          addCrystalRecords={addCrystalRecords}
        />
      )}
      {currentPage === 'analysis' && (
        <Analysis
          goToUpload={goToUpload}
          goToResults={goToResults}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          goToLogin={goToLogin}
        />
      )}
      {currentPage === 'export' && (
        <Export
          goToUpload={goToUpload}
          goToResults={goToResults}
          goToAnalysis={goToAnalysis}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
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
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          crystalRecords={crystalRecords}
        />
      )}
      {currentPage === 'library' && (
        <CrystalLibrary
          goToLogin={goToLogin}
          goToUpload={goToUpload}
          goToResults={goToResults}
          goToAnalysis={goToAnalysis}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          crystalRecords={crystalRecords}
        />
      )}
    </div>
  );
}