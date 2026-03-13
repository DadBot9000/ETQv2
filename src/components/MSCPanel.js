import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Pressable, Text, View, PanResponder, Animated, ScrollView, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';
import { playSynthTrack } from '../utils/audioSynth';

const TRACKS = [
  { id: 0, name: 'CLS1', composer: 'PLATINUM SOURCE', genre: 'CLASSIC' },
  { id: 1, name: 'CLS2', composer: 'PLATINUM SOURCE', genre: 'CLASSIC' },
  { id: 2, name: 'CLS3', composer: 'PLATINUM SOURCE', genre: 'CLASSIC' },

  { id: 10, name: 'FJ1', composer: 'PLATINUM SOURCE', genre: 'FUNKY/JAZZ' },
  { id: 11, name: 'FJ2', composer: 'PLATINUM SOURCE', genre: 'FUNKY/JAZZ' },
  { id: 12, name: 'FJ3', composer: 'PLATINUM SOURCE', genre: 'FUNKY/JAZZ' },

  { id: 20, name: 'JB1', composer: 'PLATINUM SOURCE', genre: 'JAZZ/BLUES' },
  { id: 21, name: 'JB2', composer: 'PLATINUM SOURCE', genre: 'JAZZ/BLUES' },
  { id: 22, name: 'JB3', composer: 'PLATINUM SOURCE', genre: 'JAZZ/BLUES' },

  { id: 30, name: 'ABT1', composer: 'PLATINUM SOURCE', genre: 'AMBIENT' },
  { id: 31, name: 'ABT2', composer: 'PLATINUM SOURCE', genre: 'AMBIENT' },
  { id: 32, name: 'ABT3', composer: 'PLATINUM SOURCE', genre: 'AMBIENT' },
];

const HARD_SILENCE_THRESHOLD = 0.01;
const STORAGE_KEY = 'platinum_audio_library';

const TrackItem = ({ tr, isActive, onSelect, onRemove }) => {
  const BUTTON_WIDTH = 80;

  return (
    <View style={{ marginBottom: 26 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!!tr.isCustom}
        snapToOffsets={[0, BUTTON_WIDTH]}
        disableIntervalMomentum
        decelerationRate="fast"
        bounces={false}
      >
        <Pressable
          onPress={onSelect}
          style={{
            width: 330,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgb(8, 8, 8)',
            paddingRight: 20,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: isActive ? theme.colors.gold : '#FFF',
                fontSize: 16,
                fontWeight: isActive ? '500' : '200',
                letterSpacing: 0.5,
              }}
            >
              {tr.name}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: 2, marginTop: 4 }}>
              {tr.composer}
            </Text>
          </View>

          {isActive && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.gold }} />}
        </Pressable>

        {tr.isCustom && (
          <View
            style={{
              width: BUTTON_WIDTH,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            }}
          >
            <Pressable
              onPress={onRemove}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 0.8,
                borderColor: theme.colors.black,
                borderRadius: 2,
              }}
              hitSlop={15}
            >
              <Text style={{ color: theme.colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 2 }}>
                {tr.deleteLabel}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const HorizontalPremiumSlider = ({ value, disabled, onChange }) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderRef = useRef(null);
  const [sliderLeft, setSliderLeft] = useState(0);

  const handleUpdate = (evt) => {
    if (disabled || sliderWidth === 0) return;
    const touchX = evt.nativeEvent.pageX;
    const relativeX = touchX - sliderLeft;
    const clamped = Math.max(0, Math.min(1, relativeX / sliderWidth));
    const steppedValue = Math.round(clamped * 100) / 100;
    if (steppedValue !== value) onChange(steppedValue);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: handleUpdate,
        onPanResponderMove: handleUpdate,
      }),
    [disabled, sliderWidth, sliderLeft, value]
  );

  return (
    <View
      ref={sliderRef}
      style={{ height: 48, width: '90%', alignSelf: 'center', justifyContent: 'center' }}
      onLayout={() => {
        sliderRef.current?.measure((x, y, width, height, pageX) => {
          setSliderWidth(width);
          setSliderLeft(pageX);
        });
      }}
      {...panResponder.panHandlers}
    >
      <View style={{ height: 1.5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
        <View style={{ height: '100%', width: `${value * 100}%`, backgroundColor: theme.colors.gold }} />
      </View>
      <View
        style={{
          position: 'absolute',
          left: `${value * 100}%`,
          marginLeft: -1,
          width: 2,
          height: 22,
          backgroundColor: theme.colors.gold,
        }}
      />
    </View>
  );
};

export default function MSCPanel({ t, open, setOpen, muted, setMuted }) {
  const [customTracks, setCustomTracks] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [selectedGenre, setSelectedGenre] = useState('CLASSIC');
  const [preMuteVolume, setPreMuteVolume] = useState(0.7);

  const soundRef = useRef(null);
  const isInternalPaused = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [genreMenuOpen, setGenreMenuOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setCustomTracks(JSON.parse(saved));
      } catch (e) {
        console.error('Load error:', e);
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customTracks)).catch((e) => console.error('Save error:', e));
  }, [customTracks]);

  const stopAndUnload = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        console.warn('Unload error:', e);
      }
      soundRef.current = null;
    }
  };

  const removeCustomTrack = async (tr) => {
    if (!tr?.isCustom) return;

    if (playing === tr.id) {
      await stopAndUnload();
      setPlaying(null);
    }

    setCustomTracks((prev) => prev.filter((track) => track.id !== tr.id));
  };

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (!soundRef.current || !playing) return;

      if (nextAppState.match(/inactive|background/)) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            isInternalPaused.current = true;
          }
        } catch (e) {
          console.log('AppState Pause Error:', e);
        }
      } else if (nextAppState === 'active') {
        if (isInternalPaused.current) {
          try {
            await soundRef.current.playAsync();
            isInternalPaused.current = false;
          } catch (e) {
            console.log('AppState Resume Error:', e);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      stopAndUnload();
    };
  }, [playing]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: open ? 1 : 0, duration: 500, useNativeDriver: true }).start();
  }, [open, fadeAnim]);

  const selectTrack = async (tr) => {
    if (playing === tr.id) {
      await stopAndUnload();
      setPlaying(null);
      return;
    }

    await stopAndUnload();
    setPlaying(tr.id);
    isInternalPaused.current = false;

    try {
      const activeVol = muted ? 0 : volume;
      soundRef.current = await playSynthTrack(tr.isCustom ? tr.uri : tr.id, activeVol, !muted, tr.isCustom);
    } catch (e) {
      console.error('Playback error:', e);
      setPlaying(null);
    }
  };

  const handleVolumeChange = useCallback(
    async (val) => {
      const next = val <= HARD_SILENCE_THRESHOLD ? 0 : val;
      setVolume(next);
      if (soundRef.current && !muted) {
        try {
          await soundRef.current.setVolumeAsync(next);
        } catch (e) {
          // noop
        }
      }
    },
    [muted]
  );

  const handleAddAudio = async () => {
    console.log('Inicjalizacja DocumentPicker...');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('Wynik Picker:', result);

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const id = `custom-${Date.now()}`;

        const newTrack = {
          id,
          name: (file.name || 'User Track').replace(/\.[^/.]+$/, ''),
          composer: 'PLATINUM SOURCE',
          uri: file.uri,
          isCustom: true,
          genre: 'USER',
        };

        setCustomTracks((prev) => [newTrack, ...prev]);
        console.log('Dodano utwór:', newTrack.name);
      }
    } catch (err) {
      console.error('BŁĄD KRYTYCZNY ADD:', err);
      alert('Błąd podczas wybierania pliku. Sprawdź uprawnienia do pamięci.');
    }
  };

  const toggleMute = async () => {
    const next = !muted;
    setMuted(next);

    if (next) {
      setPreMuteVolume(volume);
      if (soundRef.current) {
        try {
          await soundRef.current.setVolumeAsync(0);
        } catch (e) {
          // noop
        }
      }
    } else {
      const vol = preMuteVolume <= HARD_SILENCE_THRESHOLD ? 0.1 : preMuteVolume;
      setVolume(vol);
      if (soundRef.current) {
        try {
          await soundRef.current.setVolumeAsync(vol);
        } catch (e) {
          // noop
        }
      }
    }
  };

  const allTracks = useMemo(() => {
    console.log('Aktualny gatunek w filtrze:', selectedGenre);
    console.log('Ilość utworów użytkownika:', customTracks.length);

    if (selectedGenre === 'USER') {
      return customTracks || [];
    }

    return TRACKS.filter((track) => track.genre === selectedGenre);
  }, [selectedGenre, customTracks]);

  if (!open) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.mscPanel,
        {
          bottom: 0,
          left: 0,
          right: 0,
          opacity: fadeAnim,
          backgroundColor: 'rgba(8, 8, 8, 0.98)',
          paddingTop: 15,
          paddingBottom: 40,
          borderTopWidth: 1,
          borderColor: 'rgba(212, 175, 55, 0.15)',
          height: '65%',
        },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 25,
          height: 44,
          marginBottom: 10,
        }}
      >
        <Pressable
          onPress={handleAddAudio}
          style={{ width: 60, alignItems: 'flex-start', justifyContent: 'center', marginLeft: 10 }}
          hitSlop={15}
        >
          <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: 1.5, fontWeight: '600' }}>
            {t('msc_add')}
          </Text>
        </Pressable>

        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, alignItems: 'center', paddingVertical: 15 }} hitSlop={20}>
          <View style={{ width: 36, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.12)' }} />
        </Pressable>

        <Pressable
          onPress={() => setGenreMenuOpen(!genreMenuOpen)}
          style={{ width: 60, alignItems: 'flex-end', justifyContent: 'center', marginRight: 10 }}
          hitSlop={15}
        >
          <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: 1.5, fontWeight: '600' }}>
            {t('genre')}
          </Text>
        </Pressable>
      </View>

      <Text style={{ color: theme.colors.gold, fontSize: 8, letterSpacing: 6, fontWeight: '300', textAlign: 'center', marginBottom: 25 }}>
        {t('audiophile_series')}
      </Text>

      {genreMenuOpen && (
        <View
          style={{
            position: 'absolute',
            top: 64,
            right: 25,
            zIndex: 100,
            backgroundColor: 'rgba(12, 12, 12, 0)',
            paddingVertical: 10,
            paddingHorizontal: 10,
            minWidth: 110,
            borderWidth: 1,
            borderColor: 'rgba(212, 175, 55, 0)',
          }}
        >
          {['CLASSIC', 'FUNKY/JAZZ', 'JAZZ/BLUES', 'AMBIENT', 'USER', 'INFO'].map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                console.log('Wybrano kategorię:', item);
                if (item === 'INFO') {
                  setInfoVisible(true);
                } else {
                  setSelectedGenre(item);
                }
                setGenreMenuOpen(false);
              }}
              style={{
                paddingVertical: 10,
                width: '100%',
                alignItems: 'flex-end',
                backgroundColor: item === selectedGenre ? 'rgba(212, 175, 55, 0)' : 'transparent',
              }}
            >
              <Text
                style={{
                  color: item === selectedGenre ? theme.colors.gold : 'rgba(255,255,255,0.5)',
                  fontSize: 10,
                  letterSpacing: 2,
                  fontWeight: item === selectedGenre ? '700' : '400',
                }}
              >
                {item === 'INFO' ? `[ ${t('msc_info')} ]` : item}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {infoVisible && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgb(8, 8, 8)',
            zIndex: 200,
            padding: 40,
            justifyContent: 'center',
          }}
        >
          <Pressable
            onPress={() => setInfoVisible(false)}
            style={{ position: 'absolute', top: 20, right: 25, padding: 10 }}
          >
            <Text style={{ color: theme.colors.gold, fontSize: 20, fontWeight: '200' }}>✕</Text>
          </Pressable>

          <Text style={{ color: theme.colors.gold, fontSize: 10, letterSpacing: 5, marginBottom: 20 }}>
            {t('audiophile_series')}
          </Text>

          <Text style={{ color: '#FFF', fontSize: 12, lineHeight: 22, fontWeight: '200', letterSpacing: 1 }}>
            <Text style={{ fontWeight: '400', color: theme.colors.gold }}>
              {t('audiophile_synthesis')}
              {'\n\n'}
            </Text>
            {t('audiophile_desc')}
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 35, paddingBottom: 20 }}
        style={{ flex: 1 }}
      >
        {allTracks.map((tr) => (
          <TrackItem
            key={tr.id}
            tr={{ ...tr, deleteLabel: t('msc_delete') }}
            isActive={playing === tr.id}
            onSelect={() => selectTrack(tr)}
            onRemove={() => removeCustomTrack(tr)}
          />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 35, paddingTop: 25, borderTopWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: -12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: 2 }}>{t('amplification')}</Text>
          <Text style={{ color: theme.colors.gold, fontSize: 12, fontWeight: '400' }}>{muted ? '0' : Math.round(volume * 100)}</Text>
        </View>

        <HorizontalPremiumSlider value={muted ? 0 : volume} disabled={muted} onChange={handleVolumeChange} />

        <Pressable onPress={toggleMute} style={{ marginTop: 12, alignSelf: 'center', padding: 22 }}>
          <Text style={{ color: muted ? '#FF3B30' : 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 2, fontWeight: '600' }}>
            {muted ? t('paused') : t('active')}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
