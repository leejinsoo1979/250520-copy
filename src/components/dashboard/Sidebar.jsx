import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiGrid, FiClock, FiStar, FiShare2, FiUser, FiUsers, FiSettings, FiLogOut, 
  FiPlus, FiUserPlus } from 'react-icons/fi';
import styles from './Sidebar.module.css';

const menuItems = [
  { id: 'all', icon: <FiGrid />, label: '전체 프로젝트', path: '/dashboard' },
  { id: 'important', icon: <FiStar />, label: '중요 프로젝트', path: '/dashboard/important' },
  { id: 'shared', icon: <FiShare2 />, label: '공유 프로젝트', path: '/dashboard/shared' },
  { id: 'profile', icon: <FiUser />, label: '내 정보 관리', path: '/profile' },
  { id: 'team', icon: <FiUsers />, label: '팀 계정 관리', path: '/team' },
  { id: 'settings', icon: <FiSettings />, label: '설정', path: '/settings' }
];

const Sidebar = ({ onCreateProject, onInviteUser, onLogout }) => {
  const location = useLocation();

  return (
    <div className={styles.sidebar}>
      <div className={styles.profile}>
        <div className={styles.profileImage}>
          <FiUser size={24} />
        </div>
        <div className={styles.profileInfo}>
          <span className={styles.userName}>사용자 이름</span>
          <span className={styles.userEmail}>user@example.com</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.createButton} onClick={onCreateProject}>
          <FiPlus />
          <span>프로젝트 생성</span>
        </button>
        <button className={styles.inviteButton} onClick={onInviteUser}>
          <FiUserPlus />
          <span>사용자 초대</span>
        </button>
      </div>

      <nav className={styles.nav}>
        <ul>
          {menuItems.map(item => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`${styles.menuItem} ${location.pathname === item.path ? styles.active : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <button className={styles.logoutButton} onClick={onLogout}>
        <FiLogOut />
        <span>로그아웃</span>
      </button>
    </div>
  );
};

export default Sidebar; 