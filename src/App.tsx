import React, { useState } from 'react';
import { Plane } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import DataExtractorPage from './components/DataExtractorPage';
import CommandGeneratorPage from './components/CommandGeneratorPage';
import './App.css';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="navigation">
      <div className="nav-logo">
        <Plane size={28} />
        <h1>OVERSEAS Passport Formatter</h1>
      </div>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Data Extractor
        </Link>
        <Link to="/command-generator" className={location.pathname === '/command-generator' ? 'active' : ''}>
          Command Generator
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DataExtractorPage />} />
            <Route path="/command-generator" element={<CommandGeneratorPage />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} OVERSEAS Passport Formatter</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;