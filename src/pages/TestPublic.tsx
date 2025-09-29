import React from 'react';

const TestPublic = () => {
  console.log('TestPublic component rendering - SIMPLE TEST');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '1rem' }}>
        🎉 SUCCESS! Public Page Works!
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666', textAlign: 'center' }}>
        This is a public page that doesn't require authentication.
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
        <h3>Test Links:</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li><a href="/" style={{ color: '#0066cc' }}>Home Page</a></li>
          <li><a href="/home" style={{ color: '#0066cc' }}>Home Route</a></li>
          <li><a href="/public" style={{ color: '#0066cc' }}>Public Route</a></li>
          <li><a href="/test-public" style={{ color: '#0066cc' }}>Test Public (This Page)</a></li>
        </ul>
      </div>
    </div>
  );
};

export default TestPublic;