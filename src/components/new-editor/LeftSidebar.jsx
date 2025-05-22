import { useState, useEffect, useRef } from "react";
import { Grid, Layers, MoreHorizontal, User, PlusCircle } from "lucide-react";

// cn utility 함수 추가
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// 메뉴 항목 정의
const menuItems = [
  { icon: Grid, label: "모듈", value: "module" },
  { icon: Layers, label: "재질", value: "material" },
  { icon: Layers, label: "구조물", value: "structure" },
  { icon: MoreHorizontal, label: "기타", value: "other" },
];

const profileItems = [
  { image: "avatar-1.png", role: "프로젝트 담당자" },
  { image: "avatar-2.png", role: "Member" },
  { image: "avatar-3.png", role: "Member" },
  { image: "avatar-4.png", role: "Member" },
];

// 탭별 하위메뉴 설정
const subMenus = {
  "키큰장": ["전체", "싱글", "듀얼"],
  "하부장": ["하부싱글", "하부듀얼"],
  "패널": ["전체", "도어", "몰딩", "EP"]
};

// 재질 데이터 정의
const materials = [
  // 외부 재질 (바깥쪽 원)
  { id: "o1", name: "White", color: "#f5f5f0", type: "outer" },
  { id: "o2", name: "Light Beige", color: "#d8d3c0", type: "outer" },
  { id: "o3", name: "Beige", color: "#d5c6ad", type: "outer" },
  { id: "o4", name: "Gray", color: "#a4a4a4", type: "outer" },
  { id: "o5", name: "MDF", color: "#e9e5dc", type: "outer" },
  { id: "o6", name: "Light Gray", color: "#d3d3d3", type: "outer" },
  { id: "o7", name: "Dark Gray", color: "#706e6c", type: "outer" },
  { id: "o8", name: "Cream", color: "#e8e1d3", type: "outer" },
  { id: "o9", name: "Tan", color: "#c8b89b", type: "outer" },
  { id: "o10", name: "Terracotta", color: "#c8a394", type: "outer" },
  { id: "o11", name: "Slate Blue", color: "#94a1b3", type: "outer" },
  { id: "o12", name: "Sage", color: "#b9bea7", type: "outer" },
  { id: "o13", name: "Olive", color: "#697a50", type: "outer" },
  { id: "o14", name: "Charcoal", color: "#4b4b4b", type: "outer" },
  { id: "o15", name: "Black", color: "#212121", type: "outer" },
  
  // 내부 재질 (안쪽 원)
  { id: "i1", name: "Dark Wood", color: "#43302e", type: "inner", image: "/materials/dark-wood.jpg" },
  { id: "i2", name: "Black Wood", color: "#211f1c", type: "inner", image: "/materials/black-wood.jpg" },
  { id: "i3", name: "Light Oak", color: "#d4bd94", type: "inner", image: "/materials/light-oak.jpg" },
  { id: "i4", name: "Cherry", color: "#6e4239", type: "inner", image: "/materials/cherry.jpg" },
  { id: "i5", name: "Medium Oak", color: "#b28968", type: "inner", image: "/materials/medium-oak.jpg" },
  { id: "i6", name: "Natural Oak", color: "#c7ae7f", type: "inner", image: "/materials/natural-oak.jpg" },
  { id: "i7", name: "Walnut", color: "#755541", type: "inner", image: "/materials/walnut.jpg" },
  { id: "i8", name: "Ebony", color: "#3b3b3b", type: "inner", image: "/materials/ebony.jpg" },
];

// Recreate the material wheel from the image
const materialSwatches = [
  // Outer ring materials - clockwise from top
  { id: "o1", name: "Cream", color: "#f5f5f0", position: 1, isInner: false },
  { id: "o2", name: "Light Beige", color: "#d8d3c0", position: 2, isInner: false },
  { id: "o3", name: "Beige", color: "#d5c6ad", position: 3, isInner: false },
  { id: "o4", name: "Tan", color: "#c8b89b", position: 4, isInner: false },
  { id: "o5", name: "Terracotta", color: "#b15f4c", position: 5, isInner: false },
  { id: "o6", name: "Slate Blue", color: "#6a869c", position: 6, isInner: false },
  { id: "o7", name: "Light Sage", color: "#b9bea7", position: 7, isInner: false },
  { id: "o8", name: "Olive", color: "#697a50", position: 8, isInner: false },
  { id: "o9", name: "Sage", color: "#a3a78c", position: 9, isInner: false },
  { id: "o10", name: "Charcoal", color: "#4b4b4b", position: 10, isInner: false },
  { id: "o11", name: "Black", color: "#212121", position: 11, isInner: false },
  { id: "o12", name: "Dark Gray", color: "#706e6c", position: 12, isInner: false },
  { id: "o13", name: "Gray", color: "#a4a4a4", position: 13, isInner: false },
  { id: "o14", name: "MDF", color: "#e9e5dc", position: 14, isInner: false },
  { id: "o15", name: "Light Gray", color: "#d3d3d3", position: 15, isInner: false },
  
  // Inner ring materials - wood tones clockwise
  { id: "i1", name: "Dark Walnut", color: "#43302e", position: 1, isInner: true, texture: "wood" },
  { id: "i2", name: "Black Oak", color: "#211f1c", position: 2, isInner: true, texture: "wood" },
  { id: "i3", name: "Walnut", color: "#755541", position: 3, isInner: true, texture: "wood" },
  { id: "i4", name: "Medium Oak", color: "#b28968", position: 4, isInner: true, texture: "wood" },
  { id: "i5", name: "Natural Oak", color: "#c7ae7f", position: 5, isInner: true, texture: "wood" },
  { id: "i6", name: "Light Oak", color: "#d4bd94", position: 6, isInner: true, texture: "wood" },
  { id: "i7", name: "Cherry", color: "#6e4239", position: 7, isInner: true, texture: "wood" },
  { id: "i8", name: "Ebony", color: "#3b3b3b", position: 8, isInner: true, texture: "wood" },
];

export const LeftSidebar = ({ 
  frameColor = "#CECECE", 
  handleFrameColorChange = () => {},
  onModuleSelect = () => {} // 새로 추가: 모듈 선택 이벤트 핸들러
}) => {
  const [activeTab, setActiveTab] = useState("module");
  const [subTab, setSubTab] = useState("키큰장");
  const [subTabType, setSubTabType] = useState("전체");
  const [moduleItems, setModuleItems] = useState([]);
  const [imagesAvailable, setImagesAvailable] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState(null); // 선택된 모듈 ID 상태 추가
  
  // 이미지 캐시를 위한 상태 추가 (키 기반 캐싱)
  const [moduleItemsCache, setModuleItemsCache] = useState({}); 
  
  // Material state
  const [materialTab, setMaterialTab] = useState("도어");
  const [selectedMaterial, setSelectedMaterial] = useState("Quartz");
  
  // 초기 frameColor로 selectedColor를 설정하지 않고 별도의 색상으로 시작 
  // 색상 휠과 재질 파레트를 완전히 분리
  const [selectedColor, setSelectedColor] = useState(frameColor);
  
  const [colorName, setColorName] = useState("Rose");
  const [colorOpacity, setColorOpacity] = useState(50); // 기본값은 50% (밝기)
  const [savedColors, setSavedColors] = useState([
    { id: '1', hex: '#FF5252' },
    { id: '2', hex: '#7C4DFF' },
    { id: '3', hex: '#40C4FF' },
    { id: '4', hex: '#69F0AE' },
    { id: '5', hex: '#FFFF00' }
  ]);
  
  const colorWheelRef = useRef(null);
  const materialWheelRef = useRef(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [hoverColor, setHoverColor] = useState(null); // 마우스 오버 시 미리보기 색상
  const colorUpdateTimerRef = useRef(null); // RGB 휠 색상 업데이트를 위한 타이머 참조 추가
  
  // 불필요한 초기화를 제거하고 모든 초기화를 한 곳에서 처리
  useEffect(() => {
    // 새로운 탭으로 변경될 때만, 해당 탭의 하위 메뉴가 있고 현재 하위 탭이 없을 때만 초기화
    if (subMenus[subTab] && (!subTabType || !subMenus[subTab].includes(subTabType))) {
      setSubTabType(subMenus[subTab][0]);
    }
    
    // 하부장이나 패널 탭인 경우 이미지가 없음을 표시
    setImagesAvailable(subTab === "키큰장");
    
    // 키큰장 탭에 있는 경우에만 선택된 모듈 ID를 유지
    // 다른 탭으로 이동하는 경우에는 선택 초기화
    if (selectedModuleId && subTab !== "키큰장") {
      setSelectedModuleId(null);
      onModuleSelect(null);
    }
  }, [subTab, subMenus, subTabType, selectedModuleId, onModuleSelect]);

  // 메인 탭이 변경될 때 처리
  useEffect(() => {
    // 모듈 탭이 아닌 경우에만 초기화
    if (activeTab !== "module") {
      setSelectedModuleId(null);
      onModuleSelect(null);
    }
  }, [activeTab, onModuleSelect]);
  
  // 하위 탭 타입(싱글/듀얼/전체 등)이 변경될 때 선택된 모듈 유지 로직
  useEffect(() => {
    // 선택된 모듈이 있는 경우만 처리
    if (selectedModuleId) {
      const isCurrentSingle = selectedModuleId.startsWith("모듈");
      const isCurrentDual = selectedModuleId.startsWith("듀얼");
      
      // 하위 타입이 "싱글"인데 선택된 모듈이 싱글이 아닌 경우
      if (subTabType === "싱글" && !isCurrentSingle) {
        setSelectedModuleId(null);
        onModuleSelect(null);
      }
      // 하위 타입이 "듀얼"인데 선택된 모듈이 듀얼이 아닌 경우
      else if (subTabType === "듀얼" && !isCurrentDual) {
        setSelectedModuleId(null);
        onModuleSelect(null);
      }
      // 그 외의 경우는 선택 유지
    }
  }, [subTabType, selectedModuleId, onModuleSelect]);

  useEffect(() => {
    // 이미지가 없는 탭이면 빈 배열 반환
    if (!imagesAvailable) {
      setModuleItems([]);
      return;
    }
    
    // 선택된 하위 탭에 따라 적절한 모듈 이미지 로드
    
    // 이미지는 반복적으로 표시하기 위한 배열
    let baseImages = [];
    
    if (subTab === "키큰장") {
      if (subTabType === "싱글") {
        baseImages = [
          { id: "모듈1", image: "module-image/single/D1HH.png" },
          { id: "모듈2", image: "module-image/single/D1L.png" },
          { id: "모듈3", image: "module-image/single/D1L1BL.png" },
          { id: "모듈4", image: "module-image/single/D1L1BLO.png" },
          { id: "모듈5", image: "module-image/single/D1L2BL.png" },
          { id: "모듈6", image: "module-image/single/D1L2BLO.png" },
          { id: "모듈7", image: "module-image/single/D1L3BL.png" },
          { id: "모듈8", image: "module-image/single/D1L4BL.png" },
          { id: "모듈9", image: "module-image/single/D1LH.png" },
          { id: "모듈10", image: "module-image/single/D1LH1BL.png" },
          { id: "모듈11", image: "module-image/single/D1LH1BLO.png" },
          { id: "모듈12", image: "module-image/single/D1LH2BL.png" },
          { id: "모듈13", image: "module-image/single/D1LH3BL.png" },
          { id: "모듈14", image: "module-image/single/D1LHH.png" },
          { id: "모듈15", image: "module-image/single/D1LHL.png" },
        ];
      } else if (subTabType === "듀얼") {
        baseImages = [
          { id: "듀얼1", image: "module-image/dual/D2HH.png" },
          { id: "듀얼2", image: "module-image/dual/D2L.png" },
          { id: "듀얼3", image: "module-image/dual/D2L1BL.png" },
          { id: "듀얼4", image: "module-image/dual/D2L1BLO.png" },
          { id: "듀얼5", image: "module-image/dual/D2L2BL.png" },
          { id: "듀얼6", image: "module-image/dual/D2L2BLO.png" },
          { id: "듀얼7", image: "module-image/dual/D2L3BL.png" },
          { id: "듀얼8", image: "module-image/dual/D2L4BL.png" },
          { id: "듀얼9", image: "module-image/dual/D2LH.png" },
          { id: "듀얼10", image: "module-image/dual/D2LH1BL.png" },
          { id: "듀얼11", image: "module-image/dual/D2LH1BLO.png" },
          { id: "듀얼12", image: "module-image/dual/D2LH2BL.png" },
          { id: "듀얼13", image: "module-image/dual/D2LH3BL.png" },
          { id: "듀얼14", image: "module-image/dual/D2LHH.png" },
          { id: "듀얼15", image: "module-image/dual/D2LHL.png" },
          { id: "듀얼16", image: "module-image/dual/D2LIFT2BL.png" },
          { id: "듀얼17", image: "module-image/dual/D2LIFT2BLO.png" },
          { id: "듀얼18", image: "module-image/dual/D2LIFTH.png" },
          { id: "듀얼19", image: "module-image/dual/D2LIFTL.png" },
          { id: "듀얼20", image: "module-image/dual/D2SL.png" },
        ];
      } else {
        // 전체일 경우 모든 이미지 포함
        baseImages = [
          // 싱글 모듈
          { id: "모듈1", image: "module-image/single/D1HH.png" },
          { id: "모듈2", image: "module-image/single/D1L.png" },
          { id: "모듈3", image: "module-image/single/D1L1BL.png" },
          { id: "모듈4", image: "module-image/single/D1L1BLO.png" },
          { id: "모듈5", image: "module-image/single/D1L2BL.png" },
          { id: "모듈6", image: "module-image/single/D1L2BLO.png" },
          { id: "모듈7", image: "module-image/single/D1L3BL.png" },
          { id: "모듈8", image: "module-image/single/D1L4BL.png" },
          { id: "모듈9", image: "module-image/single/D1LH.png" },
          { id: "모듈10", image: "module-image/single/D1LH1BL.png" },
          { id: "모듈11", image: "module-image/single/D1LH1BLO.png" },
          { id: "모듈12", image: "module-image/single/D1LH2BL.png" },
          { id: "모듈13", image: "module-image/single/D1LH3BL.png" },
          { id: "모듈14", image: "module-image/single/D1LHH.png" },
          { id: "모듈15", image: "module-image/single/D1LHL.png" },
          
          // 듀얼 모듈
          { id: "듀얼1", image: "module-image/dual/D2HH.png" },
          { id: "듀얼2", image: "module-image/dual/D2L.png" },
          { id: "듀얼3", image: "module-image/dual/D2L1BL.png" },
          { id: "듀얼4", image: "module-image/dual/D2L1BLO.png" },
          { id: "듀얼5", image: "module-image/dual/D2L2BL.png" },
          { id: "듀얼6", image: "module-image/dual/D2L2BLO.png" },
          { id: "듀얼7", image: "module-image/dual/D2L3BL.png" },
          { id: "듀얼8", image: "module-image/dual/D2L4BL.png" },
          { id: "듀얼9", image: "module-image/dual/D2LH.png" },
          { id: "듀얼10", image: "module-image/dual/D2LH1BL.png" },
          { id: "듀얼11", image: "module-image/dual/D2LH1BLO.png" },
          { id: "듀얼12", image: "module-image/dual/D2LH2BL.png" },
          { id: "듀얼13", image: "module-image/dual/D2LH3BL.png" },
          { id: "듀얼14", image: "module-image/dual/D2LHH.png" },
          { id: "듀얼15", image: "module-image/dual/D2LHL.png" },
          { id: "듀얼16", image: "module-image/dual/D2LIFT2BL.png" },
          { id: "듀얼17", image: "module-image/dual/D2LIFT2BLO.png" },
          { id: "듀얼18", image: "module-image/dual/D2LIFTH.png" },
          { id: "듀얼19", image: "module-image/dual/D2LIFTL.png" },
          { id: "듀얼20", image: "module-image/dual/D2SL.png" },
        ];
      }
    } else if (subTab === "하부장") {
      if (subTabType === "하부싱글") {
        baseImages = [
          { id: "하부싱글1", image: "module-image/single/D1HH.png" },
          { id: "하부싱글2", image: "module-image/single/D1L.png" },
          { id: "하부싱글3", image: "module-image/single/D1L1BL.png" },
          { id: "하부싱글4", image: "module-image/single/D1L1BLO.png" },
          { id: "하부싱글5", image: "module-image/single/D1L2BL.png" },
          { id: "하부싱글6", image: "module-image/single/D1L2BLO.png" },
          { id: "하부싱글7", image: "module-image/single/D1L3BL.png" },
          { id: "하부싱글8", image: "module-image/single/D1L4BL.png" },
          { id: "하부싱글9", image: "module-image/single/D1LH.png" },
          { id: "하부싱글10", image: "module-image/single/D1LH1BL.png" },
          { id: "하부싱글11", image: "module-image/single/D1LH1BLO.png" },
          { id: "하부싱글12", image: "module-image/single/D1LH2BL.png" },
          { id: "하부싱글13", image: "module-image/single/D1LH3BL.png" },
          { id: "하부싱글14", image: "module-image/single/D1LHH.png" },
          { id: "하부싱글15", image: "module-image/single/D1LHL.png" },
        ];
      } else if (subTabType === "하부듀얼") {
        baseImages = [
          { id: "하부듀얼1", image: "module-image/dual/D2HH.png" },
          { id: "하부듀얼2", image: "module-image/dual/D2L.png" },
          { id: "하부듀얼3", image: "module-image/dual/D2L1BL.png" },
          { id: "하부듀얼4", image: "module-image/dual/D2L1BLO.png" },
          { id: "하부듀얼5", image: "module-image/dual/D2L2BL.png" },
          { id: "하부듀얼6", image: "module-image/dual/D2L2BLO.png" },
          { id: "하부듀얼7", image: "module-image/dual/D2L3BL.png" },
          { id: "하부듀얼8", image: "module-image/dual/D2L4BL.png" },
          { id: "하부듀얼9", image: "module-image/dual/D2LH.png" },
          { id: "하부듀얼10", image: "module-image/dual/D2LH1BL.png" },
          { id: "하부듀얼11", image: "module-image/dual/D2LH1BLO.png" },
          { id: "하부듀얼12", image: "module-image/dual/D2LH2BL.png" },
          { id: "하부듀얼13", image: "module-image/dual/D2LH3BL.png" },
          { id: "하부듀얼14", image: "module-image/dual/D2LHH.png" },
          { id: "하부듀얼15", image: "module-image/dual/D2LHL.png" },
          { id: "하부듀얼16", image: "module-image/dual/D2LIFT2BL.png" },
          { id: "하부듀얼17", image: "module-image/dual/D2LIFT2BLO.png" },
          { id: "하부듀얼18", image: "module-image/dual/D2LIFTH.png" },
          { id: "하부듀얼19", image: "module-image/dual/D2LIFTL.png" },
          { id: "하부듀얼20", image: "module-image/dual/D2SL.png" },
        ];
      }
    } else if (subTab === "패널") {
      if (subTabType === "도어") {
        baseImages = [
          { id: "도어1", image: "module-image/single/D1HH.png" },
          { id: "도어2", image: "module-image/single/D1L.png" },
          { id: "도어3", image: "module-image/single/D1L1BL.png" },
          { id: "도어4", image: "module-image/single/D1L1BLO.png" },
          { id: "도어5", image: "module-image/single/D1L2BL.png" },
          { id: "도어6", image: "module-image/single/D1L2BLO.png" },
          { id: "도어7", image: "module-image/dual/D2HH.png" },
          { id: "도어8", image: "module-image/dual/D2L.png" },
          { id: "도어9", image: "module-image/dual/D2L1BL.png" },
          { id: "도어10", image: "module-image/dual/D2L1BLO.png" },
        ];
      } else if (subTabType === "몰딩") {
        baseImages = [
          { id: "몰딩1", image: "module-image/dual/D2HH.png" },
          { id: "몰딩2", image: "module-image/dual/D2L.png" },
          { id: "몰딩3", image: "module-image/dual/D2LH.png" },
          { id: "몰딩4", image: "module-image/dual/D2LHH.png" },
          { id: "몰딩5", image: "module-image/dual/D2LHL.png" },
          { id: "몰딩6", image: "module-image/single/D1HH.png" },
          { id: "몰딩7", image: "module-image/single/D1L.png" },
          { id: "몰딩8", image: "module-image/single/D1LH.png" },
        ];
      } else if (subTabType === "EP") {
        baseImages = [
          { id: "EP1", image: "module-image/single/D1L1BL.png" },
          { id: "EP2", image: "module-image/dual/D2L1BL.png" },
          { id: "EP3", image: "module-image/single/D1L2BL.png" },
          { id: "EP4", image: "module-image/dual/D2L2BL.png" },
          { id: "EP5", image: "module-image/single/D1L3BL.png" },
          { id: "EP6", image: "module-image/dual/D2L3BL.png" },
          { id: "EP7", image: "module-image/single/D1LH1BL.png" },
          { id: "EP8", image: "module-image/dual/D2LH1BL.png" },
          { id: "EP9", image: "module-image/single/D1LH2BL.png" },
          { id: "EP10", image: "module-image/dual/D2LH2BL.png" },
        ];
      } else {
        // 전체일 경우
        baseImages = [
          // 도어
          { id: "도어1", image: "module-image/single/D1HH.png" },
          { id: "도어2", image: "module-image/single/D1L.png" },
          { id: "도어3", image: "module-image/dual/D2HH.png" },
          { id: "도어4", image: "module-image/dual/D2L.png" },
          
          // 몰딩
          { id: "몰딩1", image: "module-image/dual/D2LH.png" },
          { id: "몰딩2", image: "module-image/dual/D2LHH.png" },
          { id: "몰딩3", image: "module-image/single/D1LH.png" },
          
          // EP
          { id: "EP1", image: "module-image/single/D1L1BL.png" },
          { id: "EP2", image: "module-image/dual/D2L1BL.png" },
          { id: "EP3", image: "module-image/single/D1L2BL.png" },
          { id: "EP4", image: "module-image/dual/D2L2BL.png" },
          { id: "EP5", image: "module-image/single/D1LH1BL.png" },
          { id: "EP6", image: "module-image/dual/D2LH1BL.png" },
        ];
      }
    }

    // 모듈 이미지 설정
    // 이미지를 반복하지 않고 baseImages를 그대로 사용
    setModuleItems(baseImages);
  }, [subTab, subTabType, imagesAvailable]);

  // 모듈 항목 변경 시 선택된 모듈 ID가 현재 리스트에 없는 경우 선택 초기화
  useEffect(() => {
    // 선택된 모듈이 있고, 모듈 아이템 목록이 비어있지 않은 경우
    if (selectedModuleId && moduleItems.length > 0) {
      // 현재 선택된 모듈 ID가 모듈 목록에 없으면 선택 초기화
      const moduleExists = moduleItems.some(item => item.id === selectedModuleId);
      if (!moduleExists) {
        setSelectedModuleId(null);
        onModuleSelect(null);
      }
    }
  }, [moduleItems, selectedModuleId, onModuleSelect]);

  const handleColorPointClick = (e) => {
    // 이벤트 버블링 방지
    e.stopPropagation();
    updateColorSelection(e);
  };
  
  // 컬러 휠 선택 이벤트 - 색상 선택점 위치 및 색상값 업데이트 개선
  const updateColorSelection = (e) => {
    if (colorWheelRef.current) {
      // 이벤트 버블링 방지
      e.stopPropagation();
      
      const rect = colorWheelRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // 클릭 위치가 원 내부인지 확인 (원 밖에서 클릭하면 가장자리로 조정)
      const dx = clickX - centerX;
      const dy = clickY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = Math.min(rect.width, rect.height) / 2;
      
      let finalX = clickX;
      let finalY = clickY;
      
      // 클릭 위치가 원 밖이면 가장자리로 조정
      if (distance > radius) {
        const ratio = radius / distance;
        finalX = centerX + dx * ratio;
        finalY = centerY + dy * ratio;
      }
      
      // Calculate the relative position for the selector
      const relativeX = (finalX / rect.width) * 100;
      const relativeY = (finalY / rect.height) * 100;
      
      // 정확한 HSL 색상 계산
      const adjustedDx = finalX - centerX;
      const adjustedDy = finalY - centerY;
      
      // 각도 계산 (0-360 degrees)
      let hue = Math.atan2(adjustedDy, adjustedDx) * (180 / Math.PI);
      if (hue < 0) hue += 360;
      
      // 거리를 기반으로 채도 계산 (0-100)
      const adjustedDistance = Math.sqrt(adjustedDx * adjustedDx + adjustedDy * adjustedDy);
      const saturation = Math.min(adjustedDistance / radius, 1) * 100;
      
      // 밝기는 현재 투명도 슬라이더 값 기준으로 설정
      const minLightness = 10;
      const maxLightness = 90;
      const range = maxLightness - minLightness;
      const lightness = minLightness + (range * colorOpacity / 100);
      
      // 새 색상 계산
      const newColor = hslToHex(hue, saturation, lightness);
      
      // 색상이 변경됐을 때만 업데이트 (불필요한 업데이트 방지)
      if (newColor !== selectedColor) {
        setSelectedColor(newColor);
        
        // Update the selector position
        const selectorElement = document.getElementById('color-selector');
        if (selectorElement) {
          selectorElement.style.left = `${relativeX}%`;
          selectorElement.style.top = `${relativeY}%`;
        }
        
        // 미리보기 색상 제거 (선택 후에는 미리보기가 필요 없음)
        setHoverColor(null);
        
        // 도어 탭인 경우 프레임 색상 변경 (installationType과 무관하게 항상 적용)
        if (materialTab === "도어") {
          // 업데이트 디바운스 적용 (300ms)
          if (colorUpdateTimerRef.current) {
            clearTimeout(colorUpdateTimerRef.current);
          }
          
          colorUpdateTimerRef.current = setTimeout(() => {
            handleFrameColorChange(newColor);
            colorUpdateTimerRef.current = null;
          }, 300);
        }
      }
    }
  };
  
  const handleMouseDown = (e) => {
    // 이벤트 버블링 방지
    e.stopPropagation();
    setIsDragging(true);
    updateColorSelection(e);
  };
  
  const handleMouseMove = (e) => {
    // 이벤트 버블링 방지
    e.stopPropagation();
    if (isDragging) {
      updateColorSelection(e);
    }
  };
  
  const handleMouseUp = (e) => {
    // 이벤트 버블링 방지
    e.stopPropagation();
    setIsDragging(false);
  };
  
  // Add global mouse up event to handle cases where mouse is released outside the color wheel
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      setIsDragging(false);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleSaveColor = () => {
    const newColor = { id: `${savedColors.length + 1}`, hex: selectedColor };
    setSavedColors([...savedColors, newColor]);
  };
  
  const handleRemoveColor = (idToRemove) => {
    setSavedColors(savedColors.filter(color => color.id !== idToRemove));
  };
  
  const handleSelectSavedColor = (hex) => {
    setSelectedColor(hex);
    // 도어 탭인 경우에만 프레임 색상 변경 (원래대로 복원)
    if (materialTab === "도어") {
      handleFrameColorChange(hex);
    }
  };
  
  const handleSelectMaterial = (name, color) => {
    // 재질 이름만 업데이트
    setSelectedMaterial(name);
    
    // 도어 탭인 경우에 selectedColor를 변경하지 않고 프레임 색상만 변경
    if (materialTab === "도어") {
      // 프레임 색상 변경만 적용, RGB 컬러 휠은 업데이트하지 않음
      handleFrameColorChange(color);
      console.log(`[LeftSidebar] 재질 선택됨: ${name}, 색상: ${color}, RGB 휠 색상은 그대로 유지: ${selectedColor}`);
    }
  };

  // 컬러 휠 마우스 이동 시 색상 미리보기 개선
  const handleColorPreview = (e) => {
    // 이벤트 버블링 방지
    e.stopPropagation();
    if (colorWheelRef.current && !isDragging) {
      const rect = colorWheelRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 마우스 위치가 원 내부인지 확인
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = Math.min(rect.width, rect.height) / 2;
      
      if (distance <= radius) {
        // 색상 계산
        let hue = Math.atan2(dy, dx) * (180 / Math.PI);
        if (hue < 0) hue += 360;
        
        const saturation = Math.min(distance / radius, 1) * 100;
        
        // 밝기 계산 (투명도 슬라이더 값으로 조정)
        const minLightness = 10;
        const maxLightness = 90;
        const range = maxLightness - minLightness;
        const lightness = minLightness + (range * colorOpacity / 100);
        
        // 미리보기 색상 계산
        const previewColor = hslToHex(hue, saturation, lightness);
        
        // 마우스 좌표를 상대적 퍼센트로 변환 (포인터 위치용)
        const relativeX = (mouseX / rect.width) * 100;
        const relativeY = (mouseY / rect.height) * 100;
        
        setHoverColor({
          color: previewColor,
          x: relativeX,
          y: relativeY
        });
      } else {
        setHoverColor(null);
      }
    }
  };

  // 마우스 휠에서 벗어날 때 미리보기 색상 제거
  const handleColorPreviewEnd = (e) => {
    // 이벤트 버블링 방지
    e.stopPropagation();
    setHoverColor(null);
  };

  const handleOpacityChange = (e) => {
    const newOpacity = parseInt(e.target.value);
    setColorOpacity(newOpacity);
    
    // 투명도가 변경될 때 선택된 색상의 밝기도 함께 조정 (재질에는 영향 없음)
    if (selectedColor) {
      // HEX를 HSL로 변환
      const { h, s } = hexToHsl(selectedColor);
      
      // 투명도를 기반으로 밝기 조정 (10%~90% 범위)
      const minLightness = 10;
      const maxLightness = 90;
      const range = maxLightness - minLightness;
      const adjustedL = minLightness + (range * newOpacity / 100);
      
      // HSL을 HEX로 변환
      const adjustedColor = hslToHex(h, s, adjustedL);
      setSelectedColor(adjustedColor);
      
      // 도어 탭인 경우에만 프레임 색상 변경 (재질에는 영향 없음)
      if (materialTab === "도어") {
        handleFrameColorChange(adjustedColor);
        console.log(`[LeftSidebar] 투명도 변경: ${newOpacity}%, RGB 색상: ${adjustedColor}, 재질은 그대로 유지: ${selectedMaterial}`);
      }
    }
  };
  
  // HEX to HSL 변환 함수 개선
  const hexToHsl = (hex) => {
    // HEX to RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // 무채색
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h *= 60;
    }
    
    return { h, s: s * 100, l: l * 100 };
  };
  
  // HSL to HEX 변환 함수 개선
  const hslToHex = (h, s, l) => {
    h = h % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - chroma / 2;
    
    let r, g, b;
    
    if (h >= 0 && h < 60) {
      [r, g, b] = [chroma, x, 0];
    } else if (h >= 60 && h < 120) {
      [r, g, b] = [x, chroma, 0];
    } else if (h >= 120 && h < 180) {
      [r, g, b] = [0, chroma, x];
    } else if (h >= 180 && h < 240) {
      [r, g, b] = [0, x, chroma];
    } else if (h >= 240 && h < 300) {
      [r, g, b] = [x, 0, chroma];
    } else {
      [r, g, b] = [chroma, 0, x];
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  };

  const handleHexChange = (e) => {
    let value = e.target.value.toUpperCase();
    
    // # 없으면 추가
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    
    // 유효한 HEX 값인지 검증 (6자리 또는 3자리)
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(value)) {
      // 컬러 휠만 업데이트하고 재질은 변경하지 않음
      setSelectedColor(value);
      
      // HSL로 변환하여 색상 포인터 위치 업데이트
      const { h, s, l } = hexToHsl(value);
      setColorOpacity(Math.round((l - 10) / 80 * 100)); // 밝기를 슬라이더 값으로 변환 (10-90% -> 0-100%)
      
      // 컬러 휠에서 포인터 위치 업데이트
      if (colorWheelRef.current) {
        const radius = Math.min(colorWheelRef.current.offsetWidth, colorWheelRef.current.offsetHeight) / 2;
        const saturationDistance = (s / 100) * radius;
        const angle = (h * Math.PI) / 180;
        
        // 중심에서의 x, y 좌표 계산
        const centerX = radius;
        const centerY = radius;
        const x = centerX + saturationDistance * Math.cos(angle);
        const y = centerY + saturationDistance * Math.sin(angle);
        
        // 상대적 위치 계산 (퍼센트)
        const relativeX = (x / (radius * 2)) * 100;
        const relativeY = (y / (radius * 2)) * 100;
        
        // 선택자 위치 업데이트
        const selectorElement = document.getElementById('color-selector');
        if (selectorElement) {
          selectorElement.style.left = `${relativeX}%`;
          selectorElement.style.top = `${relativeY}%`;
        }
      }
      
      // 도어 탭인 경우에만 프레임 색상 변경 (재질 선택에는 영향 없음)
      if (materialTab === "도어") {
        handleFrameColorChange(value);
        console.log(`[LeftSidebar] HEX 값 변경: ${value}, 재질은 그대로 유지: ${selectedMaterial}`);
      }
    }
  };

  const renderMaterialSection = () => {
    // Filter the materials by inner/outer rings
    const outerMaterials = materialSwatches.filter(m => !m.isInner);
    const innerMaterials = materialSwatches.filter(m => m.isInner);

    // 재질 휠 클릭 핸들러 (이벤트 버블링 방지)
    const handleMaterialWheelClick = (e) => {
      e.stopPropagation();
    };

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 내부/도어 탭 선택 - 상단에 고정 */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex px-3 py-2 justify-center">
            <div className="border border-emerald-500 rounded-md overflow-hidden flex w-full">
              <button
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                  materialTab === "내부"
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-emerald-500"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setMaterialTab("내부");
                }}
              >
                내부
              </button>
              <button
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                  materialTab === "도어"
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-emerald-500"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setMaterialTab("도어");
                  // 도어 탭으로 변경할 때 자동으로 프레임 색상을 업데이트하지 않음
                  // 재질과 RGB 컬러 휠이 독립적으로 작동하도록 함
                  console.log('[LeftSidebar] 도어 탭으로 변경됨');
                }}
              >
                도어
              </button>
            </div>
          </div>
          {materialTab === "도어" && (
            <div className="px-3 pb-2">
              {/* 문구 제거 */}
            </div>
          )}
        </div>
        
        {/* 스크롤 가능한 전체 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-4">
            {/* Material Wheel - Sized consistently with color wheel */}
            <div className="relative w-full aspect-square mb-6" onClick={handleMaterialWheelClick}>
              <div className="absolute inset-0">
                {/* Outer Material Ring */}
                <svg 
                  viewBox="0 0 100 100" 
                  className="w-full h-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <defs>
                    {outerMaterials.map((material, index) => (
                      <pattern
                        key={`pattern-${material.id}`}
                        id={`pattern-${material.id}`}
                        patternUnits="userSpaceOnUse"
                        width="10" height="10"
                        patternTransform="rotate(45)"
                      >
                        <rect width="10" height="10" fill={material.color} />
                      </pattern>
                    ))}
                    {innerMaterials.map((material, index) => (
                      <pattern
                        key={`pattern-${material.id}`}
                        id={`pattern-${material.id}`}
                        patternUnits="userSpaceOnUse"
                        width="10" height="10"
                        patternTransform="rotate(45)"
                      >
                        <rect width="10" height="10" fill={material.color} />
                        {material.texture === 'wood' && (
                          <>
                            <line x1="0" y1="5" x2="10" y2="5" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                            <line x1="5" y1="0" x2="5" y2="10" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
                          </>
                        )}
                      </pattern>
                    ))}
                  </defs>
                  
                  {/* Outer ring segments */}
                  {outerMaterials.map((material, index) => {
                    const segmentAngle = 360 / outerMaterials.length;
                    const startAngle = index * segmentAngle - 90; // Start from top (-90 deg)
                    const endAngle = startAngle + segmentAngle;
                    
                    // Convert angles to radians for calculation
                    const startRad = startAngle * Math.PI / 180;
                    const endRad = endAngle * Math.PI / 180;
                    
                    // Calculate arc points (outer circle)
                    const x1 = 50 + 45 * Math.cos(startRad);
                    const y1 = 50 + 45 * Math.sin(startRad);
                    const x2 = 50 + 45 * Math.cos(endRad);
                    const y2 = 50 + 45 * Math.sin(endRad);
                    
                    // Calculate arc points (inner circle)
                    const x3 = 50 + 30 * Math.cos(endRad);
                    const y3 = 50 + 30 * Math.sin(endRad);
                    const x4 = 50 + 30 * Math.cos(startRad);
                    const y4 = 50 + 30 * Math.sin(startRad);
                    
                    // Determine if the arc needs to go the long way around
                    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                    
                    return (
                      <path
                        key={material.id}
                        d={`M ${x1},${y1} A 45,45 0 ${largeArcFlag},1 ${x2},${y2} L ${x3},${y3} A 30,30 0 ${largeArcFlag},0 ${x4},${y4} Z`}
                        fill={material.color}
                        stroke={isMaterialSelected(material.name, material.color) ? "#ff9500" : "white"}
                        strokeWidth={isMaterialSelected(material.name, material.color) ? "2" : "0.5"}
                        style={{ cursor: 'pointer' }}
                        className="transition-all duration-200 hover:brightness-110 origin-center"
                        onMouseOver={(e) => {
                          // 이벤트 버블링 방지
                          e.stopPropagation();
                          // Calculate the direction vector from center to segment midpoint
                          const midAngle = (startAngle + endAngle) / 2 * Math.PI / 180;
                          const dx = Math.cos(midAngle);
                          const dy = Math.sin(midAngle);
                          
                          // Apply transform to move outward in the calculated direction
                          e.currentTarget.style.transform = `translate(${dx * 3}px, ${dy * 3}px)`;
                        }}
                        onMouseOut={(e) => {
                          // 이벤트 버블링 방지
                          e.stopPropagation();
                          e.currentTarget.style.transform = 'translate(0, 0)';
                        }}
                        onClick={(e) => {
                          // 이벤트 버블링 방지
                          e.stopPropagation();
                          handleSelectMaterial(material.name, material.color);
                        }}
                      />
                    );
                  })}
                  
                  {/* Inner ring segments */}
                  {innerMaterials.map((material, index) => {
                    const segmentAngle = 360 / innerMaterials.length;
                    const startAngle = index * segmentAngle - 90; // Start from top (-90 deg)
                    const endAngle = startAngle + segmentAngle;
                    
                    // Convert angles to radians for calculation
                    const startRad = startAngle * Math.PI / 180;
                    const endRad = endAngle * Math.PI / 180;
                    
                    // Calculate arc points (outer circle - same as inner of outer ring)
                    const x1 = 50 + 30 * Math.cos(startRad);
                    const y1 = 50 + 30 * Math.sin(startRad);
                    const x2 = 50 + 30 * Math.cos(endRad);
                    const y2 = 50 + 30 * Math.sin(endRad);
                    
                    // Center point
                    const x3 = 50;
                    const y3 = 50;
                    
                    // Determine if the arc needs to go the long way around
                    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                    
                    const fillPattern = material.texture === 'wood' 
                      ? `url(#pattern-${material.id})` 
                      : material.color;
                    
                    return (
                      <path
                        key={material.id}
                        d={`M ${x1},${y1} A 30,30 0 ${largeArcFlag},1 ${x2},${y2} L ${x3},${y3} Z`}
                        fill={material.color}
                        stroke={isMaterialSelected(material.name, material.color) ? "#ff9500" : "white"}
                        strokeWidth={isMaterialSelected(material.name, material.color) ? "2" : "0.5"}
                        style={{ cursor: 'pointer' }}
                        className="transition-all duration-200 hover:brightness-110 origin-center"
                        onMouseOver={(e) => {
                          // 이벤트 버블링 방지
                          e.stopPropagation();
                          // Calculate the direction vector from center to segment midpoint
                          const midAngle = (startAngle + endAngle) / 2 * Math.PI / 180;
                          const dx = Math.cos(midAngle);
                          const dy = Math.sin(midAngle);
                          
                          // Apply transform to move outward in the calculated direction
                          e.currentTarget.style.transform = `translate(${dx * 3}px, ${dy * 3}px)`;
                        }}
                        onMouseOut={(e) => {
                          // 이벤트 버블링 방지
                          e.stopPropagation();
                          e.currentTarget.style.transform = 'translate(0, 0)';
                        }}
                        onClick={(e) => {
                          // 이벤트 버블링 방지
                          e.stopPropagation();
                          handleSelectMaterial(material.name, material.color);
                        }}
                      />
                    );
                  })}
                  
                  {/* Center white circle with text */}
                  <circle cx="50" cy="50" r="15" fill="white" stroke="#e5e5e5" strokeWidth="1" />
                  <text 
                    x="50" 
                    y="50" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill="#333"
                    fontSize="5"
                    fontWeight="500"
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    lengthAdjust="spacingAndGlyphs"
                    textLength="26"
                  >
                    {selectedMaterial}
                  </text>
                </svg>
              </div>
            </div>
            
            {/* 색상 지정하기 텍스트 */}
            <div className="text-emerald-500 font-medium mb-4">
              색상 지정하기
            </div>
            
            {/* 색상 휠 - iro.js 스타일 적용 */}
            <div 
              ref={colorWheelRef}
              id="color-wheel"
              className="relative w-full aspect-square mb-4 cursor-pointer select-none rounded-full overflow-hidden shadow-lg"
              onClick={(e) => {
                e.stopPropagation(); // 버블링 방지
                handleColorPointClick(e);
              }}
              onMouseDown={(e) => {
                e.stopPropagation(); // 버블링 방지
                handleMouseDown(e);
              }}
              onMouseMove={(e) => {
                e.stopPropagation(); // 버블링 방지
                handleMouseMove(e);
                handleColorPreview(e);
              }}
              onMouseOver={(e) => {
                e.stopPropagation(); // 버블링 방지
                handleColorPreview(e);
              }}
              onMouseLeave={(e) => {
                e.stopPropagation(); // 버블링 방지
                handleColorPreviewEnd(e);
              }}
              onMouseUp={(e) => {
                e.stopPropagation(); // 버블링 방지
                handleMouseUp(e);
              }}
              style={{
                background: "#222222", // iro.js와 동일한 어두운 배경
                boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.2)"
              }}
            >
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {/* iro.js 스타일의 컬러 휠 그라데이션 */}
                <div 
                  className="w-full h-full"
                  style={{
                    background: `
                      conic-gradient(
                        from 90deg,
                        hsl(0, 100%, 50%),
                        hsl(30, 100%, 50%),
                        hsl(60, 100%, 50%),
                        hsl(90, 100%, 50%),
                        hsl(120, 100%, 50%),
                        hsl(150, 100%, 50%),
                        hsl(180, 100%, 50%),
                        hsl(210, 100%, 50%),
                        hsl(240, 100%, 50%),
                        hsl(270, 100%, 50%),
                        hsl(300, 100%, 50%),
                        hsl(330, 100%, 50%),
                        hsl(360, 100%, 50%)
                      )
                    `
                  }}
                ></div>
                {/* iro.js 스타일의 중앙 흰색 그라데이션 */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(circle closest-side, white 0%, rgba(255,255,255,0.95) 10%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0) 100%)"
                  }}
                ></div>
                
                {/* 색상 미리보기 포인터 (마우스 오버시) - iro.js 스타일 */}
                {hoverColor && !isDragging && (
                  <div 
                    className="absolute w-6 h-6 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10 opacity-90 transition-opacity duration-100"
                    style={{ 
                      left: `${hoverColor.x}%`, 
                      top: `${hoverColor.y}%`,
                      backgroundColor: hoverColor.color,
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 0 0 2px white, 0 2px 5px rgba(0,0,0,0.6)"
                    }}
                  ></div>
                )}
                
                {/* 색상 선택 포인터 - iro.js 스타일 */}
                <div 
                  id="color-selector"
                  className="absolute w-7 h-7 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ 
                    left: "75%", 
                    top: "65%",
                    backgroundColor: selectedColor,
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 0 0 3px white, 0 0 0 4px rgba(0,0,0,0.3)"
                  }}
                ></div>
              </div>
            </div>
            
            {/* 투명도/밝기 슬라이더 - 개선 */}
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-600 font-medium">밝기 조정</span>
                <span className="text-xs font-medium text-gray-700">{colorOpacity}%</span>
              </div>
              <div className="relative h-6">
                <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                  <div className="w-full h-full" 
                    style={{
                      background: `linear-gradient(to right, 
                        ${hslToHex(hexToHsl(selectedColor).h, hexToHsl(selectedColor).s, 10)}, 
                        ${hslToHex(hexToHsl(selectedColor).h, hexToHsl(selectedColor).s, 50)}, 
                        ${hslToHex(hexToHsl(selectedColor).h, hexToHsl(selectedColor).s, 90)})`
                    }}
                  ></div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={colorOpacity}
                  onChange={handleOpacityChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute top-0 bottom-0" style={{ 
                  left: `calc(${colorOpacity}% - 8px)`,
                  width: '16px'
                }}>
                  <div className="w-4 h-6 bg-white rounded-full shadow-md border border-gray-300"></div>
                </div>
              </div>
            </div>
            
            {/* HEX 값 입력 UI 개선 */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-14 h-12 rounded-md border border-gray-200 overflow-hidden shadow-sm">
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: selectedColor }}
                ></div>
                <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-white/20 to-black/20"></div>
              </div>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-mono font-medium">#</span>
                </div>
                <input
                  type="text"
                  value={selectedColor.replace('#', '')}
                  onChange={(e) => handleHexChange(`#${e.target.value}`)}
                  className="w-full pl-7 py-2.5 border rounded-md text-sm font-mono font-medium tracking-wider uppercase"
                  maxLength={6}
                  placeholder="RRGGBB"
                />
              </div>
            </div>
            
            {/* 저장된 색상 제목 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-700 font-medium">저장된 색상</span>
              <span className="text-xs text-gray-500">+ 버튼으로 색상 추가</span>
            </div>
            
            {/* 저장된 색상 - 파레트 확장 (24개) */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {savedColors.map((color) => (
                <div
                  key={color.id}
                  className={cn(
                    "w-9 h-9 rounded-full cursor-pointer border hover:scale-110 transition-transform duration-150 shadow-sm relative group",
                    selectedColor === color.hex ? "ring-2 ring-emerald-600 ring-offset-2" : "border-gray-200"
                  )}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleSelectSavedColor(color.hex)}
                >
                  {selectedColor === color.hex && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full hidden group-hover:flex items-center justify-center bg-black bg-opacity-20">
                    <button 
                      className="text-white text-xs font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveColor(color.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <div
                className="w-9 h-9 rounded-full cursor-pointer border border-dashed border-gray-300 hover:border-emerald-500 flex items-center justify-center transition-colors"
                onClick={handleSaveColor}
              >
                <span className="text-gray-500 text-xs font-bold">+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 특정 재질이 현재 선택되어 있는지 확인하는 함수
  const isMaterialSelected = (materialName, materialColor) => {
    // 이름으로만 비교하고 색상은 비교하지 않음
    return selectedMaterial === materialName;
  };

  // 썸네일 클릭 핸들러 수정
  const handleThumbnailClick = (moduleId, image) => {
    console.log("썸네일 클릭:", moduleId, image);
    
    // 이미 선택된 섬네일인 경우 선택 해제
    if (selectedModuleId === moduleId) {
      setSelectedModuleId(null);
      // 상위 컴포넌트에 null 전달
      onModuleSelect(null);
    } else {
      // 새로운 섬네일 선택
      setSelectedModuleId(moduleId);
      // 상위 컴포넌트에 선택한 모듈 정보 전달
      onModuleSelect({ id: moduleId, image });
    }
  };

  // 현재 선택된 탭에 따라 하위 탭 메뉴 렌더링
  const renderSubTypeMenu = () => {
    const currentSubMenu = subMenus[subTab] || [];

    return (
      <div className="border border-emerald-500 rounded-md overflow-hidden flex w-full">
        {currentSubMenu.map((type) => (
          <button
            key={type}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium",
              subTabType === type
                ? "bg-emerald-500 text-white"
                : "bg-white text-emerald-500"
            )}
            onClick={() => {
              console.log("하위 탭 변경:", type);
              setSubTabType(type);
            }}
          >
            {type}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* 왼쪽 메뉴 */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        {/* 상단 메뉴 아이템 */}
        <div className="flex-1 flex flex-col items-center gap-6">
          {menuItems.map((item) => (
            <div 
              key={item.value}
              className={cn(
                "w-12 h-12 flex flex-col items-center justify-center rounded-lg cursor-pointer text-gray-500 hover:text-emerald-500",
                activeTab === item.value && "text-emerald-500"
              )}
              onClick={() => setActiveTab(item.value)}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
        
        {/* 하단 프로필 아이템 */}
        <div className="mt-auto flex flex-col items-center gap-4">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200">
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm3.707 6.707a1 1 0 00-1.414-1.414L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 컨텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white" style={{ minWidth: "320px", width: "320px" }}>
        {activeTab === "module" ? (
          <>
            {/* 상단 탭 */}
            <div className="border-b border-gray-200 w-full">
              <div className="flex px-3 py-2 justify-center">
                <div className="border border-emerald-500 rounded-md overflow-hidden flex w-full">
                  <button
                    className={cn(
                      "flex-1 px-4 py-2 text-sm font-medium",
                      subTab === "키큰장"
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-emerald-500"
                    )}
                    onClick={() => {
                      setSubTab("키큰장");
                    }}
                  >
                    키큰장
                  </button>
                  <button
                    className={cn(
                      "flex-1 px-4 py-2 text-sm font-medium",
                      subTab === "하부장"
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-emerald-500"
                    )}
                    onClick={() => {
                      setSubTab("하부장");
                    }}
                  >
                    하부장
                  </button>
                  <button
                    className={cn(
                      "flex-1 px-4 py-2 text-sm font-medium",
                      subTab === "패널"
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-emerald-500"
                    )}
                    onClick={() => {
                      setSubTab("패널");
                    }}
                  >
                    패널
                  </button>
                </div>
              </div>
              
              <div className="flex px-3 py-2 justify-center">
                {renderSubTypeMenu()}
              </div>
            </div>

            {/* 모듈 그리드 */}
            <div className="flex-1 overflow-y-auto p-3">
              {!imagesAvailable ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p className="mb-2">아직 이미지가 등록되지 않았습니다.</p>
                    <p className="text-sm text-gray-400">곧 추가될 예정입니다.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {moduleItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col items-center"
                    >
                      <div 
                        className={`relative bg-gray-50 rounded-md border overflow-hidden w-full shadow-sm cursor-pointer ${selectedModuleId === item.id ? 'border-green-500 border-2' : 'border-gray-200'}`}
                        style={{ paddingBottom: '140%', maxWidth: '100%' }}
                        onClick={() => handleThumbnailClick(item.id, item.image)}
                      >
                        <img 
                          src={`/${item.image}`} 
                          alt={item.id}
                          className="absolute inset-0 w-full h-full object-contain p-1"
                          draggable={false}
                          onError={(e) => {
                            console.error(`Failed to load image: ${item.image}`);
                            e.currentTarget.src = "/placeholder.png";
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : activeTab === "material" ? (
          renderMaterialSection()
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="mb-2">준비 중인 기능입니다</p>
              <p className="text-sm text-gray-400">곧 추가될 예정입니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};