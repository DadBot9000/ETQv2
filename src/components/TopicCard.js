import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

function renderRichText(text) {
  if (!text) return [];
  const normalized = String(text).replaceAll('<br><br>', '\n\n');
  const parts = normalized.split(/(<strong>|<\/strong>)/g);

  let strong = false;
  const result = [];

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (part === '<strong>') {
      strong = true;
      continue;
    }
    if (part === '</strong>') {
      strong = false;
      continue;
    }
    if (!part) continue;
    result.push({ text: part, strong });
  }

  return result;
}

export default function TopicCard({
  index,
  title,
  content,
  t,
}) {
  const [open, setOpen] = useState(index === 0);
  const rich = useMemo(() => renderRichText(content), [content]);

  return (
    <LinearGradient
      colors={
        open
          ? ['rgba(212,175,55,0.10)', 'rgba(255,255,255,0.03)']
          : ['rgba(255,255,255,0.035)', 'rgba(255,255,255,0.018)']
      }
      style={{
        borderRadius: 28,
        borderWidth: 1,
        borderColor: open ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: open ? 'rgba(212,175,55,0.22)' : 'rgba(255,255,255,0.06)',
        }}
      />

      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  minWidth: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(212,175,55,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(212,175,55,0.22)',
                }}
              >
                <Text
                  style={{
                    color: theme.colors.gold,
                    fontSize: 13,
                    fontFamily: 'PlayfairDisplay_700',
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>

              <View
                style={{
                  width: 28,
                  height: 1,
                  backgroundColor: 'rgba(212,175,55,0.30)',
                }}
              />
            </View>

            <Text
              style={{
                color: theme.colors.text,
                fontSize: 22,
                lineHeight: 28,
                fontFamily: 'PlayfairDisplay_600',
                marginBottom: 8,
              }}
            >
              {title}
            </Text>

                        <Text
              style={{
                color: 'rgba(255,255,255,0.44)',
                fontSize: 12,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {open ? t('tap_to_collapse') : t('tap_to_expand')}
            </Text>
          </View>

          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: open ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.04)',
              borderWidth: 1,
              borderColor: open ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.06)',
            }}
          >
            <Text
              style={{
                color: open ? theme.colors.gold : 'rgba(255,255,255,0.50)',
                fontSize: 16,
                transform: [{ rotate: open ? '90deg' : '0deg' }],
              }}
            >
              ›
            </Text>
          </View>
        </View>
      </Pressable>

      {open ? (
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
        >
          <View
            style={{
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.05)',
              marginBottom: 16,
            }}
          />

          <View
            style={{
              borderRadius: 20,
              backgroundColor: 'rgba(8,10,14,0.34)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.05)',
              paddingHorizontal: 16,
              paddingVertical: 15,
            }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.82)',
                fontSize: 15,
                lineHeight: 26,
              }}
            >
              {rich.map((segment, idx) => (
                <Text
                  key={`${title}-seg-${idx}`}
                  style={
                    segment.strong
                      ? {
                          color: theme.colors.gold,
                          fontFamily: 'PlayfairDisplay_600',
                        }
                      : null
                  }
                >
                  {segment.text}
                </Text>
              ))}
            </Text>
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
}
