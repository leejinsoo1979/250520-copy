import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/WardrobeEditor.module.css';
import RoomViewer3D from '../components/common/RoomViewer3D';
import { FiArrowLeft, FiSave, FiHome, FiEye, FiEyeOff, FiGrid, FiCheck, FiLayers, FiList, FiBox, FiDroplet, FiCpu, FiMoreHorizontal } from 'react-icons/fi';
import ViewerContainer from '../components/ViewerContainer';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import styled from 'styled-components';
import ModuleSelector from '../components/editor/ModuleSelector';
import ToolPanel from '../components/editor/ToolPanel';
import { useParams, useNavigate } from 'react-router-dom';
// EditorContext 임포트
import { useEditor, EditorProvider } from '@context/EditorContext';
import { FRAME_DIMENSIONS } from '../config/frameConfig';

// 상단 네비게이션 바
const TopNavBar = () => {
  return (
    <div className={styles.topNavBar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>m</div>
        LOGO
      </div>
      <div className={styles.navActions}>
        <button className={`${styles.navButton} ${styles.primaryButton}`}>
          Start to Deisgn
        </button>
        <div>회원가입</div>
        <div>로그인</div>
      </div>
    </div>
  );
};

// LeftSidebar를 최신 버전인 new-editor의 LeftSidebar로 대체
import { LeftSidebar as NewEditorLeftSidebar } from '../components/new-editor/LeftSidebar';

// 중앙 뷰어 컴포넌트
const CenterViewer = ({ selectedModule }) => {
  const {
    viewMode,
    setViewMode,
    cameraView,
    setCameraView,
    showGrid,
    setShowGrid,
    showShadows,
    setShowShadows,
    roomDimensions,
    installationType,
    wallPosition,
    frameProperties,
    updateViewers
  } = useEditor();
  
  // 프레임 속성 변경 추적을 위한 ref
  const framePropertiesRef = useRef(frameProperties);
  
  useEffect(() => {
    // 프레임 속성 변경 감지
    if (JSON.stringify(framePropertiesRef.current) !== JSON.stringify(frameProperties)) {
      console.log('[CenterViewer] 프레임 속성 변경됨:', frameProperties);
      framePropertiesRef.current = {...frameProperties};
    }
  }, [frameProperties]);
  
  // 드래그 오버 핸들러 - useRef와 useEffect를 사용하여 passive:false 설정
  const viewerAreaRef = useRef(null);
  
  useEffect(() => {
    const viewerArea = viewerAreaRef.current;
    if (!viewerArea) return;
    
    // preventDefault를 호출해야 하는 이벤트는 passive:false로 설정
    const handleDragOver = (e) => {
      e.preventDefault();
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      const moduleId = e.dataTransfer.getData('moduleId');
      if (moduleId) {
        // 뷰어 영역 내 드롭 위치 계산
        const viewerRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - viewerRect.left;
        const y = e.clientY - viewerRect.top;
        
        console.log(`모듈 ${moduleId}이(가) 뷰어 영역에 드롭됨: (${x}, ${y})`);
      }
    };
    
    // passive:false 설정으로 addEventListener 사용
    viewerArea.addEventListener('dragover', handleDragOver, { passive: false });
    viewerArea.addEventListener('drop', handleDrop, { passive: false });
    
    return () => {
      viewerArea.removeEventListener('dragover', handleDragOver);
      viewerArea.removeEventListener('drop', handleDrop);
    };
  }, []);
  
  // RoomViewer3D에 전달할 공간 정보 설정
  const spaceInfo = {
    width: roomDimensions.width,
    height: roomDimensions.height,
    depth: roomDimensions.depth,
    spaceType: installationType,
    wallPosition: wallPosition,
    // 에어컨 단내림 정보 
    hasAirConditioner: frameProperties.hasAirConditioner === 'yes',
    acUnit: {
      position: frameProperties.acUnit?.position || 'left',
      width: frameProperties.acUnit?.width || 900,
      height: frameProperties.acUnit?.height || 200,
      present: frameProperties.hasAirConditioner === 'yes'
    },
    // 바닥 마감재 정보
    hasFloorFinish: frameProperties.hasFloorFinish === 'yes',
    floorThickness: frameProperties.floorThickness || 20
  };
  
  // RoomViewer3D에 전달할 placementInfo 설정
  const placementInfo = {
    type: installationType,
    wallPosition: wallPosition,
    baseHeight: frameProperties.baseHeight,
    focusedFrame: frameProperties.focusedFrame,
    // 에어컨 단내림 정보도 동일하게 전달
    hasAirConditioner: frameProperties.hasAirConditioner === 'yes',
    acUnit: {
      position: frameProperties.acUnit?.position || 'left',
      width: frameProperties.acUnit?.width || 900,
      height: frameProperties.acUnit?.height || 200,
      present: frameProperties.hasAirConditioner === 'yes'
    }
  };
  
  return (
    <div className={styles.centerViewer}>
      {/* 상단 컨트롤 */}
      <div className={styles.viewerControls}>
        {/* 카테고리 선택 탭 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ 
            padding: '6px 12px', 
            borderRadius: '4px', 
            backgroundColor: '#00C092', 
            color: 'white',
            fontSize: '13px'
          }}>
            키큰장
          </div>
          <div style={{ 
            padding: '6px 12px', 
            borderRadius: '4px', 
            backgroundColor: 'white', 
            color: '#333',
            border: '1px solid #e5e7eb',
            fontSize: '13px'
          }}>
            하부장
          </div>
          <div style={{ 
            padding: '6px 12px', 
            borderRadius: '4px', 
            backgroundColor: 'white', 
            color: '#333',
            border: '1px solid #e5e7eb',
            fontSize: '13px'
          }}>
            패널
          </div>
          <div style={{ 
            padding: '6px 12px', 
            borderRadius: '4px', 
            backgroundColor: 'white', 
            color: '#333',
            border: '1px solid #e5e7eb',
            fontSize: '13px'
          }}>
            층선반
          </div>
        </div>
        
        {/* 오른쪽 뷰 컨트롤 */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* 뷰 변경 버튼 그룹 */}
          <div style={{ 
            display: 'flex', 
            gap: '0px', 
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <button 
              style={{ 
                padding: '6px 10px', 
                backgroundColor: cameraView === 'front' ? '#edf2fe' : 'white',
                color: cameraView === 'front' ? '#2970ff' : '#333',
                borderRight: '1px solid #e5e7eb',
                fontSize: '13px'
              }}
              onClick={() => setCameraView('front')}
            >
              정면
            </button>
            <button 
              style={{ 
                padding: '6px 10px', 
                backgroundColor: cameraView === 'side' ? '#edf2fe' : 'white',
                color: cameraView === 'side' ? '#2970ff' : '#333',
                borderRight: '1px solid #e5e7eb',
                fontSize: '13px'
              }}
              onClick={() => setCameraView('side')}
            >
              측면
            </button>
            <button 
              style={{ 
                padding: '6px 10px', 
                backgroundColor: cameraView === 'top' ? '#edf2fe' : 'white',
                color: cameraView === 'top' ? '#2970ff' : '#333',
                fontSize: '13px'
              }}
              onClick={() => setCameraView('top')}
            >
              상단
            </button>
          </div>
          
          {/* 그리드 표시 토글 */}
          <button 
            style={{ 
              padding: '6px 10px', 
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              backgroundColor: showGrid ? '#edf2fe' : 'white',
              color: showGrid ? '#2970ff' : '#333',
              fontSize: '13px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center'
            }}
            onClick={() => setShowGrid(!showGrid)}
          >
            <FiGrid size={14} />
            그리드
          </button>
        </div>
      </div>
      
      {/* 3D 뷰어 */}
      <div 
        className={styles.viewerArea}
        ref={viewerAreaRef}
      >
        <RoomViewer3D 
          spaceInfo={spaceInfo} 
          projectionMode={viewMode === 'normal' ? 'perspective' : 'orthographic'}
          viewType={cameraView}
          showFrame={true}
          step="step3"
          frameData={frameProperties}
          frameColor={frameProperties.frameColor || "#F0F0F0"}
          showModuleSlots={true}
          activeModuleId={selectedModule?.id} // 선택된 모듈 ID 전달
          showDimensionLines={showGrid}
          showDimensions={showGrid}
          showGuides={showGrid}
          frameProperties={frameProperties}
        />
      </div>
    </div>
  );
};

// 우측 속성 패널 컴포넌트
const RightPanel = () => {
  const {
    roomDimensions,
    updateRoomDimensions,
    installationType,
    updateInstallationType,
    wallPosition,
    setWallPosition,
    frameProperties,
    updateFrameProperty,
    calculateBaseWidth,
    doorCount,
    setDoorCount,
    updateViewers
  } = useEditor();
  
  // 프레임 속성 업데이트 함수 개선
  const updateFramePropertyWithViewerSync = (property, value) => {
    const numValue = Number(value);
    
    // 값 검증 및 범위 제한 (특히 상부 프레임 높이)
    let finalValue = numValue;
    
    // 상부 프레임 높이는 10mm~500mm 범위로 제한
    if (property === 'topFrameHeight') {
      const minHeight = 10;
      const maxHeight = 500;
      if (numValue < minHeight || numValue > maxHeight) {
        alert(`상부 프레임 높이는 ${minHeight}mm~${maxHeight}mm 범위로 제한됩니다.`);
        finalValue = Math.max(minHeight, Math.min(maxHeight, numValue));
      }
    }
    
    // 프레임 속성 업데이트
    console.log(`[WardrobeEditorPage] 프레임 속성 업데이트: ${property} = ${finalValue}`);
    updateFrameProperty(property, finalValue);
    
    // 뷰어 즉시 업데이트 (약간의 지연을 두어 상태 업데이트가 완료된 후 실행)
    setTimeout(() => {
      if (updateViewers) {
        console.log('[WardrobeEditorPage] 뷰어 강제 업데이트');
        updateViewers();
      }
    }, 50);
  };
  
  return (
    <div className={styles.rightPanel}>
      {/* 공간 치수 입력창 */}
      <div className={styles.panelSection}>
        <h3 className={styles.panelTitle}>공간 옵션</h3>
        
        <div style={{ padding: '8px 0' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            marginBottom: '16px',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }}>
            <button 
              style={{ 
                padding: '6px 12px', 
                backgroundColor: installationType === 'built-in' ? '#00C092' : 'white', 
                color: installationType === 'built-in' ? 'white' : '#333',
                border: 'none',
                flex: 1,
                fontSize: '13px'
              }}
              onClick={() => updateInstallationType('built-in')}
            >
              Built in
            </button>
            <button 
              style={{ 
                padding: '6px 12px', 
                backgroundColor: installationType === 'free-standing' ? '#00C092' : 'white', 
                color: installationType === 'free-standing' ? 'white' : '#333',
                border: 'none',
                flex: 1,
                fontSize: '13px'
              }}
              onClick={() => updateInstallationType('free-standing')}
            >
              Freestanding
            </button>
            <button 
              style={{ 
                padding: '6px 12px', 
                backgroundColor: installationType === 'semi-standing' ? '#00C092' : 'white', 
                color: installationType === 'semi-standing' ? 'white' : '#333',
                border: 'none',
                flex: 1,
                fontSize: '13px'
              }}
              onClick={() => updateInstallationType('semi-standing')}
            >
              Semi standing
            </button>
          </div>
          
          {installationType === 'semi-standing' && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              marginBottom: '16px'
            }}>
              <button 
                style={{ 
                  padding: '6px 12px', 
                  backgroundColor: 'white', 
                  color: wallPosition === 'left' ? '#00C092' : '#333',
                  border: wallPosition === 'left' ? '1px solid #00C092' : 'none',
                  fontSize: '13px'
                }}
                onClick={() => setWallPosition('left')}
              >
                Left
              </button>
              <button 
                style={{ 
                  padding: '6px 12px', 
                  backgroundColor: 'white', 
                  color: wallPosition === 'right' ? '#00C092' : '#333',
                  border: wallPosition === 'right' ? '1px solid #00C092' : 'none',
                  fontSize: '13px'
                }}
                onClick={() => setWallPosition('right')}
              >
                Right
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.dimensionFields}>
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>Width</label>
            <div className={styles.dimensionInputWithControls}>
              <button className={`${styles.dimensionControl} ${styles.dimensionControlLeft}`}>←</button>
              <input
                type="number"
                className={styles.dimensionInput}
                value={roomDimensions.width}
                onChange={(e) => updateRoomDimensions('width', e.target.value)}
              />
              <button className={`${styles.dimensionControl} ${styles.dimensionControlRight}`}>→</button>
            </div>
          </div>
          
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>Height</label>
            <div className={styles.dimensionInputWithControls}>
              <button className={`${styles.dimensionControl} ${styles.dimensionControlLeft}`}>↓</button>
              <input
                type="number"
                className={styles.dimensionInput}
                value={roomDimensions.height}
                onChange={(e) => updateRoomDimensions('height', e.target.value)}
              />
              <button className={`${styles.dimensionControl} ${styles.dimensionControlRight}`}>↑</button>
            </div>
          </div>
          
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>Depth</label>
            <div className={styles.dimensionInputWithControls}>
              <button className={`${styles.dimensionControl} ${styles.dimensionControlLeft}`}>↓</button>
              <input
                type="number"
                className={styles.dimensionInput}
                value={roomDimensions.depth}
                onChange={(e) => updateRoomDimensions('depth', e.target.value)}
              />
              <button className={`${styles.dimensionControl} ${styles.dimensionControlRight}`}>↑</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 배치 아이템 옵션 */}
      <div className={styles.panelSection}>
        <h3 className={styles.panelTitle}>배치아웃</h3>
        
        <div className={styles.dimensionFields}>
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>Number of doors</label>
            <div className={styles.dimensionInputWithControls}>
              <input
                type="number"
                className={styles.dimensionInput}
                value={doorCount}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  if (!isNaN(newValue) && newValue > 0) {
                    // 슬롯 너비 계산
                    const baseWidth = calculateBaseWidth();
                    const slotWidth = baseWidth / newValue;
                    
                    // 슬롯 너비가 유효 범위(300mm~600mm) 내에 있는지 확인
                    if (slotWidth < 300 || slotWidth > 600) {
                      // 팝업 메시지 표시
                      alert("도어 변경 범위 초과\n\n슬롯 너비는 300mm에서 600mm 사이여야 합니다.\n현재 계산된 슬롯 너비: " + Math.round(slotWidth) + "mm");
                    } else {
                      // doorCount 상태 업데이트 및 콘솔 로깅
                      console.log(`[WardrobeEditorPage] 도어 개수 변경: ${newValue}개`);
                      console.log(`[WardrobeEditorPage] 계산된 슬롯 너비: ${Math.round(slotWidth)}mm`);
                      setDoorCount(newValue);
                    }
                  }
                }}
              />
              <span className={styles.dimensionUnit}>개</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 선택 모듈 옵션 */}
      <div className={styles.panelSection}>
        <h3 className={styles.panelTitle}>선택 모듈 옵션</h3>
        
        <div className={styles.dimensionFields}>
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>Width</label>
            <div className={styles.dimensionInputWithControls}>
              <input
                type="number"
                className={styles.dimensionInput}
                readOnly
              />
            </div>
          </div>
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>Depth</label>
            <div className={styles.dimensionInputWithControls}>
              <input
                type="number"
                className={styles.dimensionInput}
                readOnly
              />
            </div>
          </div>
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>Height</label>
            <div className={styles.dimensionInputWithControls}>
              <input
                type="number"
                className={styles.dimensionInput}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* 프레임 속성 */}
      <div className={styles.panelSection}>
        <h3 className={styles.panelTitle}>프레임 속성</h3>
        <p style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginBottom: '12px',
          padding: '0 4px'
        }}>
          각 프레임의 사이즈는 공간 설정에 따라 영향을 받습니다.
          <br />• X축: 폭 (Width)
          <br />• Y축: 높이 (Height)
          <br />• Z축: 깊이 (Depth)
        </p>
        
        <div className={styles.dimensionFields}>
          {installationType === 'built-in' || (installationType === 'semi-standing' && wallPosition === 'left') ? (
            <div className={styles.dimensionField}>
              <label className={styles.dimensionLabel}>좌측 프레임 폭 (X축)</label>
              <div className={styles.dimensionInputWithControls}>
                <input
                  type="number"
                  className={styles.dimensionInput}
                  value={frameProperties.leftFrameWidth}
                  onChange={(e) => updateFramePropertyWithViewerSync('leftFrameWidth', e.target.value)}
                />
                <span className={styles.dimensionUnit}>mm</span>
              </div>
            </div>
          ) : (
            <div className={styles.dimensionField}>
              <label className={styles.dimensionLabel}>좌측 엔드판넬 두께 (X축)</label>
              <div className={styles.dimensionInputWithControls}>
                <input
                  type="number"
                  className={styles.dimensionInput}
                  value={frameProperties.endPanelThickness}
                  onChange={(e) => updateFramePropertyWithViewerSync('endPanelThickness', e.target.value)}
                />
                <span className={styles.dimensionUnit}>mm</span>
              </div>
            </div>
          )}
          
          {installationType === 'built-in' || (installationType === 'semi-standing' && wallPosition === 'right') ? (
            <div className={styles.dimensionField}>
              <label className={styles.dimensionLabel}>우측 프레임 폭 (X축)</label>
              <div className={styles.dimensionInputWithControls}>
                <input
                  type="number"
                  className={styles.dimensionInput}
                  value={frameProperties.rightFrameWidth}
                  onChange={(e) => updateFramePropertyWithViewerSync('rightFrameWidth', e.target.value)}
                />
                <span className={styles.dimensionUnit}>mm</span>
              </div>
            </div>
          ) : (
            <div className={styles.dimensionField}>
              <label className={styles.dimensionLabel}>우측 엔드판넬 두께 (X축)</label>
              <div className={styles.dimensionInputWithControls}>
                <input
                  type="number"
                  className={styles.dimensionInput}
                  value={frameProperties.endPanelThickness}
                  onChange={(e) => updateFramePropertyWithViewerSync('endPanelThickness', e.target.value)}
                />
                <span className={styles.dimensionUnit}>mm</span>
              </div>
            </div>
          )}
          
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>상부 프레임 높이 (Y축)</label>
            <div className={styles.dimensionInputWithControls}>
              <input
                type="number"
                className={styles.dimensionInput}
                value={frameProperties.topFrameHeight}
                onChange={(e) => updateFramePropertyWithViewerSync('topFrameHeight', e.target.value)}
              />
              <span className={styles.dimensionUnit}>mm</span>
            </div>
          </div>
          
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>프레임 깊이 (Z축)</label>
            <div className={styles.dimensionInputWithControls}>
              <input
                type="number"
                className={styles.dimensionInput}
                value={frameProperties.frameThickness}
                onChange={(e) => updateFramePropertyWithViewerSync('frameThickness', e.target.value)}
              />
              <span className={styles.dimensionUnit}>mm</span>
            </div>
          </div>
          
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>받침대 깊이 (Z축)</label>
            <div className={styles.dimensionInputWithControls}>
              <input
                type="number"
                className={styles.dimensionInput}
                value={frameProperties.baseDepth}
                onChange={(e) => updateFramePropertyWithViewerSync('baseDepth', e.target.value)}
              />
              <span className={styles.dimensionUnit}>mm</span>
            </div>
          </div>
          
          <div className={styles.dimensionField}>
            <label className={styles.dimensionLabel}>받침대 폭 (X축)</label>
            <div className={styles.dimensionInputWithControls}>
              <input
                type="number"
                className={styles.dimensionInput}
                value={calculateBaseWidth()}
                readOnly
              />
              <span className={styles.dimensionUnit}>mm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 웹 컨텍스트 로스트 로거 및 복구 핸들러 추가
const useWebGLContextLossHandler = () => {
  const [contextLost, setContextLost] = useState(false);
  const recoveryAttempts = useRef(0);

  useEffect(() => {
    // WebGL 컨텍스트 손실 이벤트 핸들러 - { passive: false } 옵션 추가
    const handleContextLoss = (event) => {
      // Context loss 이벤트는 preventDefault를 호출해야 함
      event.preventDefault(); // 기본 동작 방지
      console.error('WebGL 컨텍스트 손실이 감지되었습니다.');
      setContextLost(true);
      recoveryAttempts.current = 0;
    };

    // WebGL 컨텍스트 복구 이벤트 핸들러
    const handleContextRestored = () => {
      console.log('WebGL 컨텍스트가 복구되었습니다.');
      setContextLost(false);
      recoveryAttempts.current = 0;
    };

    // document 내의 모든 canvas 요소에 이벤트 리스너 등록 - passive 옵션 설정
    const registerEventListeners = () => {
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        // webglcontextlost 이벤트는 preventDefault를 호출해야 하므로 passive:false로 설정
        canvas.addEventListener('webglcontextlost', handleContextLoss, { passive: false });
        canvas.addEventListener('webglcontextrestored', handleContextRestored, { passive: true });
      });
    };

    // 초기 등록
    registerEventListeners();

    // 문서 변경 감지를 위한 MutationObserver 설정
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          registerEventListeners();
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      // 이벤트 리스너 제거
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        canvas.removeEventListener('webglcontextlost', handleContextLoss);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      });
      observer.disconnect();
    };
  }, []);

  // 컨텍스트 손실 시 복구 시도 함수
  const attemptRecovery = () => {
    if (contextLost && recoveryAttempts.current < 5) {
      recoveryAttempts.current += 1;
      console.log(`복구 시도 ${recoveryAttempts.current}/5...`);
      
      // 캔버스 요소들을 찾아 컨텍스트 재생성 시도
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        try {
          // 캔버스 크기를 약간 변경하여 컨텍스트 재초기화 유도
          const width = canvas.width;
          canvas.width = width - 1;
          setTimeout(() => {
            canvas.width = width;
          }, 100);
        } catch (e) {
          console.error('캔버스 복구 시도 중 오류:', e);
        }
      });
      
      return recoveryAttempts.current >= 5;
    }
    return false;
  };

  return { contextLost, attemptRecovery };
};

// 메인 에디터 페이지
const WardrobeEditorPage = () => {
  console.log('=== WardrobeEditorPage 컴포넌트 마운트 ===');
  
  // react-router-dom의 useParams()에서 id 가져오려 할 때 에러 방지
  let id = null;
  try {
    const params = useParams();
    id = params?.id;
    console.log('라우트 매개변수 ID:', id);
  } catch (error) {
    console.log('라우터 매개변수 없음, 기본 모드로 실행');
  }
  
  let navigate;
  try {
    navigate = useNavigate();
  } catch (error) {
    console.log('useNavigate 훅 사용 불가, 기본 모드로 실행');
    navigate = () => console.log('네비게이션 불가');
  }
  
  const [moduleList, setModuleList] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [spaceOptions, setSpaceOptions] = useState({
    width: 3600,
    height: 2400,
    depth: 600,
    installationType: 'built-in',
    acUnitEnabled: false,
    acUnitPosition: 'left',
    acUnitWidth: 1000,
    acUnitDepth: 300,
    floorFinish: {
      isEnabled: false,
      type: 'wood',
      height: 15
    }
  });
  const [showDimensions, setShowDimensions] = useState(true);
  const [activateGrid, setActivateGrid] = useState(true);
  const [showToolbox, setShowToolbox] = useState(true);
  const [showModuleList, setShowModuleList] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  // WebGL 컨텍스트 손실 핸들러 사용
  const { contextLost, attemptRecovery } = useWebGLContextLossHandler();
  
  // 디자인 데이터 로드
  const [designData, setDesignData] = useState(null);
  
  // 세션 스토리지에서 디자인 데이터 로드
  useEffect(() => {
    try {
      // 세션 스토리지에서 마지막으로 저장된 디자인 데이터 가져오기
      const lastDesignDataStr = sessionStorage.getItem('lastDesignData');
      let loadedDesignData = null;
      
      if (lastDesignDataStr) {
        const parsedData = JSON.parse(lastDesignDataStr);
        console.log('세션 스토리지에서 디자인 데이터 로드:', parsedData);
        
        // 라우트 매개변수로 받은 ID와 일치하는 디자인인지 확인
        if (id && parsedData.id === id) {
          console.log('ID 일치하는 디자인 데이터 로드:', parsedData);
          loadedDesignData = parsedData;
        } else if (id && parsedData.id !== id) {
          console.log('ID가 일치하지 않지만 사용 가능한 디자인 데이터:', parsedData);
          // ID가 다르더라도 데이터를 사용 (테스트 용도)
          loadedDesignData = parsedData;
        } else {
          console.log('ID 없이 디자인 데이터 로드:', parsedData);
          loadedDesignData = parsedData;
        }
      } else {
        console.log('세션 스토리지에 저장된 디자인 데이터 없음');
        
        // 기본 디자인 데이터 생성 (세션 스토리지에 데이터가 없는 경우)
        loadedDesignData = {
          id: 'default-design',
          name: '기본 디자인',
          data: {
            spaceInfo: {
              width: 4200, 
              height: 2500,
              depth: 650,
              spaceType: 'semi-standing',  // 'built-in', 'free-standing', 'semi-standing'
              wallPosition: 'left',        // 'left', 'right'
              hasAirConditioner: true,
              acUnit: { 
                position: 'left', 
                width: 900, 
                depth: 220,
                present: true 
              },
              hasFloorFinish: true,
              floorThickness: 25
            },
            baseSettings: {
              baseHeight: 120  // 받침대 높이
            },
            frameSettings: {  // 프레임 설정
              leftFrameWidth: FRAME_DIMENSIONS.default.leftFrameWidth,    // 50mm로 통일
              rightFrameWidth: FRAME_DIMENSIONS.default.rightFrameWidth,  // 50mm로 통일
              topFrameHeight: 25,    // 공간 높이의 약 1%
              frameThickness: FRAME_DIMENSIONS.default.frameThickness,    // 20mm
              baseDepth: FRAME_DIMENSIONS.default.baseDepth,             // 585mm
              endPanelThickness: FRAME_DIMENSIONS.default.endPanelThickness  // 17mm
            }
          }
        };
        
        console.log('기본 디자인 데이터 생성:', loadedDesignData);
      }
      
      // 디자인 데이터 설정
      setDesignData(loadedDesignData);
      
    } catch (err) {
      console.error('디자인 데이터 로드 오류:', err);
      
      // 오류 발생 시 기본 데이터 사용
      const defaultData = {
        id: 'default-design',
        name: '기본 디자인',
        data: {
          spaceInfo: {
            width: 4200, 
            height: 2500,
            depth: 650,
            spaceType: 'built-in',
            wallPosition: 'left',
            hasAirConditioner: false,
            acUnit: { position: 'left', width: 900, depth: 200, present: false },
            hasFloorFinish: false,
            floorThickness: 20
          },
          baseSettings: {
            baseHeight: 100
          },
          frameSettings: {
            leftFrameWidth: FRAME_DIMENSIONS.default.leftFrameWidth,
            rightFrameWidth: FRAME_DIMENSIONS.default.rightFrameWidth,
            topFrameHeight: 25,
            frameThickness: FRAME_DIMENSIONS.default.frameThickness,
            baseDepth: FRAME_DIMENSIONS.default.baseDepth,
            endPanelThickness: FRAME_DIMENSIONS.default.endPanelThickness
          }
        }
      };
      
      setDesignData(defaultData);
    }
  }, [id]);

  // 모듈 선택 핸들러
  const handleModuleSelect = (module) => {
    console.log("선택된 모듈:", module);
    setSelectedModule(module);
  };

  return (
    <EditorProvider initialDesignData={designData}>
      <TopNavBar />
      <div className={styles.editorContainer}>
        <NewEditorLeftSidebar 
          frameColor={designData?.data.frameSettings.frameColor || "#F0F0F0"}
          handleFrameColorChange={(color) => {
            // 프레임 색상 변경 로직 구현
          }}
          onModuleSelect={handleModuleSelect}
        />
        <CenterViewer selectedModule={selectedModule} />
        <RightPanel />
      </div>
    </EditorProvider>
  );
};

export default WardrobeEditorPage; 