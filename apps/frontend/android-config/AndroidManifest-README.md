# Configuration AndroidManifest.xml

## Instructions

Après avoir exécuté `npm run cap:add:android`, vous devez modifier le fichier :
```
android/app/src/main/AndroidManifest.xml
```

## Permissions à ajouter

Ajoutez ces permissions **avant** la balise `<application>` :

```xml
<!-- Permissions nécessaires pour l'application -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                 android:maxSdkVersion="28" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" 
                 android:maxSdkVersion="32" />
```

## Configuration de l'application

Modifiez la balise `<application>` pour ajouter ces attributs :

```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:label="@string/app_name"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config">
    
    <!-- Le reste de la configuration existante -->
</application>
```

## Activité principale

L'activité MainActivity est déjà configurée par Capacitor, mais vérifiez qu'elle contient :

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
    android:label="@string/app_name"
    android:theme="@style/AppTheme.NoActionBarLaunch"
    android:launchMode="singleTask"
    android:windowSoftInputMode="adjustResize">
    
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

## Note importante

⚠️ **Ces modifications sont automatiquement appliquées par Capacitor lors de l'exécution de `npx cap add android`.**

Vous n'avez besoin de modifier manuellement que si vous voulez personnaliser davantage.
