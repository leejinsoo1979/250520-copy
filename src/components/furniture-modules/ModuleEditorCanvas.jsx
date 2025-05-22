  return (
    <div className="w-full h-full relative">
      <div 
        className={`w-full h-full ${dropMode ? 'bg-blue-50' : ''} transition-colors duration-200`}
        style={{ 
          position: 'relative',
          outline: dropMode ? '2px dashed #3b82f6' : 'none',
          boxShadow: dropMode ? 'inset 0 0 5px rgba(59, 130, 246, 0.5)' : 'none'
        }}
      >
        {/* 드롭 가능 영역 표시 */}
        {dropMode && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-blue-500 font-medium text-lg">
              모듈을 여기에 드롭하세요
            </span>
          </div>
        )}
        
        {/* 슬롯 구분선 */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: doorCount + 1 }).map((_, i) => (
            <div 
              key={`slot-line-${i}`}
              style={{
                position: 'absolute',
                left: `${(i / doorCount) * 100}%`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: i === 0 || i === doorCount ? '#e53e3e' : '#cbd5e0',
                zIndex: 1,
                opacity: i === 0 || i === doorCount ? 0.8 : 0.4
              }}
            />
          ))}
        </div>
        
        {/* 슬롯 호버 가이드 영역 */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${doorCount}, 1fr)` }}>
          {Array.from({ length: doorCount }).map((_, i) => {
            const status = slotStatuses[i] || 'empty';
            
            return (
              <div
                key={`slot-hover-${i}`}
                className="h-full flex items-center justify-center"
                style={{ 
                  background: 
                    status === 'hover' ? 'rgba(56, 189, 248, 0.1)' : 
                    status === 'highlight' ? 'rgba(59, 130, 246, 0.15)' :
                    status === 'selected' ? 'rgba(16, 185, 129, 0.1)' :
                    status === 'occupied' ? 'rgba(236, 72, 153, 0.05)' :
                    'transparent',
                  transition: 'background 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={() => onSlotHover && onSlotHover(i, true)}
                onMouseLeave={() => onSlotHover && onSlotHover(i, false)}
                onClick={() => onSlotClick && onSlotClick(i)}
              >
                {/* 슬롯 번호 */}
                <span 
                  className="absolute top-2 text-xs font-medium select-none pointer-events-none"
                  style={{ 
                    color: 
                      status === 'hover' ? '#0284c7' : 
                      status === 'highlight' ? '#2563eb' :
                      status === 'selected' ? '#059669' :
                      status === 'occupied' ? '#db2777' :
                      '#94a3b8'
                  }}
                >
                  {i + 1}
                </span>
                
                {/* 배치된 모듈이 있을 때 표시 */}
                {status === 'occupied' && (
                  <div className="absolute inset-0 border-2 border-pink-500 border-opacity-30 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* 캔버스 */}
        <Canvas
          camera={{ 
            position: [0, 2, 5], 
            fov: 60, 
            near: 0.1, 
            far: 1000,
            lookAt: [0, 0, 0]
          }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <gridHelper args={[10, 10, '#999', '#555']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} />
          <OrbitControls />
          
          {/* 바닥 메시 */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -0.01, 0]} 
            receiveShadow
          >
            <planeGeometry args={[dimensions.width / 1000, dimensions.depth / 1000]} />
            <meshStandardMaterial color="#f1f5f9" />
          </mesh>
          
          {/* 모듈 슬롯 */}
          <ModuleSlots
            totalWidth={dimensions.width}
            slotCount={doorCount}
            slotStatuses={slotStatuses}
            onSlotHover={onSlotHover}
            onSlotClick={onSlotClick}
            highlightSlot={highlightSlot}
          />
          
          {/* 배치된 모듈들 */}
          {placedModules.map((module, index) => (
            <ModuleRenderer
              key={`module-${module.id}-${index}`}
              module={module}
              position={[module.position.x / 1000, module.position.y / 1000, module.position.z / 1000]}
              isSelected={false}
              isHovered={false}
            />
          ))}
          
          {/* 고스트 모듈 (미리보기) */}
          {ghostModule && (
            <ModuleRenderer
              module={ghostModule}
              position={[ghostModule.position.x / 1000, ghostModule.position.y / 1000, ghostModule.position.z / 1000]}
              isSelected={false}
              isHovered={true}
              isGhost={true}
            />
          )}
          
          {children}
        </Canvas>
      </div>
    </div>
  ); 