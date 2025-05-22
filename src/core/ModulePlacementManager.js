import * as THREE from 'three';
import ModuleModelManager from './ModuleModelManager';

class ModulePlacementManager {
  constructor(scene, camera, renderer, floorMesh) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.floorMesh = floorMesh;
    this.raycaster = new THREE.Raycaster();
    this.modelManager = new ModuleModelManager();
    
    // 현재 선택된 모듈
    this.selectedModuleId = null;
    this.ghostModel = null;
    
    // 배치된 모듈 관리
    this.placedModules = [];
    
    // 마우스 위치
    this.mouse = new THREE.Vector2();
    this.intersectionPoint = new THREE.Vector3();
    
    // 슬롯 그리드
    this.slots = [];
    this.activeSlot = null;
    
    // 이벤트 리스너 및 사용자 핸들러
    this.eventListeners = {};
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
  }
  
  // 이벤트 리스너 설정
  setupEventListeners() {
    const canvas = this.renderer.domElement;
    
    // 마우스 이동 이벤트
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // 클릭 이벤트 (모듈 배치)
    canvas.addEventListener('click', this.handleClick.bind(this));
    
    // DOM 이벤트 리스너 추가
    document.addEventListener('module-selected', this.handleModuleSelected.bind(this));
  }
  
  // 모듈 선택 이벤트 처리
  handleModuleSelected(event) {
    const { moduleId } = event.detail;
    this.selectModule(moduleId);
  }
  
  // 마우스 이동 이벤트 처리
  handleMouseMove(event) {
    // 마우스 좌표 계산 (정규화된 장치 좌표)
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // 고스트 위치 업데이트
    this.updateGhostPosition();
    
    // 슬롯 호버 이벤트 발생
    if (this.activeSlot) {
      this.dispatchEvent('slot-hovered', {
        slotId: this.activeSlot.id,
        slotIndex: this.activeSlot.index,
        isHovered: true
      });
    }
  }
  
  // 클릭 이벤트 처리
  handleClick() {
    // 드래그 중인 모듈이 있고 활성 슬롯이 있으면 배치
    if (this.ghostModel && this.activeSlot) {
      this.placeModuleInSlot();
    }
  }
  
  // 모듈 선택 처리
  async selectModule(moduleId) {
    this.selectedModuleId = moduleId;
    
    // 이전 고스트 모델 제거
    if (this.ghostModel) {
      this.scene.remove(this.ghostModel);
      this.ghostModel = null;
    }
    
    // 새 고스트 모델 생성
    if (moduleId) {
      try {
        const model = await this.modelManager.loadModel(moduleId);
        
        // 고스트 효과 적용
        model.traverse(node => {
          if (node.isMesh) {
            const ghostMaterial = node.material.clone();
            ghostMaterial.transparent = true;
            ghostMaterial.opacity = 0.6;
            ghostMaterial.color.set(0x00C092); // 연두색 계열
            node.material = ghostMaterial;
          }
        });
        
        // 씬에 고스트 모델 추가
        this.ghostModel = model;
        this.scene.add(this.ghostModel);
        
        // 초기 위치 설정
        this.updateGhostPosition();
        
        // 모듈 선택 이벤트 통지
        this.dispatchEvent('ghost-created', {
          moduleId,
          model: this.ghostModel
        });
      } catch (error) {
        console.error('고스트 모델 생성 오류:', error);
      }
    }
  }
  
  // 고스트 위치 업데이트
  updateGhostPosition() {
    if (!this.ghostModel) return;
    
    // 레이캐스팅으로 마우스 위치에 대응하는 3D 좌표 찾기
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // 바닥 및 기존 모듈과의 교차점 확인
    const intersects = this.raycaster.intersectObjects([this.floorMesh, ...this.placedModules], true);
    
    if (intersects.length > 0) {
      // 교차점의 3D 좌표
      this.intersectionPoint.copy(intersects[0].point);
      
      // 슬롯 체크 및 스냅
      this.checkSlotIntersection();
      
      // 배치 유효성 확인 및 고스트 색상 설정
      this.updateGhostAppearance();
      
      // 고스트 모델 위치 업데이트
      if (this.activeSlot) {
        // 슬롯에 스냅
        this.ghostModel.position.set(
          this.activeSlot.position.x,
          this.activeSlot.position.y,
          this.activeSlot.position.z
        );
      } else {
        // 마우스 포인터 위치로
        this.ghostModel.position.set(
          this.intersectionPoint.x,
          this.intersectionPoint.y,
          this.intersectionPoint.z
        );
      }
    }
  }
  
  // 고스트 모델 외관 업데이트 (유효성에 따라 색상 변경)
  updateGhostAppearance() {
    if (!this.ghostModel) return;
    
    const isValid = this.isValidPlacement();
    
    this.ghostModel.traverse(node => {
      if (node.isMesh && node.material.transparent) {
        if (isValid) {
          // 배치 가능 - 녹색
          node.material.color.set(0x00C092);
        } else {
          // 배치 불가 - 빨간색
          node.material.color.set(0xFF4D4D);
        }
      }
    });
  }
  
  // 슬롯 교차 체크
  checkSlotIntersection() {
    // 이전 활성 슬롯 상태 저장
    const prevActiveSlot = this.activeSlot;
    
    // 모든 슬롯 하이라이트 해제
    this.slots.forEach(slot => slot.highlight(false));
    
    // 활성 슬롯 초기화
    this.activeSlot = null;
    
    // 고스트 모델이 없으면 리턴
    if (!this.ghostModel) return;
    
    // 고스트 모델의 바운딩 박스
    const ghostBBox = new THREE.Box3().setFromObject(this.ghostModel);
    
    // 모든 슬롯과 교차 테스트
    for (const slot of this.slots) {
      if (ghostBBox.intersectsBox(slot.boundingBox)) {
        // 모듈 크기가 슬롯과 호환되는지 확인
        if (this.isModuleCompatibleWithSlot(this.selectedModuleId, slot)) {
          this.activeSlot = slot;
          
          // 슬롯 하이라이트 (시각적 피드백)
          slot.highlight(true);
          
          break; // 첫 번째 호환 슬롯에서 중지
        }
      }
    }
    
    // 활성 슬롯이 변경된 경우 이벤트 발생
    if (prevActiveSlot !== this.activeSlot) {
      if (prevActiveSlot) {
        // 이전 슬롯 호버 해제 이벤트
        this.dispatchEvent('slot-hovered', {
          slotId: prevActiveSlot.id,
          slotIndex: prevActiveSlot.index,
          isHovered: false
        });
      }
      
      if (this.activeSlot) {
        // 새 슬롯 호버 이벤트
        this.dispatchEvent('slot-hovered', {
          slotId: this.activeSlot.id,
          slotIndex: this.activeSlot.index,
          isHovered: true
        });
      }
    }
  }
  
  // 배치 유효성 검사
  isValidPlacement() {
    if (!this.ghostModel) return false;
    
    // 슬롯이 있으면 항상 유효
    if (this.activeSlot) return true;
    
    // 충돌 감지
    const ghostBBox = new THREE.Box3().setFromObject(this.ghostModel);
    
    // 다른 모듈과의 충돌 체크
    for (const placedModule of this.placedModules) {
      const placedBBox = new THREE.Box3().setFromObject(placedModule);
      if (ghostBBox.intersectsBox(placedBBox)) {
        return false;
      }
    }
    
    // 바닥 위 배치 여부 확인 (필요시)
    if (this.selectedModuleId) {
      const moduleData = this.modelManager.getModuleData(this.selectedModuleId);
      if (moduleData.placementRules.requiresFloor) {
        // y좌표가 적절한지 확인 (바닥 높이에 가까운지)
        const tolerance = 0.01; // 바닥 허용 오차 (m)
        return Math.abs(this.ghostModel.position.y) < tolerance;
      }
    }
    
    return true;
  }
  
  // 모듈을 슬롯에 배치
  async placeModuleInSlot() {
    if (!this.ghostModel || !this.activeSlot || !this.selectedModuleId) return;
    
    try {
      // 실제 모델 로드
      const model = await this.modelManager.loadModel(this.selectedModuleId);
      
      // 모듈 데이터 가져오기 (치수 정보 포함)
      const moduleData = this.modelManager.getModuleData(this.selectedModuleId);
      
      // 스케일 계산: 너비만 슬롯 크기에 맞게 조정 (패널 두께는 유지)
      const originalWidthM = moduleData.dimensions.width * 0.001; // mm -> m
      const targetWidthM = this.activeSlot.width;
      const widthScale = targetWidthM / originalWidthM;
      
      // 너비만 스케일링 (높이와 깊이는 유지)
      if (widthScale !== 1) {
        // 패널 두께를 유지하면서 너비만 변경하는 로직
        // NonUniformScaleOperation 적용 (ThreeJS에는 없으므로 직접 매트릭스 조작)
        model.scale.set(widthScale, 1, 1);
        
        console.log(`모듈 너비 조정: ${originalWidthM}m -> ${targetWidthM}m (scale: ${widthScale})`);
      }
      
      // 바닥 높이 계산: 슬롯의 y 위치를 기준으로 모델 높이의 절반만큼 위로 이동
      const modelHeightM = moduleData.dimensions.height * 0.001; // mm -> m
      const baseOffset = modelHeightM / 2;
      
      // 위치 설정 - y 좌표 조정하여 바닥에 정확히 배치
      const slotPosition = this.activeSlot.position.clone();
      slotPosition.y = this.activeSlot.position.y + baseOffset;
      
      model.position.copy(slotPosition);
      
      // 슬롯에 모듈 정보 저장
      this.activeSlot.occupyWithModule(model, this.selectedModuleId);
      
      // 씬에 추가
      this.scene.add(model);
      this.placedModules.push(model);
      
      // 배치 이벤트 발생
      this.dispatchEvent('module-placed', {
        moduleId: this.selectedModuleId,
        position: model.position.clone(),
        slotId: this.activeSlot.id,
        slotIndex: this.activeSlot.index
      });
      
      // 고스트 모드 종료
      this.scene.remove(this.ghostModel);
      this.ghostModel = null;
      this.selectedModuleId = null;
      
      // 모든 슬롯 하이라이트 해제
      this.slots.forEach(slot => slot.highlight(false));
      
      // 활성 슬롯 초기화
      this.activeSlot = null;
      
    } catch (error) {
      console.error('모듈 배치 오류:', error);
    }
  }
  
  // 모듈과 슬롯 호환성 확인
  isModuleCompatibleWithSlot(moduleId, slot) {
    if (!moduleId) return false;
    
    const moduleData = this.modelManager.getModuleData(moduleId);
    if (!moduleData) return false;
    
    // mm -> m 변환
    const scale = 0.001;
    
    // 치수 기반 호환성 체크
    return (
      moduleData.dimensions.width * scale <= slot.width &&
      moduleData.dimensions.height * scale <= slot.height &&
      moduleData.dimensions.depth * scale <= slot.depth
    );
  }
  
  // 슬롯 설정
  setSlots(slots) {
    this.slots = slots;
  }
  
  // 특정 슬롯에서 모듈 제거
  removeModuleFromSlot(slotIndex) {
    const slot = this.slots.find(s => s.index === slotIndex);
    if (!slot || !slot.occupiedBy) return;
    
    // 씬에서 모듈 제거
    this.scene.remove(slot.occupiedBy);
    
    // 배치된 모듈 목록에서 제거
    this.placedModules = this.placedModules.filter(m => m !== slot.occupiedBy);
    
    // 슬롯에서 모듈 정보 제거
    slot.clear();
    
    // 제거 이벤트 발생
    this.dispatchEvent('module-removed', {
      slotId: slot.id,
      slotIndex
    });
  }
  
  // 모든 모듈 제거
  clearAllModules() {
    // 모든 배치된 모듈 제거
    this.placedModules.forEach(module => {
      this.scene.remove(module);
    });
    
    // 모든 슬롯 초기화
    this.slots.forEach(slot => slot.clear());
    
    // 배열 초기화
    this.placedModules = [];
    
    // 이벤트 발생
    this.dispatchEvent('all-modules-cleared', {});
  }
  
  // 이벤트 발생
  dispatchEvent(type, detail) {
    // DOM 이벤트 발생 (다른 컴포넌트와 통신)
    const event = new CustomEvent(type, { detail });
    document.dispatchEvent(event);
    
    // 내부 이벤트 핸들러 호출
    if (this.eventListeners[type]) {
      this.eventListeners[type].forEach(listener => listener(detail));
    }
  }
  
  // 이벤트 리스너 등록
  addEventListener(type, callback) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(callback);
  }
  
  // 이벤트 리스너 제거
  removeEventListener(type, callback) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type].filter(
        listener => listener !== callback
      );
    }
  }
  
  // 정리 함수 (컴포넌트 언마운트 시 호출)
  dispose() {
    // 이벤트 리스너 제거
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousemove', this.handleMouseMove);
    canvas.removeEventListener('click', this.handleClick);
    
    document.removeEventListener('module-selected', this.handleModuleSelected);
    
    // 고스트 모델 제거
    if (this.ghostModel) {
      this.scene.remove(this.ghostModel);
      this.ghostModel = null;
    }
    
    // 모델 매니저 캐시 정리
    this.modelManager.clearCache();
    
    // 이벤트 리스너 초기화
    this.eventListeners = {};
  }
}

// 슬롯 클래스 - 모듈이 배치될 수 있는 위치
export class ModuleSlot {
  constructor(id, index, position, width, height, depth) {
    this.id = id;
    this.index = index;
    this.position = position.clone();
    this.width = width;
    this.height = height;
    this.depth = depth;
    
    // 바운딩 박스 (교차 테스트용)
    this.boundingBox = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(width, height, depth)
    );
    
    // 하이라이트 메시
    this.highlightMesh = this.createHighlightMesh();
    
    // 점유 정보
    this.occupiedBy = null;
    this.occupiedWithModuleId = null;
  }
  
  // 하이라이트 메시 생성
  createHighlightMesh() {
    const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
    const material = new THREE.MeshBasicMaterial({
      color: 0x2196f3,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);
    mesh.visible = false;
    
    return mesh;
  }
  
  // 하이라이트 토글
  highlight(show) {
    if (this.highlightMesh) {
      this.highlightMesh.visible = show;
    }
  }
  
  // 슬롯에 모듈 배치
  occupyWithModule(model, moduleId) {
    this.occupiedBy = model;
    this.occupiedWithModuleId = moduleId;
  }
  
  // 슬롯 초기화
  clear() {
    this.occupiedBy = null;
    this.occupiedWithModuleId = null;
  }
  
  // 씬에 하이라이트 메시 추가
  addToScene(scene) {
    scene.add(this.highlightMesh);
  }
  
  // 씬에서 하이라이트 메시 제거
  removeFromScene(scene) {
    scene.remove(this.highlightMesh);
  }
}

export default ModulePlacementManager; 