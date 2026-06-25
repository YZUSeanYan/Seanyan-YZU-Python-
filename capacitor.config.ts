import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.seanyan.pythonquiz',
  appName: 'SeanYan Python刷题',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#F5F7FA'
  }
};

export default config;
