import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/layout/Header';
import WelcomePage from './pages/WelcomePage';
import './styles/index.css';

const App = () => (
  <ThemeProvider>
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
