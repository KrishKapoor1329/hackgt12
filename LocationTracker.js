import * as Location from 'expo-location';
import { supabase } from './supabaseClient';

class LocationTracker {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.lastUpdate = 0;
    this.updateInterval = 30000; // Update every 30 seconds
  }

  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startTracking() {
    if (this.isTracking) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    try {
      this.isTracking = true;
      
      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      await this.updateLocationInDatabase(location.coords);

      // Start watching location changes
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: this.updateInterval,
          distanceInterval: 50, // Update if moved 50 meters
        },
        (location) => {
          this.handleLocationUpdate(location.coords);
        }
      );

      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.isTracking = false;
    }
  }

  async stopTracking() {
    if (!this.isTracking) return;

    try {
      if (this.watchId) {
        await Location.removeLocationSubscription(this.watchId);
        this.watchId = null;
      }
      this.isTracking = false;
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  async handleLocationUpdate(coords) {
    const now = Date.now();
    
    // Throttle updates to avoid too frequent database calls
    if (now - this.lastUpdate < this.updateInterval) {
      return;
    }

    this.lastUpdate = now;
    await this.updateLocationInDatabase(coords);
  }

  async updateLocationInDatabase(coords) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase.rpc('update_user_location', {
        user_lat: coords.latitude,
        user_lng: coords.longitude
      });

      if (error) {
        console.error('Error updating location in database:', error);
      } else {
        console.log('Location updated:', coords.latitude, coords.longitude);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  async getCurrentLocation() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }
}

export default new LocationTracker();
