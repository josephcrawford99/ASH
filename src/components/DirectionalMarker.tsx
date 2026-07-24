import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Marker } from 'react-native-maps';
import { DirectionalMarkerProps } from '../types/marker';

const DirectionalMarker: React.FC<DirectionalMarkerProps> = React.memo(({
  coordinate,
  number,
  direction
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Marker
      coordinate={coordinate}
      tracksViewChanges={!imageLoaded} // Only track until image loads
    >
      <View style={[styles.container, { transform: [{ rotate: `${direction}deg` }] }]}>
        <Image
          source={require('../../assets/vector.png')}
          style={styles.vectorImage}
          onLoad={() => setImageLoaded(true)}
        />
      </View>
      <View style={styles.numberContainer}>
        <Text style={styles.number}>{number}</Text>
      </View>
    </Marker>
  );
});


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  vectorImage: {
    width: 60,
    height: 60,
    marginTop: -15,
    opacity: 0.85,
    backgroundColor: 'transparent',
  },
  numberContainer: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    position: 'absolute',
    bottom: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
});

export default DirectionalMarker;
