# PDF to PPTX Converter (v2)

본 프로젝트는 PDF 파일을 분석하여 편집 가능한 파워포인트(PPTX) 파일로 변환하는 웹 애플리케이션입니다. Google AI Studio Build 환경에서 개발된 코드를 로컬 환경에 최적화하여 구성되었습니다.

## 🛠 Technical Specifications

### Core Stack & Libraries

- **Frontend**: React (v19), TypeScript, Vite (v6)
- **PDF Engine**: [pdfjs-dist](https://github.com/mozilla/pdf.js) (v5.4.530)
  - 서버사이드 의존성 없이 브라우저에서 직접 PDF를 렌더링합니다.
- **AI SDK**: [@google/genai](https://www.npmjs.com/package/@google/genai) (v1.37.0)
  - Gemini 3.0 Pro/Flash 모델과의 통신을 담당하는 최신 Google AI SDK입니다.
- **PPTX Engine**: [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) (v4.0.1)
  - 객체 지향 방식으로 파워포인트 파일을 생성합니다.

### Image Extraction Settings (`pdfService.ts`)

- **Render Scale**: `2.0` (AI 분석용 고해상도 추출)
- **Format**: `image/jpeg` (Quality: 0.8)
- **Workflow**: PDF 각 페이지를 Canvas로 렌더링 후 Base64 데이터로 변환하여 AI에 전달합니다.

### AI Configuration (`geminiService.ts`)

- **Model**: `gemini-3-pro-preview`
- **Temperature**: `0.0` (좌표 인식의 정밀도 및 결정론적 응답 보장)
- **Media Resolution**: `MediaResolution.MEDIA_RESOLUTION_HIGH` (고해상도 이미지 분석 활성화)
- **Response Format**: `application/json` (Schema-based parsing)

### PPTX Generation Details (`pptxService.ts`)

- **Layout**: `16:9` (Standard Widescreen)
- **Asset Preservation**: AI가 이미지로 판별한 요소는 원본 슬라이드에서 해당 영역을 **자동 크롭(Crop)**하여 삽입함으로써 시각적 품질을 원본 그대로 유지합니다.
- **Typography**: `Noto Sans KR` (한국어 가독성 최적화)

---

## 🚀 Run Locally

**Prerequisites:** Node.js

1. **의존성 설치**:
   ```bash
   npm install
   ```
2. **환경 변수 설정**:
   `.env` 파일의 `VITE_GOOGLE_API_KEY` 항목에 Gemini API 키를 입력합니다.
3. **앱 실행**:
   ```bash
   npm run dev
   ```
