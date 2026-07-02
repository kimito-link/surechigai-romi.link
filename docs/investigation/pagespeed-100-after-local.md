# PageSpeed 100 Plan - Local After Snapshot

Date: 2026-07-02

Commands:

- `npx browserslist`
- `pnpm run check`
- `EXPO_ATLAS=1 npx expo export --platform web`
- `Select-String -Path 'dist\_expo\static\js\web\*.js' -Pattern '_classCallCheck|regeneratorRuntime|_asyncToGenerator'`

## Verification notes

- `npx browserslist` resolves to Chrome/Edge/Firefox 100+, Safari/iOS 15.4+.
- No `_classCallCheck`, `regeneratorRuntime`, or `_asyncToGenerator` match was found in exported web JS bundles.
- `react-native-gesture-handler` did not appear in the client chunk scan after the root provider changes, so no extra `GestureRoot` lazy boundary was added.
- After the first production PageSpeed pass, `IconSymbol` was changed to use the existing platform-aware MaterialIcons wrapper. This avoids the initial direct `@expo/vector-icons/MaterialIcons` web font request when SVG path data is available for the tab icons.

## Atlas after snapshot

Largest web chunks by file size:

| Chunk | File size | Modules | Source size |
| --- | ---: | ---: | ---: |
| `clerk-root-provider` | 5,280.5 KiB | 133 | 5,269.7 KiB |
| `__common` | 2,170.4 KiB | 762 | 1,657.2 KiB |
| `entry` | 962.5 KiB | 608 | 900.8 KiB |
| `index` | 699.3 KiB | 279 | 690.6 KiB |
| `onboarding-gate` | 252.2 KiB | 10 | 17.3 KiB |
| `authenticated-screen-funnel` | 142.0 KiB | 23 | 103.3 KiB |
| root `_layout` | 16.3 KiB | - | - |

Comparison against before:

| Item | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `__common` file size | 2,179.3 KiB | 2,170.4 KiB | -8.9 KiB |
| `__common` source size | 2,128.0 KiB | 1,657.2 KiB | -470.8 KiB |
| `entry` file size | 962.8 KiB | 962.5 KiB | -0.3 KiB |
| root `_layout` file size | 268.3 KiB | 16.3 KiB | -252.0 KiB |
| auth screen chunks | 6 separate chunks, 112.9 KiB total | 1 funnel chunk, 142.0 KiB | +29.1 KiB request payload, fewer auth requests |

Top `__common` modules after:

| Rank | Size | Package | Module |
| ---: | ---: | --- | --- |
| 1 | 66.2 KiB | `@clerk/react` | `dist/index.js` |
| 2 | 58.1 KiB | `@clerk/react` | `dist/internal.js` |
| 3 | 44.0 KiB | `@expo/vector-icons` | `MaterialIcons.json` |
| 4 | 39.6 KiB | `@clerk/shared` | `dist/react/index.js` |
| 5 | 21.4 KiB | `tailwind-merge` | `bundle-mjs.mjs` |
| 6 | 20.7 KiB | `react-native-reanimated` | `animation/util.js` |
| 7 | 20.6 KiB | `buffer` | `index.js` |
| 8 | 19.5 KiB | `react-native-reanimated` | `defaultAnimations/Zoom.js` |
| 9 | 18.5 KiB | `react-native-reanimated` | `Colors.js` |
| 10 | 18.1 KiB | `react-native-reanimated` | `index.js` |

Rejected intermediate attempt:

- A naive `authenticated-screens.ts` re-export funnel produced a tiny `authenticated-screens` chunk and moved screen modules into `__common` (`__common` rose to about 2.37 MB). It was replaced with a single loader plus `authenticated-screen-funnel` and `prefetch-tab-data.ts` was updated to remove the remaining individual dynamic imports.

## Production PageSpeed after first deploy

Production commit: `b769c2b2c238c2b54e6c08a8aba55f1cca89a305`

| Run | Score | FCP | LCP | TBT | CLS | SI | TTI | Total byte weight | Unused JS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 1 | 84 | 1.5 s | 1.5 s | 460 ms | 0.006 | 5.0 s | 18.1 s | 3,688 KiB | 2,260 KiB savings |
| 2 | 87 | 1.4 s | 1.4 s | 420 ms | 0.003 | 4.2 s | 18.2 s | 3,688 KiB | 2,260 KiB savings |
| 3 | 90 | 1.3 s | 1.3 s | 340 ms | 0.003 | 3.8 s | 18.1 s | 3,688 KiB | 2,260 KiB savings |

Median score: 87. Best run: 90. The target command can pass, but the score is still variance-sensitive. The largest remaining avoidable transfer in this deployment was the initial 349 KiB MaterialIcons font request, which the follow-up `IconSymbol` change targets.
