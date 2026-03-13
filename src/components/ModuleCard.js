import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { resolveLocalizedText } from '../domain/learning/contentLocalization';
import { useLearningPaths } from '../state/learning/LearningPathsContext';
import { theme } from '../styles/theme';



export default function ModuleCard({
  module,
  onOpen,
  activeTrackId,
  lang = 'EN',
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const liftAnim = useRef(new Animated.Value(0)).current;

  const { getProgress } = useLearningPaths();

const moduleId = module?.core?.id || module?.id;
const resolvedTrackId = activeTrackId || 'PL';
const resolvedContent = module?.content?.[resolvedTrackId] || null;

  const progressEntry =
    moduleId && resolvedTrackId ? getProgress(resolvedTrackId, moduleId) : null;

  const passed = Boolean(progressEntry?.passed);

  const icon = module?.core?.icon || module?.icon || '•';

  const title = resolveLocalizedText(resolvedContent?.title, lang);
  const culturalNote = resolveLocalizedText(
    resolvedContent?.culturalNote?.body,
    lang
  );
  const subtitle = resolveLocalizedText(resolvedContent?.subtitle, lang);
  const excerpt = culturalNote || subtitle || '';

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.985,
        useNativeDriver: true,
        friction: 8,
        tension: 120,
      }),
      Animated.spring(liftAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 110,
      }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(liftAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          {
            translateY: liftAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -2],
            }),
          },
        ],
      }}
    >
      <Pressable onPress={onOpen} onPressIn={onPressIn} onPressOut={onPressOut}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.045)',
            'rgba(255,255,255,0.022)',
            'rgba(255,255,255,0.010)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 30,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            overflow: 'hidden',
            minHeight: 280,
          }}
        >
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 24,
              flex: 1,
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 50,
                  marginBottom: 16,
                }}
              >
                {icon}
              </Text>

              <Text
                style={{
                  color: theme.colors.gold,
                  fontSize: 26,
                  lineHeight: 32,
                  fontFamily: 'PlayfairDisplay_700',
                  marginBottom: 14,
                }}
              >
                {title}
              </Text>

              {!!excerpt && (
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.76)',
                    fontSize: 15,
                    lineHeight: 24,
                  }}
                >
                  {excerpt}
                </Text>
              )}
            </View>

            <View style={{ marginTop: 28 }}>
              <View
                style={{
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  marginBottom: 14,
                }}
              />

              <Text
                style={{
                  color: passed ? theme.colors.gold : 'rgba(255,255,255,0.44)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {passed ? 'Completed' : 'Open module'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
