import React from 'react';
import { Animated, Text, View } from 'react-native';
import { styles } from '../styles/styles';

export default function Toast({ anim, msg, type }) {
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  return (
    <View style={styles.toastWrapper}>
      <Animated.View
        style={[
          styles.toast,
          type === 'success' && styles.toastSuccess,
          type === 'error' && styles.toastError,
          {
            opacity: anim,
            transform: [{ translateY }]
          }
        ]}
      >
        <Text style={styles.toastText}>{msg}</Text>
      </Animated.View>
    </View>
  );
}
