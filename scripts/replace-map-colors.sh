#!/bin/bash
# 地図・ヒートマップ・レアリティ色の一括置換スクリプト

cd /home/ubuntu/birthday-celebration

# Japan Block Map - Region Colors
sed -i 's/"#4FC3F7"/color.regionHokkaido/g' components/organisms/japan-block-map.tsx
sed -i 's/"#B39DDB"/color.regionTohoku/g' components/organisms/japan-block-map.tsx
sed -i 's/"#81C784"/color.regionKanto/g' components/organisms/japan-block-map.tsx
sed -i 's/"#FFF176"/color.regionChubu/g' components/organisms/japan-block-map.tsx
sed -i 's/"#FFB74D"/color.regionKansai/g' components/organisms/japan-block-map.tsx
sed -i 's/"#F48FB1"/color.regionChugokuShikoku/g' components/organisms/japan-block-map.tsx
sed -i 's/"#EF5350"/color.regionKyushuOkinawa/g' components/organisms/japan-block-map.tsx
sed -i 's/"#FF6B6B"/color.mapHighlight/g' components/organisms/japan-block-map.tsx

# Japan Deformed Map - Region Colors
sed -i 's/"#4FC3F7"/color.regionHokkaido/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#B39DDB"/color.regionTohoku/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#81C784"/color.regionKanto/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#FFF176"/color.regionChubu/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#FFB74D"/color.regionKansai/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#F48FB1"/color.regionChugoku/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#CE93D8"/color.regionShikoku/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#EF5350"/color.regionKyushu/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#FF8A65"/color.regionOkinawa/g' components/organisms/japan-deformed-map.tsx

# Japan Deformed Map - Border Colors
sed -i 's/"#0288D1"/color.borderHokkaido/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#7B1FA2"/color.borderTohoku/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#388E3C"/color.borderKanto/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#FBC02D"/color.borderChubu/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#F57C00"/color.borderKansai/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#C2185B"/color.borderChugoku/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#8E24AA"/color.borderShikoku/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#C62828"/color.borderKyushu/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#E64A19"/color.borderOkinawa/g' components/organisms/japan-deformed-map.tsx

# Japan Deformed Map - Heat Intensity Colors
sed -i 's/"#3A3F47"/color.mapInactive/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#FF7043"/color.heatIntense1/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#FF5722"/color.heatIntense2/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#F44336"/color.heatIntense3/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#D32F2F"/color.heatIntense4/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#B71C1C"/color.heatIntense5/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#F4511E"/color.heatIntenseBorder1/g' components/organisms/japan-deformed-map.tsx
sed -i 's/"#7F0000"/color.heatIntenseBorder5/g' components/organisms/japan-deformed-map.tsx

# Japan Heatmap - Heatmap Colors
sed -i 's/"#E8D4D4"/color.heatmapNone/g' components/organisms/japan-heatmap.tsx
sed -i 's/"#FFF9C4"/color.heatmapLevel1/g' components/organisms/japan-heatmap.tsx
sed -i 's/"#FFEB3B"/color.heatmapLevel2/g' components/organisms/japan-heatmap.tsx
sed -i 's/"#FFCC80"/color.heatmapLevel3/g' components/organisms/japan-heatmap.tsx
sed -i 's/"#FF9800"/color.heatmapLevel4/g' components/organisms/japan-heatmap.tsx
sed -i 's/"#F57C00"/color.heatmapLevel5/g' components/organisms/japan-heatmap.tsx
sed -i 's/"#E53935"/color.heatmapLevel6/g' components/organisms/japan-heatmap.tsx
sed -i 's/"#B71C1C"/color.heatmapLevel7/g' components/organisms/japan-heatmap.tsx

# Japan Heatmap - Map UI
sed -i 's/"#A8D5E5"/color.mapWater/g' components/organisms/japan-heatmap.tsx
sed -i 's/"#666666"/color.mapStroke/g' components/organisms/japan-heatmap.tsx
sed -i 's/"#333333"/color.mapText/g' components/organisms/japan-heatmap.tsx

# Overlay Colors
sed -i 's/"#1a1a2e"/color.overlayDark/g' components/organisms/experience-overlay.tsx
sed -i 's/"#1a1a2e"/color.overlayText/g' components/organisms/tutorial-overlay.tsx

# Growth Trajectory Chart
sed -i 's/"#FF8E53"/color.orange400/g' components/organisms/growth-trajectory-chart.tsx
sed -i 's/"#333333"/color.mapText/g' components/organisms/growth-trajectory-chart.tsx

echo "Map colors replacement completed!"
