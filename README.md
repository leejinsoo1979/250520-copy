# 🧰 Wardrobe Configurator

누구나 쉽게 맞춤형 옷장을 설계할 수 있는 웹 기반 컨피규레이터입니다.  
공간 설정부터 프레임 구조, 모듈 구성까지 3D로 직관적으로 디자인하고 결과를 바로 도면으로 출력할 수 있습니다.

---

## 🔗 데모 체험하기

👉 [데모 바로가기](https://wardrobe-configurator-2-1-crba.vercel.app)

---

## ✨ 주요 기능

- 3단계 설계 플로우 (공간 설정 → 벽 조건 → 프레임 설정)
- 실시간 3D 시각화 (Three.js 기반)
- 프레임 두께 및 위치 커스터마이징
- JSON 기반 구조 저장 및 확장성
- 브라우저 기반 빠른 접근

---

## 🛠 기술 스택

- **Frontend**: React, Tailwind CSS
- **3D 엔진**: Three.js
- **Deployment**: Vercel
- **Version Control**: Git + GitHub

---

## 📁 프로젝트 구조 예시

```bash
📁 public/                # 정적 리소스
📁 src/
 ┣ 📁 components/         # UI 구성 요소
 ┣ 📁 pages/              # 라우팅 페이지
 ┣ 📁 three/              # 3D 렌더링 모듈
 ┗ 📄 App.tsx, main.tsx   # 엔트리 포인트
README.md
