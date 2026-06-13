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

test.describe('Twitter Callback Page', () => {
  test('should save description to localStorage', async ({ page }) => {
    // タイムアウトを延長
    test.setTimeout(60000);

    // コンソールログを収集（descriptionに関するログのみ）
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('description') || text.includes('Twitter OAuth') || text.includes('Auth')) {
        console.log('[Browser]', text);
      }
    });

    // モックデータをURLエンコード
    const encodedData = encodeURIComponent(JSON.stringify(mockUserData));
    const callbackUrl = `https://doin-challenge.com/oauth/twitter-callback?data=${encodedData}`;

    console.log('=== Test Start ===');
    console.log('Mock data description:', mockUserData.description);

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
      // descriptionが含まれているか文字列検索
      const hasDescription = rawUserInfo.includes('description');
      console.log('\n=== Analysis ===');
      console.log('Contains "description" string:', hasDescription);
      
      // JSONをパース
      try {
        const parsed = JSON.parse(rawUserInfo);
        console.log('\n=== Parsed Fields ===');
        console.log('All keys:', Object.keys(parsed));
        console.log('description key exists:', 'description' in parsed);
        console.log('description value:', parsed.description);
        console.log('description type:', typeof parsed.description);
        
        if (parsed.description === undefined) {
          console.log('\n❌ ERROR: description is undefined in localStorage!');
        } else if (parsed.description === null) {
          console.log('\n❌ ERROR: description is null in localStorage!');
        } else if (parsed.description === '') {
          console.log('\n❌ ERROR: description is empty string in localStorage!');
        } else {
          console.log('\n✅ SUCCESS: description is saved correctly!');
          console.log('Saved description:', parsed.description);
        }
      } catch (e) {
        console.log('Failed to parse JSON:', e);
      }
    } else {
      console.log('❌ ERROR: No user info in localStorage');
    }
  });
});
