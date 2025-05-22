import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// 모듈 모델 매니저: 3D 모델 로드 및 캐싱을 담당
class ModuleModelManager {
  constructor() {
    // 모델 캐시 (로드된 모델 저장)
    this.modelCache = {};
    // GLTF 로더
    this.gltfLoader = new GLTFLoader();
    // 텍스처 로더
    this.textureLoader = new THREE.TextureLoader();
    
    // 모듈 데이터 저장 (치수, 배치 규칙 등)
    this.moduleData = {
      // 서랍장 모듈
      'drawer-module': {
        dimensions: { width: 600, height: 400, depth: 580 },
        placementRules: { requiresFloor: true, canStack: false },
        modelPath: '/models/drawer.glb'
      },
      // 선반 모듈
      'shelf-module': {
        dimensions: { width: 600, height: 25, depth: 580 },
        placementRules: { requiresFloor: false, canStack: false },
        modelPath: '/models/shelf.glb'
      },
      // 행거 모듈
      'hanging-module': {
        dimensions: { width: 600, height: 50, depth: 580 },
        placementRules: { requiresFloor: false, canStack: false },
        modelPath: '/models/hanging.glb'
      },
      // 도어 모듈
      'door-module': {
        dimensions: { width: 600, height: 2000, depth: 30 },
        placementRules: { requiresFloor: false, canStack: false },
        modelPath: '/models/door.glb'
      },
      // 캐비넷 모듈
      'cabinet-module': {
        dimensions: { width: 600, height: 600, depth: 580 },
        placementRules: { requiresFloor: true, canStack: true },
        modelPath: '/models/cabinet.glb'
      }
    };
    
    // 기본 재질 속성
    this.defaultMaterialProps = {
      roughness: 0.7,
      metalness: 0.1,
      color: 0xffffff
    };
  }
  
  // 모듈 데이터 가져오기
  getModuleData(moduleId) {
    // 기본 모듈 타입에서 찾기
    if (this.moduleData[moduleId]) {
      return this.moduleData[moduleId];
    }
    
    // 모듈 ID에서 타입 추출하기 (예: 'drawer-module-1' -> 'drawer-module')
    const moduleType = moduleId.split('-').slice(0, 2).join('-');
    
    // 타입 기반으로 찾기
    if (this.moduleData[moduleType]) {
      return this.moduleData[moduleType];
    }
    
    // 찾지 못한 경우 기본값 반환
    console.warn(`모듈 데이터를 찾을 수 없음: ${moduleId}`);
    return {
      dimensions: { width: 600, height: 400, depth: 580 },
      placementRules: { requiresFloor: true, canStack: false },
      modelPath: '/models/default.glb'
    };
  }
  
  // 모듈 모델 로드
  async loadModel(moduleId) {
    // 이미 캐시에 있는 경우
    if (this.modelCache[moduleId]) {
      // 캐시된 모델의 복제본 반환
      return this.modelCache[moduleId].clone();
    }
    
    try {
      // 모듈 데이터 가져오기
      const moduleData = this.getModuleData(moduleId);
      const { modelPath } = moduleData;
      
      // 모델 경로가 없는 경우 기본 박스로 생성
      if (!modelPath) {
        return this.createDefaultBox(moduleData.dimensions);
      }
      
      // GLTF 모델 로드
      return new Promise((resolve, reject) => {
        this.gltfLoader.load(
          modelPath,
          (gltf) => {
            const model = gltf.scene;
            
            // 모델 최적화 및 설정
            this.setupModel(model, moduleData);
            
            // 캐시에 저장
            this.modelCache[moduleId] = model.clone();
            
            resolve(model);
          },
          // 로드 진행 콜백
          (xhr) => {
            console.log(`${moduleId} 모델 로딩: ${(xhr.loaded / xhr.total) * 100}% 완료`);
          },
          // 오류 콜백
          (error) => {
            console.error(`모델 로드 오류 (${moduleId}):`, error);
            // 로드 실패 시 기본 모델로 대체
            const fallbackModel = this.createDefaultBox(moduleData.dimensions);
            resolve(fallbackModel);
          }
        );
      });
    } catch (error) {
      console.error('모델 로드 중 예외 발생:', error);
      // 오류 발생 시 기본 박스 반환
      return this.createDefaultBox(
        this.getModuleData(moduleId).dimensions
      );
    }
  }
  
  // 모델 설정 및 최적화
  setupModel(model, moduleData) {
    model.traverse(node => {
      if (node.isMesh) {
        // 그림자 설정
        node.castShadow = true;
        node.receiveShadow = true;
        
        // 재질 설정
        if (node.material) {
          // 기존 재질을 복제하여 설정 유지
          if (Array.isArray(node.material)) {
            node.material = node.material.map(mat => {
              const newMat = mat.clone();
              this.enhanceMaterial(newMat);
              return newMat;
            });
          } else {
            const newMaterial = node.material.clone();
            this.enhanceMaterial(newMaterial);
            node.material = newMaterial;
          }
        }
      }
    });
    
    // 크기 조정 (mm -> m)
    const scale = 0.001; // mm -> m 변환
    model.scale.set(scale, scale, scale);
  }
  
  // 재질 개선
  enhanceMaterial(material) {
    // PBR 재질 속성 설정
    if (material.isMeshStandardMaterial) {
      material.roughness = this.defaultMaterialProps.roughness;
      material.metalness = this.defaultMaterialProps.metalness;
      material.needsUpdate = true;
    }
  }
  
  // 기본 박스 모델 생성 (모델이 없을 때 대체용)
  createDefaultBox(dimensions) {
    const { width, height, depth } = dimensions;
    const scale = 0.001; // mm -> m
    
    const geometry = new THREE.BoxGeometry(
      width * scale, 
      height * scale, 
      depth * scale
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: this.defaultMaterialProps.color,
      roughness: this.defaultMaterialProps.roughness,
      metalness: this.defaultMaterialProps.metalness,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // 그룹에 추가 (이후 처리 편의성)
    const group = new THREE.Group();
    group.add(mesh);
    
    return group;
  }
  
  // 모듈의 배치 규칙 확인
  getPlacementRules(moduleId) {
    return this.getModuleData(moduleId).placementRules;
  }
  
  // 모듈의 치수 가져오기
  getDimensions(moduleId) {
    return this.getModuleData(moduleId).dimensions;
  }
  
  // 캐시 정리
  clearCache() {
    // 메모리 최적화를 위해 모델 자원 해제
    Object.values(this.modelCache).forEach(model => {
      model.traverse(node => {
        if (node.isMesh) {
          if (node.geometry) {
            node.geometry.dispose();
          }
          
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(material => material.dispose());
            } else {
              node.material.dispose();
            }
          }
        }
      });
    });
    
    this.modelCache = {};
  }
}

export default ModuleModelManager; 