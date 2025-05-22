import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 헤더 */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #eee',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
          <span style={{ color: '#00C092', marginRight: '5px' }}>M</span>
          LOGO
        </div>
        <nav>
          <Link to="/" style={{ marginRight: '16px', textDecoration: 'none', color: '#333' }}>
            홈
          </Link>
          <Link to="/editor" style={{ textDecoration: 'none', color: '#333' }}>
            새 디자인 만들기
          </Link>
        </nav>
      </header>
      
      {/* 메인 컨텐츠 */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      
      {/* 푸터 */}
      <footer style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '16px',
        borderTop: '1px solid #eee',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        © 2023 WardrobeConfig. All rights reserved.
      </footer>
    </div>
  );
};

export default MainLayout; 