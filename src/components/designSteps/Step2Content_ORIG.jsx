import React, { useState, useEffect } from 'react';
import styles from './Step2Content.module.css';
import RoomViewer3D from '../common/RoomViewer3D';
import { FiCheck } from 'react-icons/fi';

const Step2Content = ({ formData, errors, handleChange, handleNestedChange }) => {
  const [widthError, setWidthError] = useState(null);
  const [heightError, setHeightError] = useState(null);
  const [localDimensions, setLocalDimensions] = useState({
    width: formData.spaceInfo.width || '',
    height: formData.spaceInfo.height || ''
  });
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [viewerData, setViewerData] = useState({
    spaceInfo: {
      ...formData.spaceInfo,
      depth: 3000 // 항상 깊이는 3000mm로 고정
    },
    placementInfo: {
      type: formData.spaceInfo.spaceType || 'built-in',
      width: Number(formData.spaceInfo.width || 4800),
      height: Number(formData.spaceInfo.height || 2400),
      depth: 3000, // 항상 깊이는 3000mm로 고정
      clearance: { left: 50, right: 50, top: 50 },
      fit: 'normal'
    }
  });
  const [floorThickness, setFloorThickness] = useState(
    formData.spaceInfo.floorThickness || 0
  );

  // 컴포넌트 마운트 시 또는 formData 변경 시 기본값 설정
  useEffect(() => {
    // 한번에 모든 값을 설정하여 렌더링 최소화
    const defaultValues = {
      width: 4800,
      height: 2400,
      depth: 3000, // 항상 깊이는 3000mm로 고정
      hasAirConditioner: 'no',  // 에어컨 단내림 없음
      hasFloorFinish: 'no',     // 바닥 마감재 없음
      floorThickness: 0         // 바닥 마감재 두께
    };
    
    const needsUpdate = formData.spaceInfo.width !== defaultValues.width || 
      formData.spaceInfo.height !== defaultValues.height || 
      formData.spaceInfo.hasAirConditioner !== defaultValues.hasAirConditioner ||
      formData.spaceInfo.hasFloorFinish !== defaultValues.hasFloorFinish;
    
    // 필요한 경우에만 값 업데이트
    if (needsUpdate) {
      console.log('공간사이즈 및 기본 설정값 적용:', defaultValues);
      
      // 사이즈 업데이트
      handleNestedChange('spaceInfo', 'width', defaultValues.width);
      handleNestedChange('spaceInfo', 'height', defaultValues.height);
      handleNestedChange('spaceInfo', 'depth', defaultValues.depth);
      
      // 에어컨 단내림 및 바닥 마감재 설정
      handleNestedChange('spaceInfo', 'hasAirConditioner', defaultValues.hasAirConditioner);
      handleNestedChange('spaceInfo', 'hasFloorFinish', defaultValues.hasFloorFinish);
      handleNestedChange('spaceInfo', 'floorThickness', defaultValues.floorThickness);

      // 로컬 상태 업데이트
      setLocalDimensions({
        width: defaultValues.width,
        height: defaultValues.height
      });
      
      // 초기 뷰어 데이터 설정
      setViewerData({
        spaceInfo: {
          ...formData.spaceInfo,
          width: defaultValues.width,
          height: defaultValues.height,
          depth: defaultValues.depth,
          hasAirConditioner: defaultValues.hasAirConditioner,
          hasFloorFinish: defaultValues.hasFloorFinish
        },
        placementInfo: {
          type: formData.spaceInfo.spaceType || 'built-in',
          width: defaultValues.width,
          height: defaultValues.height,
          depth: defaultValues.depth,
          clearance: { left: 50, right: 50, top: 50 },
          fit: 'normal'
        }
      });
    }
  }, []);

  // 타이핑이 아닌 다른 입력 (버튼 클릭 등)에 의한 변경 감지
  useEffect(() => {
    if (!isTyping) {
      // 버튼 클릭 등 즉시 반영해야 하는 변경사항만 업데이트
      const nonSizeFields = ['spaceType', 'wallPosition', 'hasAirConditioner', 'hasFloorFinish', 'acUnit', 'floorThickness'];
      
      const hasNonSizeChange = nonSizeFields.some(field => 
        JSON.stringify(formData.spaceInfo[field]) !== JSON.stringify(viewerData.spaceInfo[field])
      );
      
      if (hasNonSizeChange) {
        setViewerData(prev => ({
          spaceInfo: {
            ...formData.spaceInfo,
            width: prev.spaceInfo.width,
            height: prev.spaceInfo.height,
            depth: 3000 // 항상 깊이는 3000mm로 고정
          },
          placementInfo: {
            ...prev.placementInfo,
            type: formData.spaceInfo.spaceType || 'built-in'
          }
        }));
      }
    }
  }, [
    formData.spaceInfo.spaceType, 
    formData.spaceInfo.wallPosition, 
    formData.spaceInfo.hasAirConditioner, 
    formData.spaceInfo.hasFloorFinish,
    formData.spaceInfo.floorThickness,
    formData.spaceInfo.acUnit
  ]);

  const handleDimensionChange = (dimension, value) => {
    // 입력값이 빈 문자열이거나 숫자인지 확인
    if (value === '' || /^\d+$/.test(value)) {
      // 입력 중 표시
      setIsTyping(true);
      
      // 숫자인 경우 앞의 0 제거
      const cleanedValue = value === '' ? '' : String(parseInt(value, 10) || 0);
      
      // 로컬 상태 업데이트
      setLocalDimensions(prev => ({
        ...prev,
        [dimension]: cleanedValue
      }));
      
      // 디바운스 처리 - 타이핑이 끝나면 실제 폼데이터 업데이트
      if (debounceTimer) clearTimeout(debounceTimer);
      
      const timer = setTimeout(() => {
        const numValue = cleanedValue === '' ? 0 : Number(cleanedValue);
        
        // 유효성 검사
        if (dimension === 'width') {
          if (numValue < 1200 || numValue > 4000) {
            setWidthError('너비는 1200mm에서 4000mm 사이여야 합니다.');
          } else {
            setWidthError(null);
          }
        } else if (dimension === 'height') {
          if (numValue < 2000 || numValue > 2700) {
            setHeightError('높이는 2000mm에서 2700mm 사이여야 합니다.');
          } else {
            setHeightError(null);
          }
        }
        
        // 폼데이터 업데이트
        handleNestedChange('spaceInfo', dimension, numValue);
        
        // 입력 완료 후 뷰어 데이터 업데이트
        setViewerData(prev => ({
          spaceInfo: {
            ...prev.spaceInfo,
            [dimension]: numValue
          },
          placementInfo: {
            ...prev.placementInfo,
            [dimension]: numValue
          }
        }));
        
        // 입력 완료 표시
        setIsTyping(false);
      }, 1500); // 1.5초 디바운스
      
      setDebounceTimer(timer);
    }
  };

  const handleFloorThicknessChange = (value) => {
    // 입력값이 빈 문자열이거나 숫자인지 확인
    if (value === '' || /^\d+$/.test(value)) {
      // 숫자인 경우 앞의 0 제거
      const cleanedValue = value === '' ? '' : String(parseInt(value, 10) || 0);
      setFloorThickness(cleanedValue);
      
      // 디바운스 처리
      if (debounceTimer) clearTimeout(debounceTimer);
      
      const timer = setTimeout(() => {
        const numValue = cleanedValue === '' ? 0 : Number(cleanedValue);
        
        // 폼데이터 업데이트
        handleNestedChange('spaceInfo', 'floorThickness', numValue);
      }, 1000);
      
      setDebounceTimer(timer);
    }
  };

  const handleAcUnitChange = (field, value) => {
    handleNestedChange('spaceInfo', 'acUnit', {
      ...formData.spaceInfo.acUnit,
      [field]: field === 'position' ? value : Number(value)
    });
  };

  // 에어컨 유무 변경 시 처리
  const handleAirConditionerChange = (value) => {
    handleNestedChange('spaceInfo', 'hasAirConditioner', value);
    
    // 에어컨 없음 선택 시, acUnit 기본값 설정
    if (value === 'no') {
      handleNestedChange('spaceInfo', 'acUnit', { position: 'left', width: 900, depth: 200 });
    } else {
      // 에어컨 있음 선택 시, 룸 깊이와 동일하게 설정
      handleNestedChange('spaceInfo', 'acUnit', { 
        ...formData.spaceInfo.acUnit, 
        depth: 200 // 천정에서 내려오는 깊이 (높이방향)
      });
    }
  };

  // 바닥 마감재 변경 처리
  const handleFloorFinishChange = (value) => {
    handleNestedChange('spaceInfo', 'hasFloorFinish', value);
    
    // 마감재 없음 선택 시, 두께 0으로 설정
    if (value === 'no') {
      handleNestedChange('spaceInfo', 'floorThickness', 0);
      setFloorThickness(0);
    }
  };

  // Create spaceInfo for RoomViewer3D with proper wallPosition
  const spaceInfo = {
    width: Number(viewerData.spaceInfo.width || 4800),
    height: Number(viewerData.spaceInfo.height || 2400),
    depth: 3000, // 항상 깊이는 3000mm로 고정
    hasAirConditioner: viewerData.spaceInfo.hasAirConditioner === 'yes',
    floorFinish: viewerData.spaceInfo.hasFloorFinish === 'yes' ? 'wood' : 'no',
    floorThickness: Number(viewerData.spaceInfo.floorThickness || 0),
    wallPosition: viewerData.spaceInfo.wallPosition || 'back',
    spaceType: viewerData.spaceInfo.spaceType || 'built-in',
    acUnit: viewerData.spaceInfo.acUnit || { position: 'left', width: 900, depth: 10 } // 벽 두께와 비슷하게 설정
  };

  // Create placementInfo for RoomViewer3D
  const placementInfo = {
    type: viewerData.spaceInfo.spaceType || 'built-in',
    width: Number(viewerData.spaceInfo.width || 4800),
    height: Number(viewerData.spaceInfo.height || 2400),
    depth: 3000, // 항상 깊이는 3000mm로 고정
    clearance: { left: 50, right: 50, top: 50 },
    fit: 'normal'
  };

  console.log('RoomViewer3D props:', { spaceInfo, placementInfo, isTyping });

  // 변경 내용 반영 버튼 클릭 핸들러
  const handleApplyChanges = () => {
    setIsTyping(false); // 입력 중 상태 해제
    
    // 현재 formData의 값을 viewerData에 반영
    setViewerData({
      spaceInfo: {
        ...formData.spaceInfo,
        depth: 3000 // 항상 깊이는 3000mm로 고정
      },
      placementInfo: {
        type: formData.spaceInfo.spaceType || 'built-in',
        width: Number(formData.spaceInfo.width || 4800),
        height: Number(formData.spaceInfo.height || 2400),
        depth: 3000, // 항상 깊이는 3000mm로 고정
        clearance: { left: 50, right: 50, top: 50 },
        fit: 'normal'
      }
    });
  };

  // 왼쪽 섹션 - 3D 뷰어 렌더링
  const renderLeftSection = () => {
    return (
      <div
        className={styles.leftSide}
        style={{
          flex: 5,
          height: '100%',
          minHeight: '600px',
          borderRadius: '0',
          overflow: 'hidden',
          position: 'relative',
          background: '#ffffff',
          // 테두리 완전 제거를 위한 추가 스타일
          boxShadow: 'none',
          outline: 'none',
          border: 'none'
        }}
      >
        <div style={{ 
          width: '100%', 
          height: '100%',
          overflow: 'hidden',
          borderRadius: '0',
          // 테두리 제거를 위한 추가 스타일
          boxShadow: 'none',
          outline: 'none',
          border: 'none',
          background: '#ffffff'
        }}>
          <RoomViewer3D
            spaceInfo={{
              width: formData.spaceInfo.width,
              height: formData.spaceInfo.height,
              depth: 3000, // 깊이는 항상 3000mm로 고정
              spaceType: formData.spaceInfo.spaceType,
              wallPosition: formData.spaceInfo.wallPosition,
              hasAirConditioner: formData.spaceInfo.hasAirConditioner === 'yes',
              acUnit: formData.spaceInfo.acUnit || {
                position: 'left',
                width: 900,
                depth: 200
              },
              hasFloorFinish: formData.spaceInfo.hasFloorFinish === 'yes',
              floorFinishType: formData.spaceInfo.floorFinishType || 'wood'
            }}
            viewMode="normal"
          />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container} style={{ width: '100%', height: 'calc(100vh - 240px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flex: 1, gap: '20px', marginBottom: '20px', overflow: 'hidden' }}>
        {/* 왼쪽 섹션 - 3D 뷰어 */}
        {renderLeftSection()}
        
        {/* 오른쪽 섹션 - 입력 폼 */}
        <div className={styles.rightSide} style={{
          flex: 5,
          height: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div className={styles.optionCategory}>
            <h3>• 설치 타입</h3>
            <div className={styles.optionButtonGroup}>
              <button
                className={`${styles.optionButton} ${formData.spaceInfo.spaceType === 'built-in' ? styles.selected : ''}`}
                onClick={() => handleNestedChange('spaceInfo', 'spaceType', 'built-in')}
              >
                Built in
              </button>
              <button
                className={`${styles.optionButton} ${formData.spaceInfo.spaceType === 'semi-standing' ? styles.selected : ''}`}
                onClick={() => handleNestedChange('spaceInfo', 'spaceType', 'semi-standing')}
              >
                Semi standing
              </button>
              <button
                className={`${styles.optionButton} ${formData.spaceInfo.spaceType === 'free-standing' ? styles.selected : ''}`}
                onClick={() => handleNestedChange('spaceInfo', 'spaceType', 'free-standing')}
              >
                Free standing
              </button>
            </div>
          </div>

          <div className={styles.optionCategory}>
            <h3>• 벽면 위치</h3>
            <div className={styles.optionButtonGroup}>
              <button
                className={`${styles.optionButton} ${formData.spaceInfo.wallPosition === 'left' ? styles.selected : ''}`}
                onClick={() => handleNestedChange('spaceInfo', 'wallPosition', 'left')}
              >
                좌측
              </button>
              <button
                className={`${styles.optionButton} ${formData.spaceInfo.wallPosition === 'right' ? styles.selected : ''}`}
                onClick={() => handleNestedChange('spaceInfo', 'wallPosition', 'right')}
              >
                우측
              </button>
              <button
                className={`${styles.optionButton} ${formData.spaceInfo.wallPosition === 'back' ? styles.selected : ''}`}
                onClick={() => handleNestedChange('spaceInfo', 'wallPosition', 'back')}
              >
                뒷면
              </button>
            </div>
          </div>

          <div className={styles.optionCategory}>
            <h3>• 공간 치수</h3>
            <div className={styles.dimensionInputs}>
              <div className={styles.inputGroup}>
                <label>너비 (W, mm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={localDimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  className={widthError ? styles.inputError : ''}
                  placeholder="1200-4000mm"
                />
                {widthError && <span className={styles.errorText}>{widthError}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label>높이 (H, mm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={localDimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  className={heightError ? styles.inputError : ''}
                  placeholder="2000-2700mm"
                />
                {heightError && <span className={styles.errorText}>{heightError}</span>}
              </div>
              {/* 깊이는 항상 3000mm로 고정이므로 표시하지 않음 */}
            </div>
          </div>

          <div className={styles.optionCategory}>
            <h3>• 에어컨 단내림</h3>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="hasAirConditioner"
                  checked={formData.spaceInfo.hasAirConditioner === 'no'}
                  onChange={() => handleAirConditionerChange('no')}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>없음</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="hasAirConditioner"
                  checked={formData.spaceInfo.hasAirConditioner === 'yes'}
                  onChange={() => handleAirConditionerChange('yes')}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>있음</span>
              </label>
            </div>
            
            {/* 에어컨 있음 선택 시 추가 옵션 표시 */}
            {formData.spaceInfo.hasAirConditioner === 'yes' && (
              <div className={styles.acUnitOptions}>
                <div className={styles.inputGroup}>
                  <label>위치</label>
                  <div className={styles.optionButtonGroup}>
                    <button
                      className={`${styles.optionButton} ${formData.spaceInfo.acUnit?.position === 'left' ? styles.selected : ''}`}
                      onClick={() => handleAcUnitChange('position', 'left')}
                    >
                      좌측
                    </button>
                    <button
                      className={`${styles.optionButton} ${formData.spaceInfo.acUnit?.position === 'right' ? styles.selected : ''}`}
                      onClick={() => handleAcUnitChange('position', 'right')}
                    >
                      우측
                    </button>
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>너비 (mm)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.spaceInfo.acUnit?.width || 900}
                    onChange={(e) => handleAcUnitChange('width', e.target.value)}
                    placeholder="900mm"
                  />
                </div>
                {/* 에어컨 단내림의 깊이는 항상 고정으로 표시하지 않음 */}
              </div>
            )}
          </div>

          <div className={styles.optionCategory}>
            <h3>• 바닥 마감재</h3>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="hasFloorFinish"
                  checked={formData.spaceInfo.hasFloorFinish === 'no'}
                  onChange={() => handleFloorFinishChange('no')}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>없음</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="hasFloorFinish"
                  checked={formData.spaceInfo.hasFloorFinish === 'yes'}
                  onChange={() => handleFloorFinishChange('yes')}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>있음</span>
              </label>
            </div>
            
            {/* 마감재 있음 선택 시 두께 입력 필드 표시 */}
            {formData.spaceInfo.hasFloorFinish === 'yes' && (
              <div className={styles.floorThicknessInput}>
                <div className={styles.inputGroup}>
                  <label>마감재 두께 (mm)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={floorThickness}
                    onChange={(e) => handleFloorThicknessChange(e.target.value)}
                    placeholder="마감재 두께 (mm)"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* 변경사항 반영 버튼 */}
          <div className={styles.optionCategory}>
            <button 
              className={styles.applyButton}
              onClick={handleApplyChanges}
            >
              변경사항 반영
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Content; 
