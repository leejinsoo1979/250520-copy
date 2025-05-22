import React from 'react';
import styled from '@emotion/styled';
import Header from './Header';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Main = styled.main`
  display: flex;
  flex: 1;
  background-color: var(--background-color);
`;

const Content = styled.div`
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
`;

const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <LayoutContainer>
      <Header />
      <Main>
        <Sidebar />
        <Content>{children}</Content>
      </Main>
    </LayoutContainer>
  );
};

export default Layout; 