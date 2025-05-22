import React from 'react';
import PropTypes from 'prop-types';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fff8f8',
      border: '1px solid #ffcdd2',
      borderRadius: '4px',
      margin: '10px 0',
      color: '#d32f2f',
      textAlign: 'center'
    }}>
      <h3>오류가 발생했습니다</h3>
      <p>{error.message}</p>
      {resetErrorBoundary && (
        <button 
          onClick={resetErrorBoundary}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          재시도
        </button>
      )}
      <details style={{ marginTop: '10px', textAlign: 'left' }}>
        <summary>상세 오류 정보</summary>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {error.stack}
        </pre>
      </details>
    </div>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object.isRequired,
  resetErrorBoundary: PropTypes.func
};

export default ErrorFallback; 