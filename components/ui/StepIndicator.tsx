import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

type Props = { total: number; current: number };

export function StepIndicator({ total, current }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <React.Fragment key={step}>
            <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
              {done ? (
                <Text style={styles.dotDoneText}>✓</Text>
              ) : (
                <Text style={[styles.dotText, active && styles.dotTextActive]}>{step}</Text>
              )}
            </View>
            {i < total - 1 && (
              <View style={[styles.line, done && styles.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginVertical: Spacing.sm,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  dotActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  dotDone: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  dotText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.gray400,
  },
  dotTextActive: { color: Colors.white },
  dotDoneText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.gray200,
    maxWidth: 40,
  },
  lineDone: { backgroundColor: Colors.success },
});
