import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [mode, setMode] = useState('qr_scan');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [zoom, setZoom] = useState(0);
  const [qrScanned, setQrScanned] = useState(false);

  const API_URL = 'http://192.168.1.17:5001/upload-capture';

  // ───────── QR SCAN ─────────
  const handleBarCodeScanned = ({ data }) => {
    if (qrScanned) return;
    setQrScanned(true);

    try {
      const parsed = Linking.parse(data);
      const id = parsed.queryParams?.sessionId;

      if (id) {
        setSessionId(id);
        setMode('capture');
        return;
      }
    } catch {}

    Alert.alert('Invalid QR', 'Try again', [
      { text: 'OK', onPress: () => setQrScanned(false) },
    ]);
  };

  // ───────── TAKE PHOTO ─────────
  const takePhoto = async () => {
    if (!cameraRef.current || !isCameraReady) return;

    const pic = await cameraRef.current.takePictureAsync();
    setPhoto(pic);
  };

  // ───────── UPLOAD ─────────
  const uploadPhoto = async () => {
    if (!photo || !sessionId) return;

    setLoading(true);

    try {
      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 704, height: 704 } }],
        { compress: 0.9 }
      );

      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('image', {
        uri: resized.uri,
        name: 'image.jpg',
        type: 'image/jpeg',
      });

      await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Uploaded!');
    } catch {
      Alert.alert('Error', 'Upload failed');
    }

    setLoading(false);
  };

  // ───────── PERMISSION ─────────
  if (!permission) {
    return <ActivityIndicator />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={requestPermission}>
          <Text>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ───────── QR SCREEN ─────────
  if (mode === 'qr_scan') {
    return (
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={qrScanned ? undefined : handleBarCodeScanned}
        />
      </View>
    );
  }

  // ───────── CAPTURE SCREEN ─────────
  return (
    <View style={styles.container}>
      {!photo ? (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            zoom={zoom}
            onCameraReady={() => setIsCameraReady(true)}
          />

          <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
            <Text style={{ color: '#fff' }}>CAPTURE</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Image source={{ uri: photo.uri }} style={styles.image} />

          <TouchableOpacity style={styles.btn} onPress={uploadPhoto}>
            {loading ? <ActivityIndicator /> : <Text>UPLOAD</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPhoto(null)}>
            <Text>Retake</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ───────── STYLES ─────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  captureBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 50,
  },
  image: { flex: 1 },
  btn: {
    padding: 15,
    backgroundColor: 'green',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});