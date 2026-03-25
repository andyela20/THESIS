import React, { useState } from 'react';
import Login from './Login';
import Upload from './Upload';
import Results from './Results';
import Analysis from './Analysis';
import Export from './Export';
import Patients from './Patients';
import CrystalLibrary from './CrystalLibrary';

export default function App() {
  const [currentPage, setCurrentPage]       = useState('login');
  const [crystalRecords, setCrystalRecords] = useState([]);
  const [analysisData, setAnalysisData]     = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);

  // true = may analysis result na hindi pa na-save sa library
  const [hasUnsavedResult, setHasUnsavedResult] = useState(false);

  const [unseenPatients, setUnseenPatients] = useState(0);
  const [unseenReports, setUnseenReports]   = useState(0);

  const goToLogin    = () => setCurrentPage('login');
  const goToUpload   = () => setCurrentPage('upload');

  const goToResults = (data) => {
    if (data) {
      setAnalysisData(data);
      setHasUnsavedResult(true);   // bagong analysis — may unsaved result
    }
    setCurrentPage('results');
  };

  const goToAnalysis = () => setCurrentPage('analysis');

  const goToExport = () => {
    setUnseenReports(0);
    setCurrentPage('export');
  };

  const goToPatients = () => {
    setUnseenPatients(0);
    setCurrentPage('patients');
  };

  const goToLibrary = () => setCurrentPage('library');

  const addCrystalRecords = (newRecords) => {
    setCrystalRecords(prev => [...prev, ...newRecords]);
    setHasUnsavedResult(false);    // na-save na — clear ang Results badge
    setUnseenReports(prev => prev + 1);
  };

  const addNewPatient = (patient) => {
    setCurrentPatient(patient);
    setUnseenPatients(prev => prev + 1);
  };

  const clearCurrentPatient = () => setCurrentPatient(null);

  const markResultsViewed = () => {};        // kept for compatibility
  const markReportsViewed = () => setUnseenReports(0);

  const badges = {
    results:  hasUnsavedResult   ? '!' : null,   // '!' = may pending unsaved result
    patients: unseenPatients > 0 ? String(unseenPatients) : null,
    export:   unseenReports  > 0 ? String(unseenReports)  : null,
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
          currentPatient={currentPatient}
          setCurrentPatient={addNewPatient}
          clearCurrentPatient={clearCurrentPatient}
          badges={badges}
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
          analysisData={analysisData}
          markResultsViewed={markResultsViewed}
          badges={badges}
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
          badges={badges}
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
          markReportsViewed={markReportsViewed}
          badges={badges}
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
          badges={badges}
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
          badges={badges}
        />
      )}
    </div>
  );
}