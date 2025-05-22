import React from 'react';
import { useParams, Link } from 'react-router-dom';

const DesignPage = () => {
  const { id } = useParams();

  return (
    <div style={{ padding: '20px' }}>
      <h2>디자인 상세</h2>
      <p>디자인 ID: {id}</p>
      
      <div style={{ marginTop: '20px' }}>
        <Link 
          to={`/editor/${id}`} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#00C092', 
            color: 'white', 
            borderRadius: '4px', 
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          에디터에서 열기
        </Link>
      </div>
    </div>
  );
};

export default DesignPage; 