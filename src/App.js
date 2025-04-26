import React, { useState } from 'react';
import AiNewsDebate from './components/AiNewsDebate';
import TestComponent from './components/TestComponent';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [showTest, setShowTest] = useState(false); // Default to main app instead of test
  
  return (
    <AuthProvider>
      <div className="App">
        {showTest ? (
          <>
            <TestComponent />
            <div className="fixed bottom-4 right-4">
              <button 
                onClick={() => setShowTest(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Show Main App
              </button>
            </div>
          </>
        ) : (
          <>
            <AiNewsDebate />
            <div className="fixed bottom-4 right-4">
              <button 
                onClick={() => setShowTest(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Back to Test
              </button>
            </div>
          </>
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
