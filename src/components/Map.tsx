import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import DirectionalMarker from './DirectionalMarker';
import { MarkerData } from '../types/marker';
import { PhotoData } from '../types/photo';
import { photoStore } from '../store/photoStore';

interface MapProps {
  style?: any;
}

const Map: React.FC<MapProps> = ({ style }) => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const mapRef = useRef<MapView>(null);

  const initialRegion = {
    latitude: 39.8283,
    longitude: -98.5795,
    latitudeDelta: 50,
    longitudeDelta: 65,
  };

  useEffect(() => {
    const unsubscribe = photoStore.subscribe(() => {
      const newPhotos = photoStore.getPhotos();
      setPhotos(newPhotos);
    });

    const initialPhotos = photoStore.getPhotos();
    setPhotos(initialPhotos);
    return unsubscribe;
  }, []);

  const gpsPhotos = useMemo(() => photos.filter(item => item.hasGPS), [photos]);

  const markers: MarkerData[] = useMemo(() => {
    return gpsPhotos.map((item, index) => ({
      latitude: item.latitude!,
      longitude: item.longitude!,
      direction: item.direction ?? 0,
      number: index + 1
    }));
  }, [gpsPhotos]);

  useEffect(() => {
    if (markers.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        markers.map(m => ({ latitude: m.latitude, longitude: m.longitude })),
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
    }
  }, [markers]);

  return (
    <>
      {/* Markers only show if this button is on the page for some reason */}
      <View style={{ position: 'absolute', top: 50, right: 10, zIndex: 1000 }}>
          <TouchableOpacity
            onPress={() => {
              if (mapRef.current && markers.length > 0) {
                mapRef.current.fitToCoordinates(
                  markers.map(m => ({ latitude: m.latitude, longitude: m.longitude })),
                  {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                  }
                );
              }
            }}
            style={{ backgroundColor: 'white', padding: 10, borderRadius: 5 }}
          >
            <Text>Zoom to Markers</Text>
          </TouchableOpacity>
      </View>
      <MapView
        ref={mapRef}
        style={[styles.map, style]}
        mapType="satellite"
        rotateEnabled={false}
        initialRegion={initialRegion}
      >
        {gpsPhotos.map((photo, index) => {
          const marker = markers[index];
          return (
            <DirectionalMarker
              key={photo.asset.uri}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude
              }}
              number={marker.number}
              direction={marker.direction}
            />
          );
        })}
      </MapView>
    </>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',

  }
});

export default Map;
