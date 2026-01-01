import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

export default function Settings() {
  const insets = useSafeAreaInsets();

  // Settings state (would be persisted in real app)
  const [musicVolume, setMusicVolume] = useState(0.8);
  const [sfxVolume, setSfxVolume] = useState(1.0);
  const [haptics, setHaptics] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleHapticsToggle = (value: boolean) => {
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setHaptics(value);
  };

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e', '#16213e']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Audio Section */}
        <Text style={styles.sectionTitle}>AUDIO</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="musical-notes" size={22} color="#00ffaa" />
              <Text style={styles.settingLabel}>Music Volume</Text>
            </View>
            <Text style={styles.settingValue}>{Math.round(musicVolume * 100)}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={musicVolume}
            onValueChange={setMusicVolume}
            minimumTrackTintColor="#00ffaa"
            maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
            thumbTintColor="#00ffaa"
          />

          <View style={[styles.settingRow, { marginTop: 20 }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="volume-high" size={22} color="#00ffaa" />
              <Text style={styles.settingLabel}>Sound Effects</Text>
            </View>
            <Text style={styles.settingValue}>{Math.round(sfxVolume * 100)}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={sfxVolume}
            onValueChange={setSfxVolume}
            minimumTrackTintColor="#00ffaa"
            maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
            thumbTintColor="#00ffaa"
          />
        </View>

        {/* Accessibility Section */}
        <Text style={styles.sectionTitle}>ACCESSIBILITY</Text>
        <View style={styles.card}>
          <View style={styles.settingRowToggle}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait" size={22} color="#00ffaa" />
              <View>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingDescription}>Vibration on actions</Text>
              </View>
            </View>
            <Switch
              value={haptics}
              onValueChange={handleHapticsToggle}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(0,255,170,0.4)' }}
              thumbColor={haptics ? '#00ffaa' : '#888'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRowToggle}>
            <View style={styles.settingInfo}>
              <Ionicons name="eye-off" size={22} color="#00ffaa" />
              <View>
                <Text style={styles.settingLabel}>Reduced Motion</Text>
                <Text style={styles.settingDescription}>Minimize animations</Text>
              </View>
            </View>
            <Switch
              value={reducedMotion}
              onValueChange={setReducedMotion}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(0,255,170,0.4)' }}
              thumbColor={reducedMotion ? '#00ffaa' : '#888'}
            />
          </View>
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>2024.01</Text>
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton}>
          <Ionicons name="trash-outline" size={20} color="#ff4757" />
          <Text style={styles.resetButtonText}>Reset Progress</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingRowToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    fontSize: 16,
    color: '#fff',
  },
  aboutValue: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#ff4757',
    fontWeight: '500',
  },
});
