import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import ModulePlacementManager, { ModuleSlot } from '../../core/ModulePlacementManager';

/**
 * 모듈 배치 컨트롤러 컴포넌트
 * 
 * 이 컴포넌트는 DragAndDropHandler와 ModulePlacementManager 사이의 연결을 담당합니다.
 * 드래그 앤 드롭 이벤트를 3D 씬의 모듈 배치 시스템에 전달합니다.
 */
const ModulePlacementController = ({ scene, camera, renderer, floorMesh, doorCount = 8, spaceWidth = 4800, spaceHeight = 2400, spaceDepth = 580, showModuleSlots = true }) => {
  // ModulePlacementManager 참조
  const placementManagerRef = useRef(null);
  // 슬롯 배열 참조
  const slotsRef = useRef([]);
  
  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    if (!scene || !camera || !renderer || !floorMesh) {
      console.warn('ModulePlacementController: 필수 props가 누락되었습니다.');
      return;
    }
    
    // ModulePlacementManager 인스턴스 생성
    const placementManager = new ModulePlacementManager(scene, camera, renderer, floorMesh);
    placementManagerRef.current = placementManager;
    
    // 슬롯 생성
    generateSlots(doorCount, spaceWidth, spaceHeight, spaceDepth);
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      cleanupEventListeners();
      
      // 슬롯 메시 제거
      slotsRef.current.forEach(slot => {
        slot.removeFromScene(scene);
      });
      
      // PlacementManager 정리
      if (placementManagerRef.current) {
        placementManagerRef.current.dispose();
      }
    };
  }, [scene, camera, renderer, floorMesh, doorCount, spaceWidth, spaceHeight, spaceDepth]);
  
  // 슬롯 정보 업데이트 (도어 개수나 크기 변경 시)
  useEffect(() => {
    if (!placementManagerRef.current || !scene) return;
    
    // 기존 슬롯 메시 제거
    slotsRef.current.forEach(slot => {
      slot.removeFromScene(scene);
    });
    
    // 새 슬롯 생성
    generateSlots(doorCount, spaceWidth, spaceHeight, spaceDepth);
    
  }, [doorCount, spaceWidth, spaceHeight, spaceDepth, scene]);
  
  // 슬롯 생성 함수
  const generateSlots = (count, width, height, depth) => {
    if (!scene || !placementManagerRef.current) return;
    
    // 슬롯 너비 계산 (mm 단위)
    const slotWidth = width / count;
    
    // 모든 슬롯 배열
    const slots = [];
    
    // 슬롯 사이즈 (m 단위)
    const slotSizeM = {
      width: slotWidth * 0.001, // mm -> m
      height: height * 0.001,
      depth: depth * 0.001
    };
    
    // 시작 X 위치 (왼쪽 끝, m 단위)
    const startX = -width * 0.001 / 2 + slotSizeM.width / 2;
    
    // 도어 개수만큼 슬롯 생성
    for (let i = 0; i < count; i++) {
      // 슬롯 중앙 위치 계산 (m 단위)
      const x = startX + i * slotSizeM.width;
      const y = slotSizeM.height / 2;
      const z = 0;
      
      // 슬롯 ID 및 위치
      const slotId = `slot-${i}`;
      const position = new THREE.Vector3(x, y, z);
      
      // 슬롯 객체 생성
      const slot = new ModuleSlot(
        slotId, 
        i, 
        position, 
        slotSizeM.width, 
        slotSizeM.height, 
        slotSizeM.depth
      );
      
      // 슬롯 하이라이트 메시를 씬에 추가
      slot.addToScene(scene);
      
      // 슬롯 배열에 추가
      slots.push(slot);
    }
    
    // 슬롯 배열 저장
    slotsRef.current = slots;
    
    // ModulePlacementManager에 슬롯 설정
    placementManagerRef.current.setSlots(slots);
  };
  
  // 이벤트 리스너 설정
  const setupEventListeners = () => {
    // DragAndDropHandler의 slot-clicked 이벤트 리스닝
    document.addEventListener('slot-clicked', handleSlotClicked);
    // DragAndDropHandler의 module-selected 이벤트 리스닝
    document.addEventListener('thumbnail-selected', handleThumbnailSelected);
    // DragAndDropHandler의 module-placed 이벤트 리스닝
    document.addEventListener('module-placed', handleModulePlaced);
    // 슬롯 상태 업데이트 이벤트 리스닝
    document.addEventListener('update-slot-status', handleSlotStatusUpdate);
  };
  
  // 이벤트 리스너 정리
  const cleanupEventListeners = () => {
    document.removeEventListener('slot-clicked', handleSlotClicked);
    document.removeEventListener('thumbnail-selected', handleThumbnailSelected);
    document.removeEventListener('module-placed', handleModulePlaced);
    document.removeEventListener('update-slot-status', handleSlotStatusUpdate);
  };
  
  // 슬롯 클릭 이벤트 처리
  const handleSlotClicked = (e) => {
    const { slotIndex } = e.detail;
    console.log(`ModulePlacementController: 슬롯 ${slotIndex} 클릭됨`);
    
    // 배치 매니저에 배치 명령 전달
    if (placementManagerRef.current && placementManagerRef.current.activeSlot) {
      placementManagerRef.current.placeModuleInSlot();
    }
  };
  
  // 썸네일 선택 이벤트 처리
  const handleThumbnailSelected = (e) => {
    const { moduleId } = e.detail;
    
    // ModulePlacementManager에 선택 이벤트 전달
    if (placementManagerRef.current) {
      placementManagerRef.current.selectModule(moduleId);
    }
  };
  
  // 모듈 배치 이벤트 처리
  const handleModulePlaced = (e) => {
    const { moduleId, slotIndex } = e.detail;
    console.log(`ModulePlacementController: 모듈 ${moduleId}가 슬롯 ${slotIndex}에 배치됨`);
    
    // 필요한 추가 로직이 있다면 여기에 추가
  };
  
  // 슬롯 상태 업데이트 이벤트 처리
  const handleSlotStatusUpdate = (e) => {
    const { slotIndex, status } = e.detail;
    
    if (status === 'empty') {
      // 슬롯에서 모듈 제거
      if (placementManagerRef.current) {
        placementManagerRef.current.removeModuleFromSlot(slotIndex);
      }
    }
  };
  
  // Early return if slots should not be shown
  if (!showModuleSlots) {
    return null;  // Do not render anything if slots are disabled
  }
  
  // 렌더링 없음 (로직만 포함한 컴포넌트)
  return null;
};

ModulePlacementController.propTypes = {
  scene: PropTypes.object,
  camera: PropTypes.object,
  renderer: PropTypes.object,
  floorMesh: PropTypes.object,
  doorCount: PropTypes.number,
  spaceWidth: PropTypes.number,
  spaceHeight: PropTypes.number,
  spaceDepth: PropTypes.number,
  showModuleSlots: PropTypes.bool
};

export default ModulePlacementController; 