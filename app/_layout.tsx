import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Asset } from 'expo-asset';
import { MaterialIcons } from '@expo/vector-icons';

export default function RootLayout() {
  useEffect(() => {
    const preloadAssets = async () => {
      await Asset.loadAsync(require('../assets/vector.png'));
    };
    preloadAssets();
  }, []);

  return (
    <Tabs>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Photos',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="photo-library" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="mapview" 
        options={{ 
          title: 'Map',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="map" size={size} color={color} />
        }} 
      />
    </Tabs>
  );
}