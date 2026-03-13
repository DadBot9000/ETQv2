import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StatusBar, View, Easing } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Font from 'expo-font';

import AuthScreen from './src/screens/AuthScreen';
import AuthLanding from './src/screens/AuthLanding';
import Header from './src/components/Header';
import BottomNav from './src/components/BottomNav';
import Toast from './src/components/Toast';
import MSCPanel from './src/components/MSCPanel';
import ModulesScreen from './src/screens/ModulesScreen';
import ModuleScreen from './src/screens/ModuleScreen';
import CertsScreen from './src/screens/CertsScreen';
import UserHomeScreen from './src/screens/UserHomeScreen';
import BlocksScreen from './src/screens/BlocksScreen';
import CulturalPathScreen from './src/screens/CulturalPathScreen';
import LearningCenterScreen from './src/screens/LearningCenterScreen';
import EtiquetteSplashCanvas from './src/screens/EtiquetteSplashCanvas';

import { LANGS, T } from './src/data/translations';
import { I18nProvider } from './src/i18n/useTranslation';
import { loadState, saveState, setProgress } from './src/utils/storage';
import { styles } from './src/styles/styles';
import { theme } from './src/styles/theme';
import { LearningPathsProvider } from './src/state/learning/LearningPathsContext';

function AppTranslationBridge({ lang, setLang, children }) {
  return (
    <I18nProvider lang={lang} setLang={setLang}>
      {children}
    </I18nProvider>
  );
}

function AppInner({ restartApp }) {
  const insets = useSafeAreaInsets();

  const [lang, setLang] = useState('EN');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState('HOME');
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [currentMode, setCurrentMode] = useState('study');
  const [quiz, setQuiz] = useState({
    current: 0,
    answers: [],
    confirmed: {},
    submitted: false,
    score: 0,
  });
  const [progress, setProgressState] = useState({});
  const [mscOpen, setMSCOpen] = useState(false);
  const [mscMuted, setMSCMuted] = useState(false);

  const toggleMSC = useCallback(() => setMSCOpen((prev) => !prev), []);

  const toastAnim = useRef(new Animated.Value(0)).current;
  const appRootFade = useRef(new Animated.Value(0)).current;
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageTranslateY = useRef(new Animated.Value(0)).current;
  const transitionOverlayOpacity = useRef(new Animated.Value(0)).current;
  const sectionOverlayOpacity = useRef(new Animated.Value(0)).current;
  const pageTransitionLock = useRef(false);
  const toastTimer = useRef(null);

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('');

  useEffect(() => {
    Animated.timing(appRootFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [appRootFade]);

  // Localization handled by I18nProvider + useTranslation hook.
// App layer should not implement its own translator.
const t = useCallback(
  (key, vars) => {
    const active = (T[lang] || T.EN) || {};
    const base = active[key] || T.EN?.[key] || key;

    if (!vars) return base;

    return String(base).replace(/\{(\w+)\}/g, (_, token) => {
      const value = vars[token];
      return value === undefined || value === null ? `{${token}}` : String(value);
    });
  },
  [lang]
);

  useEffect(() => {
    (async () => {
      const { Audio } = require('expo-av');

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldRouteThroughEarpieceAndroid: false,
      });

      const loaded = await loadState();

      if (loaded?.lang && LANGS.includes(loaded.lang)) {
        setLang(loaded.lang);
      }

      if (loaded?.progress) {
        setProgressState(loaded.progress);
      }
    })();
  }, []);

  useEffect(() => {
    saveState({ lang, progress });
  }, [lang, progress]);

    const navigate = useCallback((page, moduleId = null) => {
    if (isTransitioning || pageTransitionLock.current) return;

    const normalized = String(page).trim().toUpperCase();

    const nextPage =
      normalized === 'HOME'
        ? 'HOME'
        : normalized === 'USER_HOME' || normalized === 'USER'
          ? 'USER'
          : normalized;

    const isTopLevelNavTarget =
  nextPage === 'HOME' ||
  nextPage === 'USER' ||
  nextPage === 'LEARNING_CENTER' ||
  nextPage === 'CULTURAL_PATH' ||
  nextPage === 'BLOCKS' ||
  nextPage === 'MODULES' ||
  nextPage === 'CERTS';

    const isSameTopLevelPage = nextPage === currentPage && moduleId === null;
    const isSameModulePage =
      nextPage === 'MODULE' &&
      currentPage === 'MODULE' &&
      moduleId === currentModuleId;

    if (isSameTopLevelPage || isSameModulePage) {
      return;
    }

const applyRouteChange = () => {
  setCurrentPage(nextPage);

  if (nextPage === 'BLOCKS') {
    setCurrentModuleId(null);
    return;
  }

  if (nextPage === 'MODULES' && moduleId !== null) {
    setCurrentModuleId(moduleId);
    return;
  }

  if (nextPage === 'MODULE' && moduleId !== null) {
    setCurrentModuleId(moduleId);
    setCurrentMode('study');
    setQuiz({
      current: 0,
      answers: [],
      confirmed: {},
      submitted: false,
      score: 0,
    });
  }
};

    pageTransitionLock.current = true;
    setIsPageTransitioning(true);

    if (isAuthenticated && isTopLevelNavTarget) {
      Animated.parallel([
        Animated.timing(sectionOverlayOpacity, {
          toValue: 0.14,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pageFadeAnim, {
          toValue: 0.16,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pageTranslateY, {
          toValue: 8,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        applyRouteChange();

        requestAnimationFrame(() => {
          Animated.parallel([
            Animated.timing(sectionOverlayOpacity, {
              toValue: 0,
              duration: 240,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(pageFadeAnim, {
              toValue: 1,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(pageTranslateY, {
              toValue: 0,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start(() => {
            pageTransitionLock.current = false;
            setIsPageTransitioning(false);
          });
        });
      });

      return;
    }

    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pageTranslateY, {
        toValue: 6,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      applyRouteChange();

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(pageFadeAnim, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(pageTranslateY, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          pageTransitionLock.current = false;
          setIsPageTransitioning(false);
        });
      });
    });
  }, [
    currentModuleId,
    currentPage,
    isAuthenticated,
    isTransitioning,
    pageFadeAnim,
    pageTranslateY,
    sectionOverlayOpacity,
  ]);

  const showToast = useCallback((msg, type = '') => {
    setToastMsg(msg);
    setToastType(type);

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 3200);
  }, [toastAnim]);

  const devOverride = useCallback(() => {
    setProgressState((prev) => {
      const next = { ...prev };

      for (let i = 0; i < 8; i += 1) {
        next[i] = {
          passed: true,
          score: 100,
          date: new Date().toLocaleDateString(),
        };
      }

      return next;
    });

    showToast(t('dev_msg'), 'success');
  }, [showToast, t]);

  const setModuleProgress = useCallback((moduleId, score, passed) => {
    setProgressState((prev) => setProgress(prev, moduleId, score, passed));
  }, []);

  const completeAuthLogin = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    Animated.timing(transitionOverlayOpacity, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setIsAuthenticated(true);
      setCurrentPage('HOME');

      requestAnimationFrame(() => {
        Animated.timing(transitionOverlayOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setIsTransitioning(false);
        });
      });
    });
  }, [isTransitioning, transitionOverlayOpacity]);

  const completeAuthLogout = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    Animated.timing(transitionOverlayOpacity, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setMSCOpen(false);
      setCurrentPage('AUTH');
      setIsAuthenticated(false);

      requestAnimationFrame(() => {
        Animated.timing(transitionOverlayOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setIsTransitioning(false);
        });
      });
    });
  }, [isTransitioning, transitionOverlayOpacity]);

  const commonProps = useMemo(() => ({
    lang,
    setLang,
    t,
    navigate,
    currentPage,
    currentModuleId,
    currentMode,
    setCurrentMode,
    quiz,
    setQuiz,
    progress,
    setModuleProgress,
    showToast,
    devOverride,
    restartApp,
    isAuthenticated,
    setIsAuthenticated,
    completeAuthLogin,
    completeAuthLogout,
    userStats: { viewedTopics: 0 },
  }), [
    lang,
    t,
    navigate,
    currentPage,
    currentModuleId,
    currentMode,
    quiz,
    progress,
    setModuleProgress,
    showToast,
    devOverride,
    restartApp,
    isAuthenticated,
    completeAuthLogin,
    completeAuthLogout,
  ]);

  const renderPage = () => {
    if (!isAuthenticated) {
      return currentPage === 'AUTH'
        ? <AuthScreen {...commonProps} />
        : <AuthLanding {...commonProps} />;
    }

const pageComponents = {
  HOME: <UserHomeScreen {...commonProps} />,
  USER: <UserHomeScreen {...commonProps} />,
  LEARNING_CENTER: <LearningCenterScreen {...commonProps} />,
  CULTURAL_PATH: <CulturalPathScreen {...commonProps} />,
  BLOCKS: <BlocksScreen {...commonProps} />,
  MODULES: <ModulesScreen {...commonProps} />,
  MODULE: <ModuleScreen {...commonProps} />,
  CERTS: <CertsScreen {...commonProps} />,
};

    return pageComponents[currentPage] || <UserHomeScreen {...commonProps} />;
  };

    const bottomNavH = isAuthenticated ? 56 + Math.max(8, insets.bottom) : 0;

  return (
    <AppTranslationBridge lang={lang} setLang={setLang}>
      <Animated.View
        style={[
          styles.appRoot,
          { backgroundColor: theme.colors.bg, opacity: appRootFade },
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg} />

        {isAuthenticated && (
          <Header
            lang={lang}
            setLang={setLang}
            t={t}
            devOverride={devOverride}
            insetsTop={insets.top}
            restartApp={restartApp}
            currentPage={currentPage}
            navigate={navigate}
          />
        )}

                <Animated.View
          style={[
            styles.mainContent,
            {
              paddingBottom: bottomNavH,
              opacity: pageFadeAnim,
              transform: [{ translateY: pageTranslateY }],
            },
          ]}
        >
          {renderPage()}
        </Animated.View>

        <MSCPanel
          t={t}
          open={mscOpen}
          setOpen={setMSCOpen}
          muted={mscMuted}
          setMuted={setMSCMuted}
        />

        <Toast anim={toastAnim} msg={toastMsg} type={toastType} />

                {isAuthenticated && (
          <BottomNav
            currentPage={currentPage}
            navigate={navigate}
            t={t}
            insetsBottom={insets.bottom}
            mscOpen={mscOpen}
            mscMuted={mscMuted}
            toggleMSC={toggleMSC}
          />
        )}

        <Animated.View
          pointerEvents={isPageTransitioning ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: theme.colors.bg,
            opacity: sectionOverlayOpacity,
          }}
        />

        <Animated.View
          pointerEvents={isTransitioning ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: theme.colors.bg,
            opacity: transitionOverlayOpacity,
          }}
        />
      </Animated.View>
    </AppTranslationBridge>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [appInstanceKey, setAppInstanceKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          PlayfairDisplay_400: require('./src/assets/fonts/PlayfairDisplay-Regular.ttf'),
          PlayfairDisplay_500: require('./src/assets/fonts/PlayfairDisplay-Medium.ttf'),
          PlayfairDisplay_600: require('./src/assets/fonts/PlayfairDisplay-SemiBold.ttf'),
          PlayfairDisplay_700: require('./src/assets/fonts/PlayfairDisplay-Bold.ttf'),
          PlayfairDisplay_900: require('./src/assets/fonts/PlayfairDisplay-Black.ttf'),

          PlayfairDisplay_400_Italic: require('./src/assets/fonts/PlayfairDisplay-Italic.ttf'),
          PlayfairDisplay_500_Italic: require('./src/assets/fonts/PlayfairDisplay-MediumItalic.ttf'),
          PlayfairDisplay_600_Italic: require('./src/assets/fonts/PlayfairDisplay-SemiBoldItalic.ttf'),
          PlayfairDisplay_700_Italic: require('./src/assets/fonts/PlayfairDisplay-BoldItalic.ttf'),
          PlayfairDisplay_900_Italic: require('./src/assets/fonts/PlayfairDisplay-BlackItalic.ttf'),

          CormorantGaramond_300: require('./src/assets/fonts/CormorantGaramond-Light.ttf'),
          CormorantGaramond_400: require('./src/assets/fonts/CormorantGaramond-Regular.ttf'),
          CormorantGaramond_500: require('./src/assets/fonts/CormorantGaramond-Medium.ttf'),
          CormorantGaramond_400_Italic: require('./src/assets/fonts/CormorantGaramond-Italic.ttf'),
        });

        setFontsLoaded(true);
      } catch (e) {
        setFontsLoaded(false);
      }
    })();
  }, []);

  const restartApp = useCallback(() => {
    setSplashDone(false);
    setAppInstanceKey((k) => k + 1);
  }, []);

  const ready = splashDone && fontsLoaded;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SafeAreaProvider>
        <LearningPathsProvider>
          {ready ? (
            <AppInner
              key={`app-${appInstanceKey}`}
              restartApp={restartApp}
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />
          )}
        </LearningPathsProvider>
      </SafeAreaProvider>

      {!ready && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.bg,
            zIndex: 9999,
          }}
        >
          <EtiquetteSplashCanvas onFinished={() => setSplashDone(true)} />
        </View>
      )}
    </View>
  );
}