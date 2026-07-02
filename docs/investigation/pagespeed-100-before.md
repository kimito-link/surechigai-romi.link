# PageSpeed 100 Plan - Before Snapshot

Date: 2026-07-02

## PageSpeed mobile baseline

Target command: `pnpm pagespeed`

The previous plan baseline is stale after the Fable redesign deployment. Current production is faster on LCP, but still below the `performance >= 90` gate because unused JS, TBT, and TTI remain high.

| Run | Score | FCP | LCP | TBT | CLS | SI | TTI | Unused JS | Total byte weight | Legacy JS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| 1 | 85 | 1.3 s | 1.3 s | 470 ms | 0.003 | 4.5 s | 19.1 s | 2,259 KiB savings | 3,950 KiB | 27 KiB savings |
| 2 | 88 | 1.3 s | 1.3 s | 420 ms | 0.006 | 3.9 s | 19.4 s | 2,259 KiB savings | 3,950 KiB | 27 KiB savings |
| 3 | 85 | 1.3 s | 1.3 s | 510 ms | 0.006 | 4.0 s | 19.0 s | 2,259 KiB savings | 3,950 KiB | 27 KiB savings |

Median score: 85.

Artifacts:

- `docs/investigation/pagespeed-before-1.json`
- `docs/investigation/pagespeed-before-2.json`
- `docs/investigation/pagespeed-before-3.json`

## Atlas before snapshot

Commands:

- `EXPO_ATLAS=1 npx expo export --platform web`
- `npx expo-atlas --help`

Atlas data source: `.expo/atlas.jsonl`

Largest web chunks by file size:

| Chunk | File size | Modules | Source size |
| --- | ---: | ---: | ---: |
| `clerk-root-provider` | 5,280.5 KiB | 134 | 5,278.3 KiB |
| `__common` | 2,179.3 KiB | 904 | 2,128.0 KiB |
| `entry` | 962.8 KiB | 676 | 947.0 KiB |
| `index` | 699.3 KiB | 279 | 691.9 KiB |
| root `_layout` | 268.3 KiB | 147 | 257.2 KiB |

Top 20 `__common` modules by source size:

| Rank | Size | Package | Module |
| ---: | ---: | --- | --- |
| 1 | 189.1 KiB | `h3-js` | `dist/browser/h3-js.es.js` |
| 2 | 67.5 KiB | `@clerk/react` | `dist/index.js` |
| 3 | 59.3 KiB | `@clerk/react` | `dist/internal.js` |
| 4 | 44.0 KiB | `@expo/vector-icons` | `MaterialIcons.json` |
| 5 | 39.8 KiB | `@clerk/shared` | `dist/react/index.js` |
| 6 | 34.9 KiB | `@trpc/server` | `resolveResponse-D7zvnoIM.mjs` |
| 7 | 21.4 KiB | `tailwind-merge` | `bundle-mjs.mjs` |
| 8 | 20.7 KiB | `react-native-reanimated` | `animation/util.js` |
| 9 | 20.6 KiB | `buffer` | `index.js` |
| 10 | 19.5 KiB | `react-native-reanimated` | `defaultAnimations/Zoom.js` |
| 11 | 18.5 KiB | `react-native-reanimated` | `Colors.js` |
| 12 | 18.1 KiB | `react-native-reanimated` | `index.js` |
| 13 | 17.7 KiB | `@trpc/react-query` | `shared-JtnEvJvB.mjs` |
| 14 | 16.9 KiB | app | `components/events/events-guest-content.tsx` |
| 15 | 16.5 KiB | `react-native-reanimated` | `matrixUtils.js` |
| 16 | 16.2 KiB | `react-native-reanimated` | `spring.js` |
| 17 | 16.1 KiB | `react-native-reanimated` | `defaultAnimations/Flip.js` |
| 18 | 16.1 KiB | `@trpc/client` | `dist/index.mjs` |
| 19 | 16.1 KiB | `whatwg-url-without-unicode` | `url-state-machine.js` |
| 20 | 15.3 KiB | `react-native-reanimated` | `defaultAnimations/Bounce.js` |

Top 10 `entry` modules by source size:

| Rank | Size | Package | Module |
| ---: | ---: | --- | --- |
| 1 | 164.4 KiB | `react-dom` | `react-dom-client.production.js` |
| 2 | 26.6 KiB | `react-native-web` | `VirtualizedList/index.js` |
| 3 | 11.8 KiB | `expo-router` | `react-helmet-async/lib/index.js` |
| 4 | 9.8 KiB | `react-native-web` | `Touchable/index.js` |
| 5 | 9.2 KiB | `react-native-web` | `ScrollView/index.js` |
| 6 | 8.9 KiB | `@react-navigation/core` | `useNavigationBuilder.js` |
| 7 | 8.6 KiB | `color-convert` | `conversions.js` |
| 8 | 8.4 KiB | `react-native-web` | `createDOMProps/index.js` |
| 9 | 8.3 KiB | `expo-router` | `getRoutesCore.js` |
| 10 | 7.6 KiB | `react-native-web` | `NativeAnimatedHelper.js` |

Library placement:

- `react-native-reanimated`: `__common`
- `react-native-gesture-handler`: root `_layout`
- `@tanstack/react-query`: `clerk-root-provider`, `__common`
- `@tanstack/query-core`: `__common`
- `@expo/vector-icons`: `clerk-root-provider`, `__common`, `MaterialIcons`
- `expo-modules-core`: `entry`
- `expo-font`: `__common`
- `expo-image`: `__common`
- `expo-linking`: `entry`, `index`
- `expo-router`: `__common`, `entry`

Authenticated chunk sizes:

| Chunk | File size | Modules | Source size |
| --- | ---: | ---: | ---: |
| `clerk-root-provider` | 5,280.5 KiB | 134 | 5,278.3 KiB |
| `mypage-authenticated-screen` | 47.8 KiB | 7 | 47.3 KiB |
| `checkin-authenticated-screen` | 37.8 KiB | 5 | 37.5 KiB |
| `post-authenticated-screen` | 22.9 KiB | 4 | 6.8 KiB |
| `global-menu` | 21.1 KiB | 3 | 20.9 KiB |
| `tab-authenticated-extras` | 19.9 KiB | 14 | 19.6 KiB |
| `events-host-panel` | 19.1 KiB | 3 | 2.4 KiB |
| `zukan-authenticated-screen` | 13.2 KiB | 1 | 13.1 KiB |
| `events-authenticated-screen` | 6.4 KiB | 0 | 0.0 KiB |
| `event-datetime-picker` | 5.5 KiB | 1 | 5.5 KiB |
| `map-authenticated-screen` | 4.0 KiB | 1 | 4.0 KiB |

Gate conclusion: the `__common` hypothesis is confirmed. Continue with modern browser output, authenticated lazy boundaries, and authenticated chunk consolidation.
