const fs = require('fs');

const svgStr = fs.readFileSync('japan.svg', 'utf8');

// A very basic find/replace to make it compatible with react-native-svg
let componentStr = svgStr
  .replace(/<\?xml.*\?>/g, '')
  .replace(/<svg.*?>/g, '')
  .replace(/<\/svg>/g, '')
  .replace(/<title>.*?<\/title>/g, '')
  .replace(/<desc>.*?<\/desc>/g, '')
  .replace(/class=/g, 'id=')
  .replace(/data-code=/g, 'dataCode=')
  .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
  .replace(/fill-rule=/g, 'fillRule=')
  .replace(/stroke-width=/g, 'strokeWidth=')
  .replace(/<g/g, '<G')
  .replace(/<\/g>/g, '</G>')
  .replace(/<path/g, '<Path')
  .replace(/<polygon/g, '<Polygon')
  .replace(/<line/g, '<Line')
  // remove empty style=""
  .replace(/style=""/g, '')
  // simple react wrapper
  ;

const finalComponent = `import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Polygon, Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { color } from '@/theme/tokens';

export function JapanRadarMap({ children }: { children?: React.ReactNode }) {
  // Radar sweep animation
  const rotation = useSharedValue(0);
  
  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedRadarStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: \`\${rotation.value}deg\` }],
  }));

  return (
    <View style={styles.container}>
      {/* Map SVG */}
      <Svg viewBox="0 0 1000 1000" style={styles.map}>
        ${componentStr}
      </Svg>
      
      {/* Radar sweeping effect */}
      <View style={styles.radarContainer}>
        <Animated.View style={[styles.radarSweep, animatedRadarStyle]} />
      </View>

      {/* Markers / Children */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  map: {
    width: '150%',
    height: '150%',
    position: 'absolute',
    opacity: 0.3, // dark neon vibe
  },
  radarContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  radarSweep: {
    width: 2000,
    height: 2000,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(0, 66, 123, 0.2)', // Kimito-link blue
    backgroundColor: 'transparent',
    borderTopColor: color.accentAlt,
    borderTopWidth: 2,
  }
});
`;

fs.writeFileSync('components/organisms/japan-radar-map.tsx', finalComponent);
console.log('Done converting SVG!');
