#!/bin/bash
# 残りの直書き色の一括置換スクリプト

cd /home/ubuntu/birthday-celebration

# Tutorial Overlay - Confetti Colors
sed -i 's/"#4ECDC4"/color.confettiTeal/g' components/organisms/tutorial-overlay.tsx
sed -i 's/"#FFE66D"/color.confettiYellow/g' components/organisms/tutorial-overlay.tsx
sed -i 's/"#95E1D3"/color.confettiMint/g' components/organisms/tutorial-overlay.tsx
sed -i 's/"#F38181"/color.confettiCoral/g' components/organisms/tutorial-overlay.tsx

# Tutorial Overlay - Balloon Colors
sed -i 's/"#FFB3B3"/color.balloonLight/g' components/organisms/tutorial-overlay.tsx
sed -i 's/"#FFD9D9"/color.balloonLighter/g' components/organisms/tutorial-overlay.tsx
sed -i 's/"#FF4444"/color.balloonRed/g' components/organisms/tutorial-overlay.tsx
sed -i 's/"#FFCCCC"/color.balloonPink/g' components/organisms/tutorial-overlay.tsx
sed -i 's/"#FF8888"/color.balloonMedium/g' components/organisms/tutorial-overlay.tsx
sed -i 's/"#FFE0E0"/color.balloonPale/g' components/organisms/tutorial-overlay.tsx

# Tutorial Overlay - UI Colors
sed -i 's/"#4A90D9"/color.tutorialBlue/g' components/organisms/tutorial-overlay.tsx
sed -i 's/"#333333"/color.tutorialText/g' components/organisms/tutorial-overlay.tsx
sed -i 's/shadowColor: "#000"/shadowColor: color.shadowBlack/g' components/organisms/tutorial-overlay.tsx

# Experience Overlay
sed -i 's/"#1a1a2e"/color.overlayDark/g' components/organisms/experience-overlay.tsx

# Japan Heatmap - remaining colors
sed -i 's/"#333"/color.tutorialText/g' components/organisms/japan-heatmap.tsx
sed -i 's/"#CBD5E0"/color.textSubtle/g' components/organisms/japan-heatmap.tsx

# Achievements - Rarity Colors
sed -i 's/"#9CA3AF"/color.rarityCommon/g' app/achievements.tsx
sed -i 's/"#3B82F6"/color.rarityRare/g' app/achievements.tsx
sed -i 's/"#8B5CF6"/color.rarityEpic/g' app/achievements.tsx
sed -i 's/"#F59E0B"/color.rarityLegendary/g' app/achievements.tsx

# Achievement Detail
sed -i 's/"#9CA3AF"/color.rarityCommon/g' app/achievement/[id].tsx
sed -i 's/"#3B82F6"/color.rarityRare/g' app/achievement/[id].tsx
sed -i 's/"#8B5CF6"/color.rarityEpic/g' app/achievement/[id].tsx
sed -i 's/"#F59E0B"/color.rarityLegendary/g' app/achievement/[id].tsx

echo "Remaining colors replacement completed!"
