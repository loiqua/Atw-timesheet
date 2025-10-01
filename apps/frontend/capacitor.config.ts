import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.atw.timesheet',
  appName: 'ATW TimeSheet',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Pour le développement, décommentez la ligne suivante et ajustez l'URL
    // url: 'http://192.168.1.100:3000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1E3A8A', // Bleu foncé ATW
      showSpinner: true,
      spinnerColor: '#F59E0B', // Orange ATW
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1E3A8A',
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
    },
  },
};

export default config;
