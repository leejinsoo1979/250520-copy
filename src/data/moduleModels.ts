import * as THREE from 'three';

// 모듈 모델 타입 정의
export interface ModuleModelData {
  id: string;
  geometry: {
    type: 'box' | 'custom';
    width: number;
    height: number;
    depth: number;
    segments?: {
      width: number;
      height: number;
      depth: number;
    };
    custom?: any; // 사용자 정의 지오메트리 데이터
  };
  materials: {
    type: 'basic' | 'standard' | 'phong' | 'lambert';
    color: string;
    shininess?: number;
    roughness?: number;
    metalness?: number;
    map?: string; // 텍스처 맵 경로
    normalMap?: string;
    bumpMap?: string;
  }[];
  parts?: {
    name: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    geometry: {
      type: 'box' | 'cylinder' | 'sphere' | 'plane';
      width?: number; 
      height?: number;
      depth?: number;
      radius?: number;
      segments?: number;
    };
    material: {
      type: 'basic' | 'standard' | 'phong';
      color: string;
      shininess?: number;
      roughness?: number;
      metalness?: number;
      map?: string;
    };
  }[];
}

// 싱글 도어 하이 하이트 모듈
const D1HH: ModuleModelData = {
  id: 'D1HH',
  geometry: {
    type: 'box',
    width: 600,
    height: 2086,
    depth: 600,
    segments: {
      width: 1,
      height: 1,
      depth: 1
    }
  },
  materials: [
    {
      type: 'standard',
      color: '#FFFFFF',
      roughness: 0.2,
      metalness: 0.1
    }
  ],
  parts: [
    // 캐비닛 본체
    {
      name: 'body',
      position: [0, 0, 0],
      geometry: {
        type: 'box',
        width: 600,
        height: 2086,
        depth: 600
      },
      material: {
        type: 'standard',
        color: '#F5F5F5',
        roughness: 0.3
      }
    },
    // 도어
    {
      name: 'door',
      position: [0, 0, 300],
      geometry: {
        type: 'box',
        width: 596,
        height: 2082,
        depth: 18
      },
      material: {
        type: 'standard',
        color: '#FFFFFF',
        roughness: 0.1
      }
    },
    // 손잡이
    {
      name: 'handle',
      position: [250, 0, 310],
      geometry: {
        type: 'cylinder',
        radius: 10,
        height: 150,
        segments: 8
      },
      material: {
        type: 'phong',
        color: '#AAAAAA',
        shininess: 100
      }
    },
    // 내부 선반 (상단)
    {
      name: 'shelf_top',
      position: [0, 500, 0],
      geometry: {
        type: 'box',
        width: 564,
        height: 18,
        depth: 564
      },
      material: {
        type: 'standard',
        color: '#F0F0F0',
        roughness: 0.3
      }
    },
    // 내부 선반 (중간)
    {
      name: 'shelf_middle',
      position: [0, 0, 0],
      geometry: {
        type: 'box',
        width: 564,
        height: 18,
        depth: 564
      },
      material: {
        type: 'standard',
        color: '#F0F0F0',
        roughness: 0.3
      }
    },
    // 내부 선반 (하단)
    {
      name: 'shelf_bottom',
      position: [0, -500, 0],
      geometry: {
        type: 'box',
        width: 564,
        height: 18,
        depth: 564
      },
      material: {
        type: 'standard',
        color: '#F0F0F0',
        roughness: 0.3
      }
    }
  ]
};

// 싱글 도어 로우 모듈
const D1L: ModuleModelData = {
  id: 'D1L',
  geometry: {
    type: 'box',
    width: 600,
    height: 900,
    depth: 600
  },
  materials: [
    {
      type: 'standard',
      color: '#FFFFFF',
      roughness: 0.2,
      metalness: 0.1
    }
  ],
  parts: [
    // 캐비닛 본체
    {
      name: 'body',
      position: [0, 0, 0],
      geometry: {
        type: 'box',
        width: 600,
        height: 900,
        depth: 600
      },
      material: {
        type: 'standard',
        color: '#F5F5F5',
        roughness: 0.3
      }
    },
    // 도어
    {
      name: 'door',
      position: [0, 0, 300],
      geometry: {
        type: 'box',
        width: 596,
        height: 896,
        depth: 18
      },
      material: {
        type: 'standard',
        color: '#FFFFFF',
        roughness: 0.1
      }
    },
    // 손잡이
    {
      name: 'handle',
      position: [250, 0, 310],
      geometry: {
        type: 'cylinder',
        radius: 10,
        height: 150,
        segments: 8
      },
      material: {
        type: 'phong',
        color: '#AAAAAA',
        shininess: 100
      }
    },
    // 내부 선반
    {
      name: 'shelf',
      position: [0, 0, 0],
      geometry: {
        type: 'box',
        width: 564,
        height: 18,
        depth: 564
      },
      material: {
        type: 'standard',
        color: '#F0F0F0',
        roughness: 0.3
      }
    }
  ]
};

// 더블 도어 하이 하이트 모듈
const D2HH: ModuleModelData = {
  id: 'D2HH',
  geometry: {
    type: 'box',
    width: 1200,
    height: 2086,
    depth: 600
  },
  materials: [
    {
      type: 'standard',
      color: '#FFFFFF',
      roughness: 0.2,
      metalness: 0.1
    }
  ],
  parts: [
    // 캐비닛 본체
    {
      name: 'body',
      position: [0, 0, 0],
      geometry: {
        type: 'box',
        width: 1200,
        height: 2086,
        depth: 600
      },
      material: {
        type: 'standard',
        color: '#F5F5F5',
        roughness: 0.3
      }
    },
    // 왼쪽 도어
    {
      name: 'left_door',
      position: [-300, 0, 300],
      geometry: {
        type: 'box',
        width: 596,
        height: 2082,
        depth: 18
      },
      material: {
        type: 'standard',
        color: '#FFFFFF',
        roughness: 0.1
      }
    },
    // 오른쪽 도어
    {
      name: 'right_door',
      position: [300, 0, 300],
      geometry: {
        type: 'box',
        width: 596,
        height: 2082,
        depth: 18
      },
      material: {
        type: 'standard',
        color: '#FFFFFF',
        roughness: 0.1
      }
    },
    // 왼쪽 손잡이
    {
      name: 'left_handle',
      position: [-150, 0, 310],
      geometry: {
        type: 'cylinder',
        radius: 10,
        height: 150,
        segments: 8
      },
      material: {
        type: 'phong',
        color: '#AAAAAA',
        shininess: 100
      }
    },
    // 오른쪽 손잡이
    {
      name: 'right_handle',
      position: [150, 0, 310],
      geometry: {
        type: 'cylinder',
        radius: 10,
        height: 150,
        segments: 8
      },
      material: {
        type: 'phong',
        color: '#AAAAAA',
        shininess: 100
      }
    },
    // 내부 선반들
    {
      name: 'shelf_top',
      position: [0, 500, 0],
      geometry: {
        type: 'box',
        width: 1164,
        height: 18,
        depth: 564
      },
      material: {
        type: 'standard',
        color: '#F0F0F0',
        roughness: 0.3
      }
    },
    {
      name: 'shelf_middle',
      position: [0, 0, 0],
      geometry: {
        type: 'box',
        width: 1164,
        height: 18,
        depth: 564
      },
      material: {
        type: 'standard',
        color: '#F0F0F0',
        roughness: 0.3
      }
    },
    {
      name: 'shelf_bottom',
      position: [0, -500, 0],
      geometry: {
        type: 'box',
        width: 1164,
        height: 18,
        depth: 564
      },
      material: {
        type: 'standard',
        color: '#F0F0F0',
        roughness: 0.3
      }
    }
  ]
};

// 모듈 모델 데이터 모음
export const MODULE_MODELS: Record<string, ModuleModelData> = {
  D1HH,
  D1L,
  D2HH
};

// JSON 모델 데이터로부터 Three.js 모델을 생성하는 함수
export const createModelFromJSON = (moduleId: string): THREE.Group | null => {
  const modelData = MODULE_MODELS[moduleId];
  
  if (!modelData) {
    console.error(`모델 데이터를 찾을 수 없음: ${moduleId}`);
    return null;
  }
  
  const group = new THREE.Group();
  group.name = moduleId;
  
  // 부품이 정의되어 있으면 각 부품 생성
  if (modelData.parts && modelData.parts.length > 0) {
    modelData.parts.forEach(part => {
      let geometry: THREE.BufferGeometry;
      
      // 지오메트리 생성
      switch (part.geometry.type) {
        case 'box':
          geometry = new THREE.BoxGeometry(
            part.geometry.width || 1,
            part.geometry.height || 1,
            part.geometry.depth || 1
          );
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(
            part.geometry.radius || 1,
            part.geometry.radius || 1,
            part.geometry.height || 1,
            part.geometry.segments || 32
          );
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(
            part.geometry.radius || 1,
            part.geometry.segments || 32,
            part.geometry.segments || 32
          );
          break;
        case 'plane':
          geometry = new THREE.PlaneGeometry(
            part.geometry.width || 1,
            part.geometry.height || 1
          );
          break;
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1);
      }
      
      // 재질 생성
      let material: THREE.Material;
      
      switch (part.material.type) {
        case 'basic':
          material = new THREE.MeshBasicMaterial({
            color: part.material.color
          });
          break;
        case 'standard':
          material = new THREE.MeshStandardMaterial({
            color: part.material.color,
            roughness: part.material.roughness || 0.5,
            metalness: part.material.metalness || 0.1
          });
          break;
        case 'phong':
          material = new THREE.MeshPhongMaterial({
            color: part.material.color,
            shininess: part.material.shininess || 30
          });
          break;
        default:
          material = new THREE.MeshStandardMaterial({
            color: part.material.color || '#FFFFFF'
          });
      }
      
      // 메시 생성 및 그룹에 추가
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = part.name;
      
      // 위치, 회전, 스케일 설정
      mesh.position.set(...part.position);
      
      if (part.rotation) {
        mesh.rotation.set(...part.rotation);
      }
      
      if (part.scale) {
        mesh.scale.set(...part.scale);
      }
      
      group.add(mesh);
    });
  } else {
    // 기본 모델 생성 (부품이 없는 경우)
    const geometry = new THREE.BoxGeometry(
      modelData.geometry.width,
      modelData.geometry.height,
      modelData.geometry.depth
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: modelData.materials[0].color,
      roughness: modelData.materials[0].roughness || 0.5,
      metalness: modelData.materials[0].metalness || 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  }
  
  return group;
};

export default MODULE_MODELS; 