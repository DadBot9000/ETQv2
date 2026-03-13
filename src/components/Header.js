import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LANGS } from '../data/translations';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';
import HeaderCornerRing from '../components/HeaderCornerRing';
import { HEADER } from '../styles/headerConfig';

// --- IZOLOWANY KOMPONENT PROMIENIA ---
// React.memo zapobiega niepotrzebnym renderom, a własny useEffect z rekurencją 
// gwarantuje, że kolejna animacja wystartuje DOPIERO po zakończeniu poprzedniej.
const GoldenBeam = React.memo(() => {
  const beamAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isActive = true;

    const runSequence = () => {
      if (!isActive) return;

      beamAnim.setValue(0);
      Animated.sequence([
        Animated.delay(10000), // Sztywne 10 sekund przerwy
        Animated.timing(beamAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(beamAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start(() => {
        if (isActive) runSequence(); // Zapętlenie rekurencyjne (bezpieczniejsze niż loop)
      });
    };

    runSequence();

    return () => {
      isActive = false;
      beamAnim.stopAnimation();
    };
  }, []);

  return (
    <Animated.View 
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: '39.5%', 
        alignSelf: 'center',
        width: '70%',
        height: 1,
        backgroundColor: '#ffd040',
        opacity: beamAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.6, 0]
        }),
        transform: [{
          scaleX: beamAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1.0]
          })
        }],
        shadowColor: '#ffd040',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 5,
      }}
    />
  );
});

// --- GŁÓWNY KOMPONENT HEADER ---
export default function Header({ lang, setLang, t, insetsTop, currentPage, navigate }) {
  
  const [langOpen, setLangOpen] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current; 

  const dynamicTaglineSpacing = useMemo(() => {
    const defaultSpacing = 0.2 * 8.8;
    if (lang === 'DE' || lang === 'ES') return defaultSpacing * 0.5;
    return defaultSpacing;
  }, [lang]);

  const handleLangChange = (newLang) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setLang(newLang);
      setLangOpen(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 20 }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
      <BlurView
        intensity={80}
        tint="dark"
        style={[
          styles.appHeader,
          {
            paddingTop: insetsTop,
            height: HEADER.HEIGHT + insetsTop,
            paddingLeft: HEADER.PADDING_LEFT,
            paddingRight: HEADER.PADDING_RIGHT,
          }
        ]}
      >
        {/* LEFT — ARCHITEKTURA: USER na HOME / RING na RESZCIE */}
        <View style={[styles.headerLeft, { width: HEADER.LEFT_WIDTH, justifyContent: 'center', alignItems: 'flex-start' }]}>
          {currentPage === 'HOME' ? (
            <Pressable 
              onPress={() => navigate('USER')}
              style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, paddingLeft: 4 }]}
            >
              <Ionicons name="person-circle-outline" size={30} color={theme.colors.gold} />
            </Pressable>
          ) : (
            /* Na wszystkich innych ekranach (USER, MODULES, itd.) wyświetlamy pierścień */
            <HeaderCornerRing />
          )}
        </View>

        {/* CENTER — Logo + Izolowany Promień + Tagline */}
        <Animated.View 
          style={[
            styles.headerCenter, 
            { paddingHorizontal: HEADER.CENTER_PADDING_H, opacity: fadeAnim }
          ]}
        >
          <Text
            style={[styles.headerLogoText, { fontSize: HEADER.LOGO_FONT_SIZE }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t('app_name')}
          </Text>

          {/* Promień wywołany jako niezależny komponent */}
          <GoldenBeam />

          <Text
            style={[
              styles.headerTagline, 
              { 
                fontSize: HEADER.TAGLINE_FONT_SIZE,
                fontFamily: HEADER.TAGLINE_FONT,
                letterSpacing: dynamicTaglineSpacing
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t('app_tagline')}
          </Text>
        </Animated.View>

        {/* RIGHT — Lang switcher */}
        <View style={[styles.headerRight, { width: HEADER.RIGHT_WIDTH }]}>
          <View style={[styles.langSwitcher, { transform: [{ translateX: HEADER.LANG_OFFSET_X }, { translateY: HEADER.LANG_OFFSET_Y }] }]}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPress={() => setLangOpen(!langOpen)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.langToggleBtn}
              >
                <Ionicons name="language-outline" size={20} color={theme.colors.text} />
              </Pressable>
            </Animated.View>

            {langOpen && (
              <View style={[styles.langDropdown, { 
                position: 'absolute',
                top: 45,                // Pozycja pionowa względem przycisku
                right: -15,             // PRZESUNIĘCIE: Zwiększ (np. 5), aby przesunąć w LEWO. Zmniejsz (np. -20), aby w PRAWO.
                width: 80,
                backgroundColor: '#0a0a0a00', // Twoja przezroczysta czerń
                borderColor: 'rgba(216, 146, 24, 0)', // Twoje przezroczyste obramowanie
                borderWidth: 1,
                borderRadius: 8,
                marginTop: 10,
                paddingVertical: 5,
                shadowColor: '#00000000', // Twoja przezroczystość cienia
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 10
              }]}>
                {LANGS.map((L) => {
                  const active = L === lang;
                  return (
                    <Pressable
                      key={L}
                      onPress={() => handleLangChange(L)}
                      style={({ pressed }) => [
                        styles.langBtn, 
                        { 
                          backgroundColor: active ? 'rgba(216, 146, 24, 0)' : 'transparent',
                          opacity: pressed ? 0.7 : 1,
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderBottomWidth: L === LANGS[LANGS.length - 1] ? 0 : 0.5,
                          borderBottomColor: 'rgba(216, 146, 24, 0)'
                        }
                      ]}
                    >
                      <Text style={[
                        styles.langBtnText, 
                        { 
                          color: active ? theme.colors.gold : 'rgba(255,255,255,0.7)',
                          fontFamily: active ? 'CormorantGaramond_700' : 'CormorantGaramond_400',
                          fontSize: 15,
                          textAlign: 'center'
                        }
                      ]}>
                        {L}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </BlurView>
    </View>
  );
}
