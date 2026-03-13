
import React, { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';

function Item({ active, icon, iconNode, label, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.navItem}
      >
        {iconNode ? (
          iconNode
        ) : (
          <Text
            style={[
              styles.navIcon,
              { color: active ? theme.colors.gold : theme.colors.textDim },
            ]}
          >
            {icon}
          </Text>
        )}

        <Text
          style={[
            styles.navLabel,
            { color: active ? theme.colors.gold : theme.colors.textDim },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function MSCIcon({ active, muted }) {
  const baseColor = active ? theme.colors.gold : theme.colors.textDim;

  if (!muted) {
    return <Text style={[styles.navIcon, { color: baseColor }]}>{'♬'}</Text>;
  }

  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: theme.colors.danger,
          backgroundColor: 'rgba(255,0,0,0.08)',
        }}
      />
      <Text style={[styles.navIcon, { color: theme.colors.danger }]}>{'♬'}</Text>
      <View
        style={{
          position: 'absolute',
          width: 18,
          height: 2,
          backgroundColor: theme.colors.danger,
          transform: [{ rotate: '-35deg' }],
        }}
      />
    </View>
  );
}

export default function BottomNav({
  currentPage,
  navigate,
  t,
  insetsBottom,
  mscOpen,
  mscMuted,
  toggleMSC,
}) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 800 }}>
      <BlurView
        intensity={80}
        tint="dark"
        style={[
          styles.bottomNav,
          {
            paddingBottom: Math.max(8, insetsBottom),
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Item
          active={currentPage === 'HOME'}
          icon="⌂"
          label={t('nav_home')}
          onPress={() => navigate('HOME')}
        />

        <Item
          active={
            currentPage === 'BLOCKS' ||
            currentPage === 'MODULES' ||
            currentPage === 'MODULE'
          }
          icon="◈"
          label="Program"
          onPress={() => navigate('BLOCKS')}
        />

        <Item
          active={currentPage === 'CERTS'}
          icon="✦"
          label={t('nav_certs')}
          onPress={() => navigate('CERTS')}
        />

        <Item
          active={mscOpen}
          iconNode={<MSCIcon active={mscOpen} muted={!!mscMuted} />}
          label={t('msc_title').replace('♬ ', '').split(' ')[0]}
          onPress={toggleMSC}
        />
      </BlurView>
    </View>
  );
}
