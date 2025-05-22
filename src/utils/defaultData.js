/**
 * 기본 디자인 데이터를 반환하는 함수
 * @returns {Object} 기본 디자인 데이터 객체
 */
export const getDefaultDesignData = () => {
  return {
    id: `design_${Date.now()}`,
    title: "새 디자인",
    category: "옷장",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      spaceInfo: {
        width: 4800,
        depth: 580,
        height: 2400,
        spaceType: "built-in",
        wallPosition: "left",
        hasAirConditioner: "no",
        hasFloorFinish: "no",
        floorThickness: 20
      },
      frameSettings: {
        color: "#F8F8F8"
      },
      baseSettings: {
        hasBase: true,
        baseHeight: 80
      },
      doorCount: 8,
      sizeSettings: {
        left: 50,
        right: 50,
        top: 50,
        bottom: 50
      },
      placementSettings: {
        type: "floor",
        raiseHeight: 30
      },
      fitOption: "normal"
    }
  };
}; 