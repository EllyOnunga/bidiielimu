import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

export const mobileService = {
  isNative: () => Capacitor.isNativePlatform(),

  // Haptics
  hapticImpact: async (style = ImpactStyle.Medium) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  },

  hapticNotification: async (type: NotificationType) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type });
    }
  },

  // Biometrics
  checkBiometrics: async () => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch (_) {
      return false;
    }
  },

  authenticateBiometric: async (reason: string = 'Log in to your account') => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'Biometric Login',
        subtitle: 'BidiiElimu Secure Access',
        description: 'Use your fingerprint or face to log in',
      });
      return true;
    } catch (_) {
      return false;
    }
  },

  saveCredentials: async (email: string, password: string) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await NativeBiometric.setCredentials({
        username: email,
        password: password,
        server: 'bidii-elimu.com',
      });
    } catch (e) {
      console.error('Failed to save credentials for biometrics', e);
    }
  },

  getCredentials: async () => {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      return await NativeBiometric.getCredentials({
        server: 'bidii-elimu.com',
      });
    } catch (_) {
      return null;
    }
  }
};
