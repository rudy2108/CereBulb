import React, { useState } from 'react';
import Header from './Components/Header';
import SubHeader from './Components/Subheader';
import BoardDashboard from './Components/boardDashboard';
import ListDashboard from './Components/ListDashboard';

function App(){
  const [activeTab, setActiveTab] = useState('Board');

  return (
    <div className="w-full h-screen display">
       <Header />
       <SubHeader activeTab={activeTab} setActiveTab={setActiveTab} />
       {activeTab === 'Board' ? <BoardDashboard /> : <ListDashboard />}
    </div>
  )
}

export default App;