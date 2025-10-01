import { useEffect, useState } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';

export function useCapacitor() {
  const [isNative, setIsNative] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [platform, setPlatform] = useState<'web' | 'android' | 'ios'>('web');

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    setPlatform(Capacitor.getPlatform() as 'web' | 'android' | 'ios');

    // Configure la barre de statut pour Android
    if (native && Capacitor.getPlatform() === 'android') {
      StatusBar.setStyle({ style: Style.Dark }).catch(console.error);
      StatusBar.setBackgroundColor({ color: '#1E3A8A' }).catch(console.error);
    }

    // Écoute les changements de connexion réseau
    let networkListenerHandle: PluginListenerHandle | null = null;
    Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
      if (!status.connected) {
        console.warn('📡 Mode hors ligne activé');
      } else {
        console.log('📡 Connexion rétablie');
      }
    }).then((handle) => {
      networkListenerHandle = handle;
    }).catch(console.error);

    // Gère le bouton retour Android
    if (native) {
      const handleBackButton = ({ canGoBack }: { canGoBack: boolean }) => {
        if (canGoBack) {
          window.history.back();
          return;
        }
        App.exitApp();
      };
      
      App.addListener('backButton', handleBackButton).catch(console.error);
    }

    return () => {
      if (networkListenerHandle) {
        networkListenerHandle.remove().catch(console.error);
      }
    };
  }, []);

  return {
    isNative,
    isOnline,
    platform,
    isPWA: !isNative && 'serviceWorker' in navigator,
  };
}

// Hook pour détecter si on est sur mobile (tactile)
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
