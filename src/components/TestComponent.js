import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TestComponent = () => {
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Test the backend connection
    const testBackend = async () => {
      try {
        console.log('Testing backend connection...');
        const response = await axios.get('/health');
        console.log('Backend response:', response.data);
        setStatus(`Backend is connected! Response: ${JSON.stringify(response.data)}`);
      } catch (error) {
        console.error('Error connecting to backend:', error);
        setError(`Error connecting to backend: ${error.message}`);
        setStatus('Failed to connect to backend');
      }
    };

    testBackend();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">AI News Debate - Connection Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-2">Backend Connection Status:</h2>
        <p className={`p-3 rounded ${error ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {status}
        </p>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-lg font-medium text-red-800">Error Details:</h3>
            <p className="text-red-600">{error}</p>
            <p className="mt-2 text-sm text-gray-600">
              Make sure the backend server is running on port 5000 and the proxy is configured correctly in package.json.
            </p>
          </div>
        )}
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Troubleshooting Steps:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Check that the backend server is running on port 5000</li>
            <li>Verify that package.json has "proxy": "http://localhost:5000"</li>
            <li>Check browser console for any errors</li>
            <li>Try restarting both frontend and backend servers</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
