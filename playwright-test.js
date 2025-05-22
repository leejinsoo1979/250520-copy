const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 로컬 개발 서버에 접속
    console.log('로컬 서버에 접속 중...');
    await page.goto('http://localhost:3001');
    
    // 페이지 로딩 대기
    console.log('페이지 로딩 완료 대기 중...');
    await page.waitForLoadState('networkidle');
    
    console.log('페이지 접속 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'initial-page.png', fullPage: true });
    console.log('초기 화면 스크린샷 저장: initial-page.png');
    
    // 10초 대기
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
    // 오류 발생 시에도 스크린샷 캡처
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('오류 스크린샷 저장: error-screenshot.png');
  } finally {
    console.log('테스트 완료, 브라우저 종료');
    await browser.close();
  }
})();
