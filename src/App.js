import React from 'react';
// import { useState } from 'react';
// import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { Navigate } from "react-router-dom";
import StandingsPage from './pages/standings'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<StandingsPage/>}/>
        <Route path='/:url_division' element={<StandingsPage/>}/>
        <Route path='/:url_division/:url_season' element={<StandingsPage/>}/>
        <Route path='/:url_division/:url_season/*' element={<StandingsPage/>}/>
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
  </Router>
  );
}
export default App;