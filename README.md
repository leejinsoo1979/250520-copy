# 🧰 Wardrobe Configurator

맞춤형 옷장을 누구나 쉽게 설계할 수 있는 웹 기반 컨피규레이터입니다.  
공간 치수 입력부터 프레임 조정, 모듈 구성까지 실시간 시각화로 구현되며, 설계 결과는 바로 도면 출력도 가능합니다.

---

## 🔗 데모 바로가기

👉 [https://wardrobe-configurator-2-1-crba.vercel.app](https://wardrobe-configurator-2-1-crba.vercel.app)

---

## ✨ 주요 기능

- 3단계 디자인 프로세스 (공간 입력 → 벽 옵션 → 프레임 설정)
- 실시간 3D 뷰어 (Three.js 기반)
- 옷장 모듈 시각화 및 구성 저장
- JSON 기반 설계 데이터 생성
- Vercel을 통한 빠른 배포 및 접근성 확보

---

## 🛠 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript (React)
- **3D 엔진**: Three.js
- **배포**: Vercel
- **형상관리**: Git + GitHub

---

## 📂 프로젝트 구조

```bash
📁 /public           # 정적 파일
📁 /src
 ┣ 📁 components     # UI 및 편집 컴포넌트
 ┣ 📁 pages          # 라우트 페이지
 ┗ 📁 three          # 3D 뷰어 로직
📄 index.html
📄 README.md
