
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface DetectionStatusProps {
  isDetecting: boolean;
  isDeepfake: boolean | null;
  confidence: number;
}

const DetectionStatus: React.FC<DetectionStatusProps> = ({ isDetecting, isDeepfake, confidence }) => {
  if (isDetecting) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#9b87f5" />
        <Text style={styles.text}>Analyzing voice patterns...</Text>
      </View>
    );
  }

  if (isDeepfake === null) {
    return (
      <View style={styles.container}>
        <View style={styles.neutralIcon}>
          <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
            <Path 
              d="M8 12h8m-4-4v8M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
              stroke="#8E9196" 
              strokeWidth={2} 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={styles.text}>No analysis performed yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isDeepfake ? (
        <View style={styles.deepfakeContainer}>
          <View style={styles.deepfakeIcon}>
            <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
              <Path 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                stroke="#ea384c" 
                strokeWidth={2} 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View>
            <Text style={styles.alertTitle}>Deepfake Detected</Text>
            <Text style={styles.alertDescription}>
              This voice may be artificially generated ({confidence.toFixed(0)}% confidence)
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.authenticContainer}>
          <View style={styles.authenticIcon}>
            <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
              <Path 
                d="M5 13l4 4L19 7" 
                stroke="#10b981" 
                strokeWidth={2} 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View>
            <Text style={styles.alertTitle}>Voice Authentic</Text>
            <Text style={styles.alertDescription}>
              No manipulation detected ({confidence.toFixed(0)}% confidence)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    color: '#8E9196',
  },
  neutralIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deepfakeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f0',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  deepfakeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(234, 56, 76, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  authenticContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  authenticIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#8E9196',
  },
});

export default DetectionStatus;
