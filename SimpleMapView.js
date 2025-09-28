import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Simple fallback map component for demo purposes
const SimpleMapView = ({ children, style, initialRegion, ...props }) => {
  return (
    <View style={[styles.mapContainer, style]}>
      <View style={styles.mapBackground}>
        <View style={styles.mapGrid}>
          {/* Create a grid pattern to simulate map */}
          {Array.from({ length: 8 }, (_, i) => (
            <View key={`row-${i}`} style={styles.gridRow}>
              {Array.from({ length: 8 }, (_, j) => (
                <View key={`cell-${i}-${j}`} style={styles.gridCell} />
              ))}
            </View>
          ))}
        </View>
        
        {/* Map label */}
        <View style={styles.mapLabel}>
          <Text style={styles.mapLabelText}>📍 Atlanta, GA</Text>
          <Text style={styles.mapSubLabel}>Watch Party Locations</Text>
        </View>
        
        {/* Render children (markers) */}
        <View style={styles.markersContainer}>
          {children}
        </View>
      </View>
    </View>
  );
};

// Simple marker component
const SimpleMarker = ({ coordinate, children, onPress, anchor = { x: 0.5, y: 0.5 } }) => {
  // Convert lat/lng to x/y position within the map view
  // This is a simple approximation for demo purposes
  const mapWidth = width - 40; // Account for padding
  const mapHeight = 200;
  
  // Simple conversion (not geographically accurate, just for demo)
  const baseLatitude = 33.7490;
  const baseLongitude = -84.3880;
  const latRange = 0.01;
  const lngRange = 0.01;
  
  const x = ((coordinate.longitude - baseLongitude + lngRange/2) / lngRange) * mapWidth;
  const y = ((baseLatitude - coordinate.latitude + latRange/2) / latRange) * mapHeight;
  
  // Ensure markers stay within bounds
  const clampedX = Math.max(25, Math.min(mapWidth - 25, x));
  const clampedY = Math.max(25, Math.min(mapHeight - 25, y));
  
  return (
    <TouchableOpacity
      style={[
        styles.marker,
        {
          left: clampedX - 25, // Center the marker (assuming 50px width)
          top: clampedY - 25,  // Center the marker (assuming 50px height)
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    position: 'relative',
  },
  mapBackground: {
    backgroundColor: '#e8f4f8',
    position: 'relative',
    overflow: 'hidden',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#666',
  },
  mapLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  mapSubLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  markersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  marker: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { SimpleMapView as default, SimpleMarker as Marker };
export const PROVIDER_GOOGLE = 'google'; // For compatibility
