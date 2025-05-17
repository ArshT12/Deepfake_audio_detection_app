
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

// Note: This component isn't needed with React Navigation's Tab Navigator,
// but it's here for reference if you want to create a custom bottom navigation

const BottomNav: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const isActive = (screenName: string) => {
    return route.name === screenName;
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('AudioAnalysis' as never)}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path 
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
            stroke={isActive('AudioAnalysis') ? '#9b87f5' : '#8E9196'} 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <Path 
            d="M9 22V12h6v10" 
            stroke={isActive('AudioAnalysis') ? '#9b87f5' : '#8E9196'} 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </Svg>
        <Text style={[styles.navText, isActive('AudioAnalysis') && styles.activeText]}>
          Monitor
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Dashboard' as never)}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path 
            d="M18 20V10M12 20V4M6 20v-6" 
            stroke={isActive('Dashboard') ? '#9b87f5' : '#8E9196'} 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </Svg>
        <Text style={[styles.navText, isActive('Dashboard') && styles.activeText]}>
          Dashboard
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Settings' as never)}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path 
            d="M12 15a3 3 0 100-6 3 3 0 000 6z" 
            stroke={isActive('Settings') ? '#9b87f5' : '#8E9196'} 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <Path 
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" 
            stroke={isActive('Settings') ? '#9b87f5' : '#8E9196'} 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </Svg>
        <Text style={[styles.navText, isActive('Settings') && styles.activeText]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#8E9196',
  },
  activeText: {
    color: '#9b87f5',
    fontWeight: '500',
  },
});

export default BottomNav;
