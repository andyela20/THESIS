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
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';

// ─── App Screens / Modes ───────────────────────────────────────────────────────
type AppMode = 'qr_scan' | 'capture';

export default function HomeScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);

  // ── mode: start in QR scan, switch to capture after session is set
  const [mode, setMode] = useState<AppMode>('qr_scan');

  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [sessionId, setSessionId] = useState('');

  // QR scan state
  const [qrScanned, setQrScanned] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const API_URL = 'http://192.168.1.6:5001/upload-capture';

  // ── Also support deep-link session (fallback)
  const url = Linking.useURL();
  useEffect(() => {
    if (url) {
      const parsed = Linking.parse(url);
      const id = parsed.queryParams?.sessionId;
      if (id) {
        connectSession(String(id));
      }
    }
  }, [url]);

  // ── Connect to a session from any source (QR or deep link)
  const connectSession = (id: string) => {
    setSessionId(id);
    setMode('capture');
    setIsCameraReady(false);
    setPhoto(null);
    setResult(null);
    console.log('SESSION CONNECTED:', id);
  };

  // ── Handle QR barcode scan result
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (qrScanned) return; // prevent double-fire
    setQrScanned(true);

    // Try to parse sessionId from a URL like: http://host?sessionId=abc123
    try {
      const parsed = Linking.parse(data);
      const id = parsed.queryParams?.sessionId;
      if (id) {
        connectSession(String(id));
        return;
      }
    } catch (_) {}

    // Fallback: treat the whole QR value as the sessionId
    if (data && data.trim().length > 0) {
      Alert.alert(
        'QR Scanned',
        `Use this as session ID?\n\n"${data}"`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setQrScanned(false) },
          { text: 'Connect', onPress: () => connectSession(data.trim()) },
        ]
      );
    } else {
      Alert.alert('Invalid QR', 'Could not read a valid session from this QR code.', [
        { text: 'Try Again', onPress: () => setQrScanned(false) },
      ]);
    }
  };

  // ── Take photo
  const takePhoto = async () => {
    if (!cameraRef.current) {
      Alert.alert('Camera Error', 'Camera is not attached.');
      return;
    }
    if (!isCameraReady) {
      Alert.alert('Camera Error', 'Camera is not ready yet. Please wait a moment.');
      return;
    }
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!pic) {
        Alert.alert('Capture Error', 'No image returned from camera.');
        return;
      }
      setPhoto(pic);
      setResult(null);
    } catch (e: any) {
      console.error('takePictureAsync error:', e);
      Alert.alert('Capture Failed', e?.message || 'Unknown error. Try again.');
    }
  };

  // ── Upload photo to desktop
  const uploadPhoto = async () => {
    if (!photo) return;
    if (!sessionId) {
      Alert.alert('No Session', 'No session connected. Scan QR first.');
      return;
    }
    setLoading(true);
    try {
      // Resize to 704×704 before uploading
      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 704, height: 704 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('image', {
        uri: resized.uri,
        name: 'capture.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('UPLOAD RESULT:', res.data);
      setResult({ success: true, message: 'Image uploaded successfully to desktop.' });
    } catch (e: any) {
      console.error('UPLOAD ERROR:', e);
      setResult({ success: false, message: 'Upload failed. Check server or IP.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Disconnect / reset session
  const disconnectSession = () => {
    Alert.alert('Disconnect Session', 'Are you sure you want to disconnect?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => {
          setSessionId('');
          setMode('qr_scan');
          setQrScanned(false);
          setPhoto(null);
          setResult(null);
          setIsCameraReady(false);
        },
      },
    ]);
  };

  // ── Loading fonts / permissions
  if (!fontsLoaded || !permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1F5D3F" />
        <Text style={styles.loadingText}>Loading MagniTect...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>MagniTect</Text>
          <Text style={styles.permissionSub}>
            Camera access is required to scan QR codes and capture urine microscopy images.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SCREEN: QR SCAN
  // ══════════════════════════════════════════════════════════════════════════════
  if (mode === 'qr_scan') {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* TOPBAR */}
          <View style={styles.topbar}>
            <Text style={styles.logo}>MagniTect</Text>
            <Text style={styles.status}>⚪ No Session</Text>
          </View>

          {/* INSTRUCTIONS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Connect to Desktop</Text>
            <Text style={styles.hint}>
              Open MagniTect on your desktop and scan the QR code shown there to start a session.
            </Text>
          </View>

          {/* QR CAMERA */}
          <View style={styles.card}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={qrScanned ? undefined : handleBarCodeScanned}
            >
              <View style={styles.qrOverlay}>
                {/* Dimmed corners */}
                <View style={styles.qrFrame}>
                  <View style={styles.cornerTL} />
                  <View style={styles.cornerTR} />
                  <View style={styles.cornerBL} />
                  <View style={styles.cornerBR} />
                </View>
                {qrScanned && (
                  <View style={styles.scanningBadge}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.scanningText}>Connecting…</Text>
                  </View>
                )}
              </View>
            </CameraView>
            <Text style={styles.cameraHint}>Point your camera at the desktop QR code</Text>
          </View>

          {/* Manual session ID entry (optional fallback) */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Or Enter Session ID</Text>
            <TextInput
              placeholder="Paste session ID here"
              style={styles.input}
              value={sessionId}
              onChangeText={setSessionId}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 6 }]}
              onPress={() => {
                if (sessionId.trim()) {
                  connectSession(sessionId.trim());
                } else {
                  Alert.alert('Empty', 'Please enter a session ID first.');
                }
              }}
            >
              <Text style={styles.primaryText}>Connect Manually</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SCREEN: CAPTURE (session is active)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* TOPBAR */}
        <View style={styles.topbar}>
          <Text style={styles.logo}>MagniTect</Text>
          <TouchableOpacity onPress={disconnectSession}>
            <Text style={styles.status}>🟢 Session Active ✕</Text>
          </TouchableOpacity>
        </View>

        {/* SESSION BANNER */}
        <View style={styles.sessionBanner}>
          <Text style={styles.sessionText}>Session: {sessionId}</Text>
        </View>

        {/* PATIENT */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <TextInput
            placeholder="Name"
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
          />
          <TextInput
            placeholder="ID"
            style={styles.input}
            value={patientId}
            onChangeText={setPatientId}
          />
        </View>

        {/* CAMERA / PHOTO */}
        {!photo ? (
          <View style={styles.card}>
            <CameraView
              style={styles.camera}
              ref={cameraRef}
              onCameraReady={() => setIsCameraReady(true)}
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />

                <TouchableOpacity
                  style={[
                    styles.captureBtn,
                    !isCameraReady && styles.captureBtnDisabled,
                  ]}
                  onPress={takePhoto}
                  disabled={!isCameraReady}
                >
                  {!isCameraReady && (
                    <ActivityIndicator size="small" color="#1F5D3F" />
                  )}
                </TouchableOpacity>
              </View>
            </CameraView>
            <Text style={styles.cameraHint}>
              {isCameraReady ? 'Tap the button to capture' : 'Initializing camera…'}
            </Text>
          </View>
        ) : (
          <>
            <Image source={{ uri: photo.uri }} style={styles.image} />
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => { setPhoto(null); setIsCameraReady(false); }}
              >
                <Text style={styles.secondaryText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={uploadPhoto}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryText}>Upload to Desktop</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {result && (
          <View style={[
            styles.resultCard,
            { borderLeftColor: result.success ? '#1F5D3F' : '#E24B4A', borderLeftWidth: 4 }
          ]}>
            <Text style={{ color: result.success ? '#1F5D3F' : '#A32D2D', fontFamily: 'Poppins_600SemiBold' }}>
              {result.success ? '✓ ' : '✕ '}{result.message}
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F3EC', paddingTop: 50, padding: 10 },
  scrollContent: { paddingBottom: 30 },

  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logo: { fontFamily: 'Poppins_700Bold', fontSize: 18 },
  status: { fontSize: 12, fontFamily: 'Poppins_500Medium' },

  sessionBanner: {
    backgroundColor: '#e8f5e8', borderRadius: 8, padding: 8,
    marginBottom: 10,
  },
  sessionText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#1F5D3F' },

  card: { backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 10 },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', marginBottom: 6 },
  hint: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#555', lineHeight: 20 },

  input: {
    borderWidth: 1, borderColor: '#D8DAD0',
    marginVertical: 5, padding: 8, borderRadius: 8,
    fontFamily: 'Poppins_400Regular',
  },

  camera: { height: 340, borderRadius: 10, overflow: 'hidden' },

  // QR scan overlay
  qrOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFrame: {
    width: 220,
    height: 220,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningBadge: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 8,
  },
  scanningText: {
    color: '#fff',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },

  // Capture camera overlay
  cameraOverlay: {
    flex: 1, justifyContent: 'flex-end',
    alignItems: 'center', paddingBottom: 20,
    position: 'relative',
  },
  cameraHint: {
    textAlign: 'center', fontSize: 11,
    color: '#8C9A8C', fontFamily: 'Poppins_400Regular',
    marginTop: 6,
  },

  // Corner guide markers (reused for both QR and capture)
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderTopWidth: 3, borderLeftWidth: 3, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 3 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderTopWidth: 3, borderRightWidth: 3, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 3 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 28, height: 28, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 3 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderBottomWidth: 3, borderRightWidth: 3, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 3 },

  captureBtn: {
    width: 70, height: 70,
    backgroundColor: '#fff',
    borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  captureBtnDisabled: { backgroundColor: '#ccc', opacity: 0.6 },

  image: { height: 300, width: '100%', borderRadius: 10, marginBottom: 10 },

  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  primaryBtn: {
    flex: 1, backgroundColor: '#1F5D3F',
    padding: 12, alignItems: 'center', borderRadius: 8,
  },
  primaryText: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },

  secondaryBtn: {
    flex: 1, backgroundColor: '#ddd',
    padding: 12, alignItems: 'center', borderRadius: 8,
  },
  secondaryText: { color: '#000', fontFamily: 'Poppins_500Medium' },

  resultCard: { padding: 12, backgroundColor: '#fff', borderRadius: 8 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontFamily: 'Poppins_400Regular' },

  permissionCard: { padding: 20 },
  permissionTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  permissionSub: { marginVertical: 10, fontFamily: 'Poppins_400Regular' },
});