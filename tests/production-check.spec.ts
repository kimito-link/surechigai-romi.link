import { test, expect } from '@playwright/test';

// テスト用のモックデータ（実際のTwitter認証データと同じ形式）
const mockUserData = {
  twitterId: "1781090940826066945",
  name: "君斗りんく＠クリエイター応援",
  username: "streamerfunch",
  profileImage: "https://pbs.twimg.com/profile_images/1890275406290513922/kewXCUOt_400x400.jpg",
  followersCount: 451,
  followingCount: 498,
  description: "はろー！君斗りんくなのだ🎶配信者•クリエイターの収益アップを目的に、ボクの作ったYouTube動画やコンテンツで配信者さん達を応援しているのだ📣",
  accessToken: "test_access_token",
  refreshToken: "test_refresh_token",
  isFollowingTarget: false,
  targetAccount: null
};

test.describe('Production Environment Check', () => {
  test('should verify description is saved and displayed on mypage', async ({ page }) => {
    // タイムアウトを延長
    test.setTimeout(90000);

    // コンソールログを収集
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('description') || text.includes('Twitter OAuth') || text.includes('Auth') || text.includes('useAuth')) {
        console.log('[Browser]', text);
      }
    });

    // モックデータをURLエンコード
    const encodedData = encodeURIComponent(JSON.stringify(mockUserData));
    const callbackUrl = `https://doin-challenge.com/oauth/twitter-callback?data=${encodedData}`;

    console.log('=== Test Start ===');
    console.log('Testing production site: doin-challenge.com');

    // twitter-callbackページに直接アクセス
    await page.goto(callbackUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // ページのJavaScriptが実行されるまで待機
    await page.waitForTimeout(5000);

    // localStorageの生の値を取得
    const rawUserInfo = await page.evaluate(() => {
      return window.localStorage.getItem('manus-runtime-user-info');
    });

    console.log('\n=== Raw localStorage Value ===');
    console.log(rawUserInfo);

    if (rawUserInfo) {
      // JSONをパース
      try {
        const parsed = JSON.parse(rawUserInfo);
        console.log('\n=== Parsed Fields ===');
        console.log('All keys:', Object.keys(parsed));
        console.log('description key exists:', 'description' in parsed);
        console.log('description value:', parsed.description);
        
        if (parsed.description) {
          console.log('\n✅ SUCCESS: description is saved in localStorage!');
        } else {
          console.log('\n❌ ERROR: description is missing from localStorage!');
        }
      } catch (e) {
        console.log('Failed to parse JSON:', e);
      }
    } else {
      console.log('❌ ERROR: No user info in localStorage');
    }

    // マイページに移動してdescriptionが表示されているか確認
    console.log('\n=== Checking MyPage ===');
    await page.goto('https://doin-challenge.com/mypage', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // マイページのHTMLを取得
    const pageContent = await page.content();
    const hasDescriptionInPage = pageContent.includes(mockUserData.description.substring(0, 20));
    console.log('Description visible on page:', hasDescriptionInPage);

    // スクリーンショットを保存
    await page.screenshot({ path: '/home/ubuntu/birthday-celebration/tests/mypage-screenshot.png', fullPage: true });
    console.log('Screenshot saved to: tests/mypage-screenshot.png');

    // localStorageの最終状態を確認
    const finalUserInfo = await page.evaluate(() => {
      return window.localStorage.getItem('manus-runtime-user-info');
    });

    console.log('\n=== Final localStorage Value (after mypage load) ===');
    if (finalUserInfo) {
      const parsed = JSON.parse(finalUserInfo);
      console.log('description key exists:', 'description' in parsed);
      console.log('description value:', parsed.description);
    }
  });
});
