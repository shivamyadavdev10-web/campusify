import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, ActivityIndicator } from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import Slider from '@react-native-community/slider';

interface Props {
  sourceUrl: string;
}

export const AdvancedCustomVideoPlayer: React.FC<Props> = ({ sourceUrl }) => {
  const videoRef = useRef<any>(null);
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [showRateModal, setShowRateModal] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const onLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    setIsBuffering(false);
  };

  const onProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  };

  const onBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    setIsBuffering(isBuffering);
  };

  const togglePlayPause = () => {
    setPaused(!paused);
  };

  const onSeek = (value: number) => {
    console.log('VideoRef:', videoRef.current);
    if (videoRef.current) {
      if (typeof videoRef.current.seek === 'function') {
        videoRef.current.seek(value);
      } else {
        console.log("videoRef.current.seek is not a function. Methods available:", Object.keys(videoRef.current));
      }
    }
  };

  console.log("🔗 FINAL VIDEO URL:", sourceUrl);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ 
          uri: sourceUrl, 
          type: 'm3u8' 
        }}
        useTextureView={false}
        bufferConfig={{
          minBufferMs: 15000,
          maxBufferMs: 50000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000,
        }}
        selectedVideoTrack={{
          type: 'auto',
        }}
        style={styles.video}
        paused={paused}
        rate={rate}
        hideShutterView={true}
        playInBackground={false}
        onLoadStart={(e) => console.log('🎥 [ExoPlayer] Load Start:', e)}
        onLoad={(e) => {
          console.log('✅ [ExoPlayer] Loaded successfully:', e);
          onLoad(e);
        }}
        onProgress={onProgress}
        onBuffer={(e) => {
          console.log(`⏳ [ExoPlayer] Buffering state changed. isBuffering: ${e.isBuffering}`);
          onBuffer(e);
        }}
        onPlaybackStateChanged={(e) => {
          console.log('🔄 [ExoPlayer] Playback State Changed:', e.playbackState);
        }}
        onError={(e) => {
          console.error('❌ [ExoPlayer] Fatal Error:', JSON.stringify(e.error, null, 2));
        }}
        resizeMode="contain"
        testID="Video"
      />
      
      {isBuffering && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayPause} style={styles.controlBtn}>
          <Text style={styles.controlText}>{paused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
        
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        
        <Slider
          testID="slider"
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration > 0 ? duration : 1}
          value={currentTime}
          onSlidingComplete={onSeek}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#000000"
        />
        
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
        
        <TouchableOpacity onPress={() => setShowRateModal(true)} style={styles.rateBtn}>
          <Text style={styles.controlText}>{rate.toFixed(1)}x</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showRateModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Playback Speed</Text>
            {[0.5, 1.0, 1.5, 2.0].map((r) => (
              <TouchableOpacity
                key={r}
                style={styles.rateOption}
                onPress={() => {
                  setRate(r);
                  setShowRateModal(false);
                }}
              >
                <Text style={styles.rateText}>{r.toFixed(2)}x</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowRateModal(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    justifyContent: 'center' 
  },
  video: { 
    width: '100%', 
    height: '100%' 
  },
  bufferingOverlay: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
  },
  controlBtn: { 
    padding: 10 
  },
  controlText: { 
    color: '#FFF', 
    fontSize: 16 
  },
  timeText: { 
    color: '#FFF', 
    fontSize: 12, 
    marginHorizontal: 5 
  },
  slider: { 
    flex: 1, 
    height: 40 
  },
  rateBtn: { 
    padding: 10 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 10, 
    width: 250 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  rateOption: { 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE' 
  },
  rateText: { 
    fontSize: 16, 
    textAlign: 'center' 
  },
  closeBtn: { 
    marginTop: 15, 
    padding: 10, 
    backgroundColor: '#DDDDDD', 
    borderRadius: 5 
  },
  closeBtnText: { 
    textAlign: 'center', 
    fontWeight: 'bold' 
  }
});
