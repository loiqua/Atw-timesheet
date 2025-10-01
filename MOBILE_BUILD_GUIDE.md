# 📱 Guide complet : Créer l'APK Android pour ATW TimeSheet

## 🎯 Prérequis

### **1. Logiciels nécessaires**
- ✅ Node.js (déjà installé)
- ✅ Capacitor (déjà installé)
- ⚠️ **Android Studio** (à installer)
- ⚠️ **Java JDK 17+** (à installer)

### **2. Installation d'Android Studio**

1. **Télécharger Android Studio** :
   - URL : https://developer.android.com/studio
   - Téléchargez la version Windows

2. **Installer Android Studio** :
   - Lancez l'installateur
   - Choisissez "Standard Installation"
   - Acceptez les licences
   - Attendez le téléchargement des SDK

3. **Configurer les variables d'environnement** :
   ```cmd
   # Ajouter dans les variables système :
   ANDROID_HOME=C:\Users\VOTRE_NOM\AppData\Local\Android\Sdk
   JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
   
   # Ajouter au PATH :
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %JAVA_HOME%\bin
   ```

4. **Vérifier l'installation** :
   ```cmd
   java -version
   adb version
   ```

---

## 🚀 Étapes de création de l'APK

### **Étape 1 : Préparer le logo**

1. **Copier votre logo** :
   ```cmd
   # Copiez "Logo ATW Humanitae.png" dans :
   apps/frontend/resources/icon.png
   ```

2. **Le logo doit être** :
   - Format : PNG
   - Taille : 1024x1024 pixels minimum
   - Fond transparent ou couleur unie

### **Étape 2 : Construire l'application Next.js**

```cmd
cd apps/frontend
npm run build
```

⏱️ Durée : 2-5 minutes

### **Étape 3 : Initialiser Capacitor (première fois uniquement)**

```cmd
cd apps/frontend
npx cap init "ATW TimeSheet" "com.atw.timesheet"
```

Répondez aux questions :
- **App name** : ATW TimeSheet
- **App ID** : com.atw.timesheet
- **Web directory** : dist

### **Étape 4 : Ajouter la plateforme Android**

```cmd
cd apps/frontend
npm run cap:add:android
```

⏱️ Durée : 1-2 minutes

### **Étape 5 : Synchroniser les fichiers**

```cmd
cd apps/frontend
npm run cap:sync
```

Cela copie les fichiers web dans le projet Android.

### **Étape 6 : Ouvrir le projet dans Android Studio**

```cmd
cd apps/frontend
npm run cap:open:android
```

Android Studio va s'ouvrir avec le projet.

### **Étape 7 : Configurer le projet Android**

Dans Android Studio :

1. **Attendre l'indexation** (barre de progression en bas)
2. **Sync Gradle** : Cliquez sur "Sync Now" si demandé
3. **Installer les SDK manquants** : Acceptez les installations proposées

### **Étape 8 : Générer l'APK de debug (pour tester)**

**Option A : Via Android Studio**
1. Menu : `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. Attendez la compilation (3-10 minutes)
3. Cliquez sur "locate" dans la notification
4. L'APK est dans : `android/app/build/outputs/apk/debug/app-debug.apk`

**Option B : Via ligne de commande**
```cmd
cd apps/frontend
npm run android:build:debug
```

### **Étape 9 : Générer l'APK de production (release)**

#### **9.1 Créer une clé de signature (première fois uniquement)**

```cmd
cd apps/frontend/android/app
keytool -genkey -v -keystore atw-release-key.keystore -alias atw-key -keyalg RSA -keysize 2048 -validity 10000
```

Répondez aux questions :
- **Mot de passe** : Choisissez un mot de passe fort (notez-le !)
- **Nom, Organisation** : ATW Humanitae
- **Ville, État, Pays** : Vos informations

⚠️ **IMPORTANT** : Sauvegardez le fichier `.keystore` et le mot de passe !

#### **9.2 Configurer Gradle pour la signature**

Créez le fichier `apps/frontend/android/key.properties` :

```properties
storePassword=VOTRE_MOT_DE_PASSE
keyPassword=VOTRE_MOT_DE_PASSE
keyAlias=atw-key
storeFile=app/atw-release-key.keystore
```

⚠️ **Ajoutez ce fichier au .gitignore !**

#### **9.3 Modifier le build.gradle**

Le fichier `apps/frontend/android/app/build.gradle` est déjà configuré.

#### **9.4 Compiler l'APK de production**

```cmd
cd apps/frontend
npm run android:build
```

⏱️ Durée : 5-15 minutes

L'APK final sera dans :
```
apps/frontend/android/app/build/outputs/apk/release/app-release.apk
```

---

## 📦 Installer l'APK sur un téléphone

### **Via USB (ADB)**

1. **Activer le mode développeur** sur votre téléphone :
   - Paramètres → À propos → Appuyez 7 fois sur "Numéro de build"
   - Activez "Débogage USB"

2. **Connecter le téléphone** via USB

3. **Installer l'APK** :
   ```cmd
   adb install apps/frontend/android/app/build/outputs/apk/release/app-release.apk
   ```

### **Via transfert de fichier**

1. Copiez l'APK sur votre téléphone
2. Ouvrez le fichier APK
3. Autorisez l'installation depuis des sources inconnues
4. Installez l'application

---

## 🎨 Personnalisation avancée

### **Changer le nom de l'application**

Éditez `apps/frontend/android/app/src/main/res/values/strings.xml` :
```xml
<string name="app_name">ATW TimeSheet</string>
```

### **Changer l'icône**

1. Placez votre logo dans `apps/frontend/resources/icon.png`
2. Utilisez Android Studio : `File` → `New` → `Image Asset`
3. Sélectionnez votre logo et générez les icônes

### **Changer la couleur du splash screen**

Éditez `apps/frontend/capacitor.config.ts` :
```typescript
SplashScreen: {
  backgroundColor: '#1E3A8A', // Votre couleur
}
```

### **Configurer l'URL du backend**

Pour la production, éditez `apps/frontend/capacitor.config.ts` :
```typescript
server: {
  url: 'https://votre-api.com',
  androidScheme: 'https'
}
```

---

## 🔧 Optimisations pour les performances

### **1. Activer la minification**

Dans `apps/frontend/android/app/build.gradle` :
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### **2. Activer le mode production Next.js**

Vérifiez que `NODE_ENV=production` lors du build.

### **3. Optimiser les images**

Compressez les images avant le build avec des outils comme TinyPNG.

### **4. Activer le cache**

Le service worker est déjà configuré pour le cache hors ligne.

---

## 🐛 Résolution des problèmes courants

### **Erreur : "SDK not found"**
```cmd
# Ouvrez Android Studio → SDK Manager
# Installez Android SDK 33 (Tiramisu)
```

### **Erreur : "Gradle build failed"**
```cmd
cd apps/frontend/android
./gradlew clean
./gradlew build
```

### **Erreur : "Java version incompatible"**
```cmd
# Installez Java JDK 17
# Configurez JAVA_HOME correctement
```

### **L'application crash au démarrage**
```cmd
# Vérifiez les logs :
adb logcat | grep -i "atw"
```

### **Problème de connexion API**
- Vérifiez que l'URL de l'API est correcte dans `capacitor.config.ts`
- Vérifiez les permissions réseau dans `AndroidManifest.xml`

---

## 📊 Checklist finale avant publication

- [ ] Logo 1024x1024px configuré
- [ ] Nom de l'application correct
- [ ] Version et versionCode incrémentés
- [ ] APK signé avec la clé de production
- [ ] Testé sur plusieurs appareils Android
- [ ] Mode hors ligne fonctionnel
- [ ] Notifications configurées
- [ ] Permissions Android déclarées
- [ ] URL de l'API en production
- [ ] Splash screen personnalisé
- [ ] Icônes générées pour toutes les tailles

---

## 🚀 Publication sur Google Play Store

### **1. Créer un compte développeur**
- URL : https://play.google.com/console
- Frais : 25$ (une fois)

### **2. Créer une nouvelle application**
- Nom : ATW TimeSheet
- Langue : Français
- Type : Application

### **3. Préparer les assets**
- Icône : 512x512px
- Feature Graphic : 1024x500px
- Screenshots : 4-8 images
- Description courte et longue

### **4. Uploader l'APK**
- Production → Créer une version
- Uploader `app-release.apk`
- Remplir les notes de version

### **5. Soumettre pour révision**
- Délai : 1-7 jours

---

## 📞 Support

Pour toute question :
- Documentation Capacitor : https://capacitorjs.com/docs
- Documentation Android : https://developer.android.com

---

## ✅ Résumé des commandes essentielles

```cmd
# 1. Build l'application web
cd apps/frontend
npm run build

# 2. Synchroniser avec Capacitor
npm run cap:sync

# 3. Ouvrir dans Android Studio
npm run cap:open:android

# 4. Build APK debug (test)
npm run android:build:debug

# 5. Build APK release (production)
npm run android:build

# 6. Installer sur téléphone
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

**🎉 Bonne chance avec votre application mobile ATW TimeSheet !**
