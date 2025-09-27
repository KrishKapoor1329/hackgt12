import * as Location from 'expo-location';
import { Alert } from 'react-native';

export class LocationService {
  static async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  static async getCurrentLocation() {
    try {
      const hasPermission = await this.requestLocationPermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'To show you the leaderboard for your city, we need access to your location. You can enable this in your device settings.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  static async getCityFromCoordinates(latitude, longitude) {
    try {
      // Reverse geocode to get city information
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const location = reverseGeocode[0];
        
        // Try to get the most specific city name available
        const city = location.city || 
                    location.subregion || 
                    location.region || 
                    'Unknown City';
        
        const state = location.region || location.country || '';
        
        return {
          city,
          state,
          country: location.country || 'US',
          fullAddress: `${city}${state ? ', ' + state : ''}`,
          coordinates: { latitude, longitude }
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  static async detectUserCity() {
    try {
      // First check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to see your city leaderboard.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Get current location
      const location = await this.getCurrentLocation();
      if (!location) {
        return null;
      }

      // Get city from coordinates
      const cityInfo = await this.getCityFromCoordinates(
        location.coords.latitude,
        location.coords.longitude
      );

      return cityInfo;
    } catch (error) {
      console.error('Error detecting user city:', error);
      return null;
    }
  }

  static async getLocationWithFallback() {
    try {
      const cityInfo = await this.detectUserCity();
      
      if (cityInfo) {
        return cityInfo;
      }

      // Fallback: Try to use last known position if available
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 300000, // 5 minutes
        requiredAccuracy: 1000, // 1km accuracy
      });

      if (lastKnown) {
        const cityInfo = await this.getCityFromCoordinates(
          lastKnown.coords.latitude,
          lastKnown.coords.longitude
        );
        return cityInfo;
      }

      return null;
    } catch (error) {
      console.error('Error getting location with fallback:', error);
      return null;
    }
  }

  // Helper method to format city name for database storage
  static formatCityForDatabase(cityInfo) {
    if (!cityInfo) return null;
    
    return {
      city: cityInfo.city,
      state: cityInfo.state,
      country: cityInfo.country,
      displayName: cityInfo.fullAddress,
      coordinates: cityInfo.coordinates
    };
  }

  // Helper method to check if two locations are in the same city
  static isSameCity(location1, location2) {
    if (!location1 || !location2) return false;
    
    return location1.city?.toLowerCase() === location2.city?.toLowerCase() &&
           location1.state?.toLowerCase() === location2.state?.toLowerCase();
  }
}

export default LocationService;
