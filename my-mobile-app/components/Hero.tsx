import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

const { width, height } = Dimensions.get('window');

const Hero = () => {
  const player = useVideoPlayer(require('../assets/home.mp4'), (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View style={styles.container}>
      
      {/* 1. Video Section - Explicit sizing added */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover" // Video eka screen ekata hariyata cover wenna meka danna
      />

      {/* 2. Dark Overlay */}
      <View style={styles.overlay} />

      {/* 3. Content Over Video */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Discover Sri Lanka</Text>
        <Text style={styles.subtitle}>The ultimate travel experience awaits you</Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#000', // Video eka load wenakan kalu pata pennanna
  },
  video: {
    ...StyleSheet.absoluteFillObject, // Meka use kirima wadath hondayi
    width: width,
    height: height * 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // Tikak thada pata kaloth text hodata peneyi
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1, // Video ekata udin thiyenna oni nisa
  },
  title: {
    color: 'white',
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
  },
  button: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#f97316',
    borderRadius: 100,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Hero;