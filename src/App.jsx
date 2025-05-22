import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layouts/MainLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import DesignPage from './pages/design/DesignPage';
// import EditorPage from './components/editor/EditorPage'; // 기존 에디터 주석 처리
// import WardrobeEditorPage from './pages/WardrobeEditorPage'; // 기존 에디터 주석 처리
import NewEditorAdapter from './components/new-editor/NewEditorAdapter'; // 새 에디터 어댑터 import 경로 수정
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage'; // LoginPage import로 변경
import SignupPage from './pages/auth/SignupPage'; // SignupPage import 추가
import { AuthProvider } from './context/AuthContext';
import './App.css'; // CSS 파일 import
import WardrobeTestPage from './pages/test/WardrobeTestPage'; // 새로운 테스트 페이지 추가
import DnDExample from './components/dnd/DnDExample'; // DnD 예제 컴포넌트 추가

function App() {
  // 기본 공간 정보 설정
  const spaceInfo = {
    width: 4800,    // 너비 (mm)
    height: 2400,   // 높이 (mm)
    depth: 580,     // 깊이 (mm)
    spaceType: 'built-in',  // 공간 유형
    wallPosition: 'left'    // 벽 위치
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 로그인 페이지를 기본 경로로 설정 */}
          <Route path="/" element={<LoginPage />} />
          
          {/* 인증 관련 라우트 */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          
          {/* 기존 에디터 경로를 새 에디터로 대체 */}
          <Route path="/editor/:id?" element={<NewEditorAdapter />} />
          <Route path="/wardrobe-editor" element={<NewEditorAdapter />} />
          <Route path="/home" element={<HomePage />} />
          
          {/* 대시보드와 디자인 페이지는 /app 아래에 배치 */}
          <Route path="/app" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="design/:id" element={<DesignPage />} />
          </Route>
          
          {/* 워드로브 테스트 페이지 추가 */}
          <Route path="/test/wardrobe" element={<WardrobeTestPage />} />
          
          {/* DnD 예제 페이지 추가 */}
          <Route path="/test/dnd" element={<DnDExample />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 