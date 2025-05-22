# Wardrobe Configurator 3D 리팩토링 계획서

## 현재 문제점

1. **코드 복잡성**
   - `index.jsx` 파일이 3000줄 이상으로 너무 긴 파일입니다.
   - 단내림(에어컨 공간) 위치 계산 로직이 여러 곳에 분산되어 있어 일관성이 없습니다.
   - 복잡한 3D 위치 계산 로직이 중복되고 제대로 캡슐화되지 않았습니다.

2. **일관성 문제**
   - 상부 프레임, 하부 받침대, 엔드패널 등의 위치가 서로 맞지 않는 문제가 자주 발생합니다.
   - 위치 계산 로직이 일관되지 않고 여러 곳에서 비슷한 계산을 중복으로 수행하고 있습니다.

3. **확장성 부족**
   - 새로운 모드나 조건을 추가할 때마다 여러 곳의 코드를 수정해야 합니다.
   - 재사용 가능한 컴포넌트나 함수가 적어 유지보수가 어렵습니다.

4. **디버깅 어려움**
   - 3D 렌더링 관련 문제를 식별하고 디버깅하기 어려운 구조입니다.
   - 시각적 피드백이 부족하여 문제 원인을 찾기 어렵습니다.

## 리팩토링 목표

1. **모듈 분리 및 재구성**
   - 큰 파일을 기능별로 분리하여 더 작고 관리하기 쉬운 모듈로 나눕니다.
   - 각 요소(프레임, 벽, 바닥, 천장 등)를 별도의 컴포넌트로 분리합니다.

2. **위치 계산 로직 통합**
   - 모든 요소의 위치 및 치수 계산을 위한 중앙 집중식 유틸리티 함수를 만듭니다.
   - 모든 요소가 동일한 로직을 사용하도록 통합합니다.

3. **유지보수성 향상**
   - 재사용 가능한 코드를 추출하여 중복을 제거합니다.
   - 명확한 인터페이스와 문서화를 통해 코드를 이해하기 쉽게 만듭니다.

4. **디버깅 도구 개선**
   - 3D 좌표 및 요소 경계를 시각화하는 도구를 추가합니다.
   - 개발 모드에서 디버깅 정보를 확인할 수 있는 패널을 추가합니다.

## 리팩토링 계획

### 1단계: 파일 구조 재구성

```
src/components/common/RoomViewer3D/
├── index.jsx (진입점, 관리 코드만 포함)
├── components/
│   ├── Room.jsx (메인 Room 컴포넌트, 하위 컴포넌트 조합)
│   ├── Floor.jsx (바닥 렌더링)
│   ├── Ceiling.jsx (천장 렌더링)
│   ├── Walls.jsx (벽면 렌더링)
│   ├── Frames.jsx (프레임 렌더링)
│   ├── ACUnit.jsx (단내림 영역 렌더링)
│   ├── EndPanel.jsx (엔드패널 렌더링)
│   ├── Base.jsx (받침대 렌더링)
│   └── DimensionLines.jsx (치수선 렌더링)
├── hooks/
│   ├── useRoomCalculations.js (치수 계산을 위한 훅)
│   ├── useMaterialFactory.js (재질 생성을 위한 훅)
│   └── useRoomContext.js (Room 상태 관리 훅)
├── utils/
│   ├── calculationUtils.js (모든 위치 및 치수 계산 함수)
│   ├── materialUtils.js (재질 관련 유틸리티)
│   └── debugUtils.js (디버깅 유틸리티)
└── contexts/
    └── RoomContext.jsx (Room 상태 관리 컨텍스트)
```

### 2단계: 위치 계산 로직 통합

1. **중앙 계산 모듈 만들기**
   - `calculationUtils.js`에 모든 위치/치수 계산 함수 통합
   - 일관된 인자 구조와 명명 규칙 적용
   - 리턴 값 형식 표준화

2. **대표적인 유틸리티 함수**:
   ```javascript
   // 상부 프레임 위치/치수 계산
   function calculateTopFrame(dimensions, options) { ... }
   
   // 하부 받침대 위치/치수 계산
   function calculateBase(dimensions, options) { ... }
   
   // 단내림 내벽 위치 계산
   function calculateAcSoffitInnerWall(dimensions, options) { ... }
   
   // 분절 엔드패널 위치 계산
   function calculateEndPanelCenter(dimensions, options) { ... }
   ```

### 3단계: 컴포넌트 분리

1. **Room.jsx**
   - 메인 컨테이너 역할만 수행
   - 하위 컴포넌트 조합과 공통 상태 관리

2. **개별 컴포넌트 예시**:
   ```jsx
   // Frames.jsx
   import React from 'react';
   import { useRoomContext } from '../hooks/useRoomContext';
   import { calculateTopFrame, calculateSideFrames } from '../utils/calculationUtils';
   
   export const Frames = () => {
     const { dimensions, options } = useRoomContext();
     const topFrame = calculateTopFrame(dimensions, options);
     const sideFrames = calculateSideFrames(dimensions, options);
     
     return (
       <group>
         <TopFrame {...topFrame} />
         <SideFrames {...sideFrames} />
       </group>
     );
   };
   ```

### 4단계: 디버깅 도구 추가

1. **디버깅 컴포넌트**
   - `DebugGrid.jsx`: 좌표계 그리드 표시
   - `DebugInfo.jsx`: 3D 좌표 및 치수 정보 표시
   - `DebugPanel.jsx`: 디버깅 옵션 컨트롤 패널

2. **디버깅 훅**
   ```javascript
   // useDebugMode.js
   export function useDebugMode() {
     const [debugMode, setDebugMode] = useState(false);
     const [showGrid, setShowGrid] = useState(false);
     const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
     
     return {
       debugMode,
       showGrid,
       showBoundingBoxes,
       toggleDebugMode: () => setDebugMode(prev => !prev),
       // ... 기타 제어 함수
     };
   }
   ```

## 구현 순서

1. 유틸리티 함수 먼저 구현 및 테스트
2. 컨텍스트 및 훅 구현
3. 컴포넌트 분리 및 리팩토링
4. 디버깅 도구 추가
5. 통합 테스트 및 버그 수정

## 우선순위

1. **높은 우선순위**
   - 위치 계산 로직 통합 (calculationUtils.js)
   - 주요 컴포넌트 분리 (Room, Frames, ACUnit)

2. **중간 우선순위**
   - 컨텍스트 구현
   - 나머지 컴포넌트 분리

3. **낮은 우선순위**
   - 디버깅 도구 추가
   - 성능 최적화

## 기대효과

1. **코드 품질 향상**
   - 가독성, 유지보수성, 확장성 개선
   - 버그 발생 가능성 감소

2. **개발 효율성 증가**
   - 빠른 기능 추가 및 수정 가능
   - 디버깅 시간 단축

3. **일관된 렌더링**
   - 모든 요소가 동일한 로직으로 위치가 계산되어 일관성 유지
   - 단내림 영역과 관련된 오차 제거

## 로드맵

1. **1주차**: 계획 검토 및 협의, 유틸리티 함수 구현
2. **2주차**: 컨텍스트 구현 및 주요 컴포넌트 분리
3. **3주차**: 나머지 컴포넌트 분리 및 테스트
4. **4주차**: 디버깅 도구 추가 및 최종 테스트 