# S9 Gate: LCP 再ペイント仮説の裏取り

**日付:** 2026-07-02
**担当:** Claude（実装フェーズ）
**PLAN:** docs/pagespeed-100-PLAN.md v2 §4-A Gate

## 仮説
LCP要素（`post-guest-screen.tsx:52` heroSub）はSSG HTMLに存在するのに、PSIのLCP phase Render Delay 97%。=ハイドレーション後の再ペイントでLCPが記録され、それが計測ブレ(97↔63↔69)の正体。

## 裏取り結果: 仮説成立（実コードで確定）

**mismatch源 = `lib/theme-provider.tsx:88-92, 109-122`**

```
// theme-provider.tsx
const [nativeWindStyle, setNativeWindStyle] = useState<ViewStyle|undefined>(undefined);
// window.load後（deferNativeWind時）に発火:
if (deferNativeWind) return scheduleAfterWindowLoad(loadNativeWind);  // L88-89
// loadNativeWind → setNativeWindStyle(vars({...9 CSS vars...}))     // L72-84
const shellStyle = useMemo(() => ({ flex:1, backgroundColor, ...(nativeWindStyle ?? {}) }), [nativeWindStyle]); // L109-116
return <View style={shellStyle}>{children}</View>;  // ルート直下View L120
```

### メカニズム（観測と完全一致）
1. SSG時: `nativeWindStyle=undefined` → `<View style={{flex:1,backgroundColor}}>`
2. クライアント初回: 同じく undefined → **SSG DOMと一致（mismatchなし・FCPは速い0.9s）**
3. **`window.load`後に `loadNativeWind()` 発火 → `setNativeWindStyle(vars(...))` → ルートViewのstyleが変化 → hero含む全ツリー再ペイント**
4. この再ペイント時刻(=JS完了・throttlingで激変)がLCPとして記録される

### 冗長性の証拠
`vars()` が注入するCSS変数は、初回同期の `applyDocumentTheme()`(L66, `document.documentElement.style.setProperty`)で既に設定済み。
→ ルート`<View>`への `...nativeWindStyle` 二重適用は視覚的に不要で、LCPを後ろへ飛ばすだけ。

### LCP phase 内訳（pagespeed-report.json）
TTFB 3% / Load Delay 0 / Load Time 0 / **Render Delay 97%(17.3s/17.9s)** → Render Delay支配 = JS後の再ペイントで確定、を裏付け。

## Gate 判定: **通過**（再生成＝再ペイント確認済み）→ S9 実装へ

## 直し方（§4-C 原則「クライアント初回をSSG出力に合わせる/HTML足さない」に従う）
ルート`<View>`から `...nativeWindStyle` の後付けを外す。CSS変数は `applyDocumentTheme()` が documentElement に設定済みなので、NativeWind の `vars()` をルートViewへ二重注入しない。
= state変化によるルート再ペイントを消し、LCPを初回paint(FCP)で確定させる。
