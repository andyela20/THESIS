import React, { useState } from 'react';
import Login from './Login';
import Upload from './Upload';
import Results from './Results';
import Analysis from './Analysis';
import Export from './Export';
import Patients from './Patients';
import ParticleLibrary from './ParticleLibrary';

// key must be on <PageTransition> itself (in the switch), not on an inner div
function PageTransition({ children }) {
  return <div className="page-enter" style={{ height: '100%' }}>{children}</div>;
}

export default function App() {
  const [currentPage, setCurrentPage]       = useState('login');
  const [crystalRecords, setCrystalRecords] = useState([]);
  const [analysisData, setAnalysisData]     = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);

  const [hasUnsavedResult, setHasUnsavedResult] = useState(false);
  const [unseenPatients, setUnseenPatients]      = useState(0);
  const [unseenReports, setUnseenReports]        = useState(0);

  const goToLogin  = () => setCurrentPage('login');
  const goToUpload = () => setCurrentPage('upload');

  const goToResults = (data) => {
    if (data) {
      setAnalysisData(data);
      setHasUnsavedResult(true);
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
    setHasUnsavedResult(false);
    setUnseenReports(prev => prev + 1);
  };

  const addNewPatient = (patient) => {
    setCurrentPatient(patient);
    setUnseenPatients(prev => prev + 1);
  };

  const clearCurrentPatient = () => setCurrentPatient(null);

  const clearAnalysisData = () => {
    setAnalysisData(null);
    setHasUnsavedResult(false);
  };

  const markResultsViewed = () => {};
  const markReportsViewed = () => setUnseenReports(0);

  const badges = {
    results:  hasUnsavedResult   ? '!' : null,
    patients: unseenPatients > 0 ? String(unseenPatients) : null,
    export:   unseenReports  > 0 ? String(unseenReports)  : null,
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <PageTransition key="login">
            <Login onLogin={goToUpload} />
          </PageTransition>
        );
      case 'upload':
        return (
          <PageTransition key="upload">
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
          </PageTransition>
        );
      case 'results':
        return (
          <PageTransition key="results">
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
          </PageTransition>
        );
      case 'analysis':
        return (
          <PageTransition key="analysis">
            <Analysis
              goToUpload={goToUpload}
              goToResults={goToResults}
              goToExport={goToExport}
              goToPatients={goToPatients}
              goToLibrary={goToLibrary}
              goToLogin={goToLogin}
              analysisData={analysisData}
              clearAnalysisData={clearAnalysisData}
              badges={badges}
            />
          </PageTransition>
        );
      case 'export':
        return (
          <PageTransition key="export">
            <Export
              goToUpload={goToUpload}
              goToResults={goToResults}
              goToAnalysis={goToAnalysis}
              goToPatients={goToPatients}
              goToLibrary={goToLibrary}
              goToLogin={goToLogin}
              markReportsViewed={markReportsViewed}
              analysisData={analysisData}
              clearAnalysisData={clearAnalysisData}
              badges={badges}
            />
          </PageTransition>
        );
      case 'patients':
        return (
          <PageTransition key="patients">
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
          </PageTransition>
        );
      case 'library':
        return (
          <PageTransition key="library">
            <ParticleLibrary
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
          </PageTransition>
        );
      default:
        return null;
    }
  };

  return <div style={{ height: '100vh', overflow: 'hidden' }}>{renderPage()}</div>;
}