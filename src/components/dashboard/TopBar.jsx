import React from 'react';
import { FiSearch, FiDownload, FiGrid, FiList, FiClock, FiType, FiChevronRight } from 'react-icons/fi';
import styles from './TopBar.module.css';

const TopBar = ({ viewMode, sortBy, onViewModeToggle, onSortChange }) => {
  return (
    <div className={styles.topBar}>
      <div className={styles.breadcrumb}>
        <span>전체 프로젝트</span>
        <FiChevronRight className={styles.chevron} />
      </div>

      <div className={styles.searchBar}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="프로젝트 이름으로 검색"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.exportButton}>
          <FiDownload />
          <span>Export</span>
        </button>

        <div className={styles.viewControls}>
          <button
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={onViewModeToggle}
            title="리스트 보기"
          >
            <FiList />
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={onViewModeToggle}
            title="그리드 보기"
          >
            <FiGrid />
          </button>
        </div>

        <button
          className={styles.sortButton}
          onClick={onSortChange}
          title={sortBy === 'date' ? '날짜순 정렬' : '이름순 정렬'}
        >
          {sortBy === 'date' ? <FiClock /> : <FiType />}
        </button>
      </div>
    </div>
  );
};

export default TopBar; 