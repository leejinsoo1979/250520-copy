import React, { useState, useEffect } from 'react';
import styles from '../../pages/dashboard/DashboardPage.module.css';
import { FiCheck, FiX, FiChevronLeft, FiChevronRight, FiFileText, FiHome } from 'react-icons/fi';
import Step1Content from './Step1Content';
import Step2Content from './Step2Content';
import Step3Content from './Step3Content';
import RoomViewer3D from '../common/RoomViewer3D';

const DesignStepModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  initialData = {}
}) => {
  console.log("DesignStepModal render:", { isOpen, initialData });
  const [currentStep, setCurrentStep] = useState(1);
  const [viewerMode, setViewerMode] = useState(initialData.viewerMode || '2D');
  const [formData, setFormData] = useState({
    designTitle: initialData.designTitle || '',
    category: initialData.category || '옷장',
    installationLocation: initialData.installationLocation || '',
    customLocation: initialData.customLocation || '',
    isCustomLocation: false,
    spaceInfo: {
      width: 4800,
      depth: 1200,
      height: 2400,
      spaceType: 'built-in',
      wallPosition: 'left',
      hasAirConditioner: 'no',
      acUnit: { position: 'left', width: 900, depth: 200 },
      hasFloorFinish: 'no',
      floorThickness: 20,
      ...(initialData.spaceInfo || {})
    },
    fitOption: initialData.fitOption || 'normal',
    sizeSettings: {
      width: 4800,
      height: 2400,
      depth: 1200,
      left: 50,
      right: 50,
      top: 50,
      bottom: 50,
      ...(initialData.sizeSettings || {})
    },
    baseSettings: {
      hasBase: true,
      baseHeight: 10,
      ...(initialData.baseSettings || {})
    }
  });

  // 초기값 강제 설정 (initialData가 다른 값을 가지고 있더라도 기본값 적용)
  useEffect(() => {
    if (formData.spaceInfo.width !== 4800 || 
        formData.spaceInfo.height !== 2400 || 
        formData.spaceInfo.depth !== 1200 ||
        formData.spaceInfo.hasAirConditioner !== 'no' ||
        formData.spaceInfo.hasFloorFinish !== 'no') {
      
      console.log('DesignStepModal: 공간사이즈 및 기본 설정 강제 적용');
      
      setFormData(prev => ({
        ...prev,
        spaceInfo: {
          ...prev.spaceInfo,
          width: 4800,
          height: 2400,
          depth: 1200,
          hasAirConditioner: 'no',
          hasFloorFinish: 'no'
        },
        sizeSettings: {
          ...prev.sizeSettings,
          width: 4800,
          height: 2400,
          depth: 1200
        }
      }));
    }
  }, []);

  // 에러 상태 관리
  const [errors, setErrors] = useState({});

  // 변경 핸들러
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 상태 갱신
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // 중첩된 필드 변경 핸들러
  const handleNestedChange = (parentField, field, value) => {
    console.log(`handleNestedChange: ${parentField}.${field} = `, value);
    
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [field]: value
      }
    }));
    
    // baseSettings.focusedFrame 값이 변경되면 현재 뷰어에 반영할 수 있도록 특별 처리
    if (parentField === 'baseSettings' && field === 'focusedFrame') {
      console.log("Setting focused frame in form data:", value);
    }
  };

  // 각 단계별 유효성 검사
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.designTitle.trim()) {
        newErrors.designTitle = '디자인 이름을 입력해주세요';
      }
      if (formData.isCustomLocation) {
        if (!formData.customLocation.trim()) {
          newErrors.installationLocation = '설치 위치를 입력해주세요';
        }
      } else if (!formData.installationLocation) {
        newErrors.installationLocation = '설치 위치를 선택해주세요';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 현재 단계의 입력이 완료되었는지 확인
  const isStepComplete = () => {
    if (currentStep === 1) {
      const hasTitle = formData.designTitle.trim() !== '';
      const hasLocation = formData.isCustomLocation 
        ? formData.customLocation.trim() !== ''
        : formData.installationLocation !== '';
      
      return hasTitle && hasLocation;
    }
    return true;
  };

  // 설치 위치 직접 입력 토글
  const toggleCustomLocation = () => {
    setFormData(prev => ({
      ...prev,
      isCustomLocation: !prev.isCustomLocation,
      installationLocation: '',
      customLocation: ''
    }));
  };

  // 다음 단계로 이동
  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      // Step 2에서 Step 3로 이동할 때 사이즈 값 동기화
      if (currentStep === 2) {
        // 공간 크기를 가구 크기 설정에 반영
        setFormData(prev => ({
          ...prev,
          sizeSettings: {
            ...prev.sizeSettings,
            width: prev.spaceInfo.width,
            height: prev.spaceInfo.height,
            depth: 3000 // 항상 깊이는 3000mm로 고정
          },
          // 에어컨 단내림 정보 명시적으로 보존
          spaceInfo: {
            ...prev.spaceInfo,
            acUnit: {
              ...prev.spaceInfo.acUnit,
              present: prev.spaceInfo.hasAirConditioner === 'yes'
            }
          }
        }));
      }
      
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  // 이전 단계로 이동
  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 저장 및 제출
  const handleSave = () => {
    if (validateStep(currentStep)) {
      onSave(formData);
      onClose();
    }
  };

  // 모달 외부 클릭 시 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // setViewerModeInFormData 함수 추가
  // 뷰어 모드를 formData에 반영하는 함수
  const setViewerModeInFormData = (mode) => {
    setFormData(prev => ({
      ...prev,
      viewerMode: mode
    }));
  };

  if (!isOpen) return null;

  // 현재 단계에 맞는 단계명 반환
  const getStepName = () => {
    switch(currentStep) {
      case 1:
        return "기본 정보";
      case 2:
        return "공간 정보";
      case 3:
        return "맞춤 설정";
      default:
        return "";
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent} style={{ 
        width: '90%', 
        maxWidth: '1400px', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '85vh',
        maxHeight: '900px',
        overflow: 'hidden' 
      }} onClick={e => e.stopPropagation()}>
        <div className={styles.stepContainer} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* 상단 헤더 */}
          <div className={styles.stepHeader} style={{ height: '70px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
            <div className={styles.stepTitle}>
              <span className={styles.stepNumber}>STEP.{currentStep}</span>
              <span className={styles.stepName}>{getStepName()}</span>
            </div>
            <button className={styles.closeButton} onClick={onClose}>
              <FiX size={20} />
            </button>
          </div>
          
          {/* 컨텐츠 영역 */}
          <div className={styles.stepContent} style={{ flex: 1, overflow: 'auto' }}>
            {currentStep === 1 && (
              <div className={styles.stepContentRow} style={{ 
                display: 'flex', 
                width: '100%', 
                height: '100%', 
                gap: '20px', 
                padding: '20px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  width: '100%', 
                  flex: 1,
                  gap: '20px',
                  overflow: 'auto'
                }}>
                  <div style={{ flex: 1, padding: '0' }}>
                    <Step1Content 
                      formData={formData} 
                      errors={errors}
                      handleChange={handleChange}
                      handleNestedChange={handleNestedChange}
                      onEnter={goToNextStep}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className={styles.stepContentRow} style={{ 
                display: 'flex', 
                width: '100%', 
                height: '100%', 
                gap: '0', 
                padding: '20px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  width: '100%', 
                  flex: 1,
                  gap: '0',
                  overflow: 'auto'
                }}>
                  <div className={styles.formSection} style={{ 
                    flex: 1, 
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: 'none',
                    borderRadius: '0',
                    boxShadow: 'none',
                    outline: 'none'
                  }}>
                    <Step2Content 
                      formData={formData} 
                      errors={errors}
                      handleChange={handleChange}
                      handleNestedChange={handleNestedChange}
                      viewerMode={viewerMode}
                      setViewerMode={setViewerMode}
                      setViewerModeInFormData={setViewerModeInFormData}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className={styles.stepContentRow} style={{ 
                display: 'flex', 
                width: '100%', 
                height: '100%', 
                gap: '20px', 
                padding: '20px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  width: '100%', 
                  flex: 1,
                  gap: '20px',
                  overflow: 'auto'
                }}>
                  {/* Step3Content 컴포넌트 - 왼쪽에 뷰어, 오른쪽에 폼 */}
                  <div className={styles.formSection} style={{ 
                    flex: 1, 
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    <Step3Content 
                      formData={formData} 
                      errors={errors}
                      handleChange={handleChange}
                      handleNestedChange={handleNestedChange}
                      viewerMode={viewerMode}
                      setViewerMode={setViewerMode}
                      setViewerModeInFormData={setViewerModeInFormData}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 하단 푸터 - 모달 하부에 위치하도록 수정 */}
          <div className={styles.stepFooter} style={{ 
            height: '80px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0 20px',
            borderTop: '1px solid #eee',
            backgroundColor: '#fff',
            width: '100%',
            position: 'relative'
          }}>
            {/* 왼쪽 영역 - 비움 */}
            <div style={{ 
              display: 'flex', 
              gap: '10px'
            }}>
              {/* 비어있는 영역 */}
            </div>
            
            {/* 스텝 인디케이터 - 중앙으로 이동 */}
            <div style={{ 
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}>
              <div style={{ 
                display: 'flex', 
                gap: '5px', 
                alignItems: 'center'
              }}>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  backgroundColor: currentStep >= 1 ? '#00C092' : '#e5e5e5'
                }}></div>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  backgroundColor: currentStep >= 2 ? '#00C092' : '#e5e5e5'
                }}></div>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  backgroundColor: currentStep >= 3 ? '#00C092' : '#e5e5e5'
                }}></div>
              </div>
              <span style={{ 
                fontSize: '14px', 
                color: '#666', 
                fontWeight: '500'
              }}>{currentStep} 단계 / 3</span>
            </div>
            
            {/* 다음/완료 버튼과 이전 버튼 - 오른쪽에 위치 */}
            <div style={{ 
              display: 'flex', 
              gap: '10px'
            }}>
              {/* 이전 버튼 - 1단계에서만 숨김 */}
              {currentStep > 1 && (
                <button 
                  onClick={goToPrevStep}
                  type="button"
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: 'white',
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    minWidth: '80px',
                    justifyContent: 'center'
                  }}
                >
                  <FiChevronLeft size={16} /> 이전
                </button>
              )}
              
              {isStepComplete() && (
                <button 
                  onClick={currentStep < 3 ? goToNextStep : handleSave}
                  type="button"
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '4px',
                    border: 'none',
                    background: '#00C092',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    minWidth: '80px',
                    justifyContent: 'center'
                  }}
                >
                  {currentStep < 3 ? (
                    <>다음 <FiChevronRight size={16} /></>
                  ) : (
                    <><FiCheck size={16} /> 완료</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignStepModal;