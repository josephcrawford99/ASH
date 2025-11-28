import React from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType } from 'react-native';

const vectorImage: ImageSourcePropType = require('@/assets/vector.png');

interface KeyVectorProps {
  number: number;
  direction?: number | null;
  size?: number;
}

export function KeyVector({ number, direction, size = 44 }: KeyVectorProps) {
  const rotation = direction ?? 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={vectorImage}
        style={[
          styles.image,
          { width: size, height: size, transform: [{ rotate: `${rotation}deg` }] },
        ]}
        resizeMode="contain"
      />
      <Text style={[styles.number, { fontSize: size * 0.32 }]}>{number}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
  },
  number: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
});
