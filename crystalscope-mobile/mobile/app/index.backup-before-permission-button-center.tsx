import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import * as FileSystem from 'expo-file-system/legacy';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';

const { width } = Dimensions.get('window');

// â”€â”€â”€ SVG Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const IconUpload = ({ size = 20, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="17 8 12 3 7 8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="3" x2="12" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const IconCamera = ({ size = 20, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={2} />
  </Svg>
);

const IconCheck = ({ size = 16, color = '#1F5D3F' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconX = ({ size = 16, color = '#666' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const IconQr = ({ size = 20, color = '#1F5D3F' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="14" y="3" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="3" y="14" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 14h.01M14 17h3M17 14v3M20 17v3M17 20h3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="5" y="5" width="3" height="3" fill={color} />
    <Rect x="16" y="5" width="3" height="3" fill={color} />
    <Rect x="5" y="16" width="3" height="3" fill={color} />
  </Svg>
);

const IconLink = ({ size = 14, color = '#1F5D3F' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconUser = ({ size = 16, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={2} />
  </Svg>
);

const IconId = ({ size = 16, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="10" x2="16" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="14" x2="16" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="8" cy="14" r="1" fill={color} />
    <Circle cx="8" cy="10" r="1" fill={color} />
  </Svg>
);

const IconZoomIn = ({ size = 18, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="11" y1="8" x2="11" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="11" x2="14" y2="11" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const IconZoomOut = ({ size = 18, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="11" x2="14" y2="11" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// â”€â”€â”€ MagniTect Logo SVG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MagniTectLogo = ({ size = 80, color = '#fff' }) => (
  <Svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none">
    <Path d="M55 10 L70 10 L70 28 L55 28 Z" fill={color} />
    <Path d="M60 28 L65 28 L65 80 L60 80 Z" fill={color} />
    <Path
      d="M62 50 Q30 50 20 70 Q15 80 20 88 Q28 98 45 98 L62 98 L62 90 L45 90 Q32 90 27 84 Q23 78 27 72 Q34 62 62 62 Z"
      fill={color}
    />
    <Path d="M25 98 L65 98 L65 105 L55 108 L35 108 L25 105 Z" fill={color} />
    <Path d="M55 5 L75 5 L78 10 L52 10 Z" fill={color} />
    <Path d="M58 28 L67 28 L69 38 L56 38 Z" fill={color} />
    <Path d="M57 38 L68 38 L66 44 L59 44 Z" fill={color} />
    <Polygon points="42,52 48,44 54,52 48,65" fill={color} opacity={0.9} />
    <Polygon points="42,52 48,44 54,52" fill={color} />
    <Line x1="48" y1="44" x2="38" y2="50" stroke={color} strokeWidth={1.5} opacity={0.7} />
    <Line x1="48" y1="44" x2="58" y2="50" stroke={color} strokeWidth={1.5} opacity={0.7} />
    <Circle cx="38" cy="50" r="2" fill={color} opacity={0.7} />
    <Circle cx="58" cy="50" r="2" fill={color} opacity={0.7} />
    <Circle cx="48" cy="65" r="2" fill={color} opacity={0.7} />
  </Svg>
);

// â”€â”€â”€ Splash Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const logoScale     = useRef(new Animated.Value(0.3)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const subOpacity    = useRef(new Animated.Value(0)).current;
  const pulseAnim     = useRef(new Animated.Value(1)).current;
  const dot1          = useRef(new Animated.Value(0)).current;
  const dot2          = useRef(new Animated.Value(0)).current;
  const dot3          = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(subOpacity,  { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.07, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const pt = setTimeout(() => pulse.start(), 600);

    const dotLoop = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.delay(320),
        Animated.parallel([
          Animated.timing(dot1, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ]).start(() => dotLoop());
    };
    const dt = setTimeout(() => dotLoop(), 1000);

    const ft = setTimeout(() => {
      Animated.timing(screenOpacity, { toValue: 0, duration: 500, useNativeDriver: true })
        .start(() => onFinish());
    }, 2800);

    return () => { clearTimeout(pt); clearTimeout(dt); clearTimeout(ft); pulse.stop(); };
  }, []);

  return (
    <Animated.View style={[splashStyles.container, { opacity: screenOpacity }]}>
      <Animated.View style={[splashStyles.logoWrap, {
        opacity: logoOpacity,
        transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
      }]}>
        <MagniTectLogo size={90} color="#fff" />
      </Animated.View>
      <Animated.Text style={[splashStyles.title, { opacity: textOpacity }]}>MagniTect</Animated.Text>
      <Animated.Text style={[splashStyles.sub,   { opacity: subOpacity  }]}>
        Automated Urinary Crystal Detection
      </Animated.Text>
      <View style={splashStyles.dots}>
        {[dot1, dot2, dot3].map((anim, i) => (
          <Animated.View key={i} style={[splashStyles.dot, {
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }],
          }]} />
        ))}
      </View>
    </Animated.View>
  );
};

const splashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1F5D3F', justifyContent: 'center', alignItems: 'center' },
  logoWrap:  { marginBottom: 20 },
  title:     { color: '#fff', fontSize: 32, fontFamily: 'Poppins_700Bold', letterSpacing: 1 },
  sub:       { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  dots:      { flexDirection: 'row', gap: 8, marginTop: 40 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.85)' },
});

// â”€â”€â”€ Zoom Slider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ZOOM_MIN  = 0;
const ZOOM_MAX  = 1;
const TRACK_H   = 180;

const ZoomSlider = ({
  zoom,
  zoomRef,
  onZoomChange,
}: {
  zoom: number;
  zoomRef: React.MutableRefObject<number>;
  onZoomChange: (z: number) => void;
}) => {
  const startY    = useRef(0);
  const startZoom = useRef(zoom);

  const zoomToY = (z: number) => (1 - z) * TRACK_H;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startY.current    = zoomToY(zoomRef.current);
        startZoom.current = zoomRef.current;
      },
      onPanResponderMove: (_, gs) => {
        const newY    = Math.max(0, Math.min(TRACK_H, startY.current + gs.dy));
        const newZoom = parseFloat((1 - newY / TRACK_H).toFixed(3));
        onZoomChange(newZoom);
      },
    })
  ).current;

  const thumbPos = zoomToY(zoom);
  const fillH    = TRACK_H - thumbPos;

  return (
    <View style={zoomStyles.container}>
      <TouchableOpacity
        style={zoomStyles.btn}
        onPress={() => onZoomChange(Math.min(ZOOM_MAX, parseFloat((zoomRef.current + 0.05).toFixed(3))))}
        activeOpacity={0.7}
      >
        <IconZoomIn size={16} color="#fff" />
      </TouchableOpacity>

      <View style={zoomStyles.trackWrap} {...panResponder.panHandlers}>
        <View style={zoomStyles.track}>
          <View style={[zoomStyles.fill, { height: fillH, position: 'absolute', bottom: 0 }]} />
        </View>
        <View style={[zoomStyles.thumb, { top: thumbPos - 10 }]} />
      </View>

      <TouchableOpacity
        style={zoomStyles.btn}
        onPress={() => onZoomChange(Math.max(ZOOM_MIN, parseFloat((zoomRef.current - 0.05).toFixed(3))))}
        activeOpacity={0.7}
      >
        <IconZoomOut size={16} color="#fff" />
      </TouchableOpacity>

      <View style={zoomStyles.badge}>
        <Text style={zoomStyles.badgeText}>{Math.round(zoom * 100)}%</Text>
      </View>
    </View>
  );
};

const zoomStyles = StyleSheet.create({
  container: {
    position: 'absolute', right: 12,
    top: '50%', marginTop: -(TRACK_H / 2 + 60),
    alignItems: 'center', gap: 8,
  },
  btn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  trackWrap: {
    width: 34, height: TRACK_H,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  track: {
    width: 4, height: TRACK_H,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2, overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    width: 4, borderRadius: 2,
    backgroundColor: '#fff',
  },
  thumb: {
    position: 'absolute', left: 7,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
    borderWidth: 2, borderColor: '#1F5D3F',
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Poppins_500Medium' },
});

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type AppMode = 'qr_scan' | 'capture';

export default function HomeScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const isCameraReadyRef = useRef(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [splashDone, setSplashDone] = useState(false);
  const [mode,    setMode]    = useState<AppMode>('qr_scan');
  const [photo,   setPhoto]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<any>(null);

  const [patientName,   setPatientName]   = useState('');
  const [patientId,     setPatientId]     = useState('');
  const [sessionId,     setSessionId]     = useState('');
  const [sessionInput,  setSessionInput]  = useState('');
  const [qrScanned,     setQrScanned]     = useState(false);
  const [patientFromQr, setPatientFromQr] = useState(false);

  const [zoom, setZoomState] = useState(0);
  const zoomRef = useRef(0);
  const setZoom = useCallback((z: number) => {
    zoomRef.current = z;
    setZoomState(z);
  }, []);

  const pinchRef = useRef({ initialDist: 0, initialZoom: 0 });

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const MODEL_BASE_URL = 'http://18.116.200.163:5001';
  const API_URL = `${MODEL_BASE_URL}/upload-capture`;

  // â”€â”€ Pinch-to-zoom â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pinchResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder:  (e) => e.nativeEvent.touches.length === 2,
      onStartShouldSetPanResponderCapture: (e) => e.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponderCapture:  (e) => e.nativeEvent.touches.length === 2,
      onPanResponderGrant: (e) => {
        if (e.nativeEvent.touches.length === 2) {
          const [t1, t2] = e.nativeEvent.touches;
          const dx = t1.pageX - t2.pageX;
          const dy = t1.pageY - t2.pageY;
          pinchRef.current.initialDist = Math.sqrt(dx * dx + dy * dy);
          pinchRef.current.initialZoom = zoomRef.current;
        }
      },
      onPanResponderMove: (e) => {
        if (e.nativeEvent.touches.length === 2) {
          const [t1, t2] = e.nativeEvent.touches;
          const dx   = t1.pageX - t2.pageX;
          const dy   = t1.pageY - t2.pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const scale = dist / (pinchRef.current.initialDist || 1);
          const newZoom = Math.max(
            ZOOM_MIN,
            Math.min(
              ZOOM_MAX,
              parseFloat((pinchRef.current.initialZoom * scale + (scale - 1) * 0.3).toFixed(3))
            )
          );
          zoomRef.current = newZoom;
          setZoomState(newZoom);
        }
      },
    })
  ).current;

  // â”€â”€ Camera ready handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCameraReady = useCallback(() => {
    isCameraReadyRef.current = true;
    setIsCameraReady(true);
  }, []);

  // â”€â”€ Session helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const connectSession = (id: string, name = '', pid = '', fromQr = false) => {
    setSessionId(id);
    setPatientName(name);
    setPatientId(pid);
    setPatientFromQr(fromQr && !!(name || pid));
    setMode('capture');
    setPhoto(null);
    setResult(null);
    setZoom(0);
    // Reset camera ready so onCameraReady fires when the capture CameraView mounts
    isCameraReadyRef.current = false;
    setIsCameraReady(false);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (qrScanned) return;
    setQrScanned(true);
    try {
      const parsed = Linking.parse(data);
      const id   = parsed.queryParams?.sessionId as string;
      const name = (parsed.queryParams?.name      as string) ?? '';
      const pid  = (parsed.queryParams?.patientId as string) ?? '';
      if (id) { connectSession(id, name, pid, true); return; }
    } catch (_) {}
    if (data?.trim()) {
      Alert.alert('QR Scanned', `Use as session ID?\n\n"${data}"`, [
        { text: 'Cancel',  style: 'cancel',      onPress: () => setQrScanned(false) },
        { text: 'Connect', onPress: () => connectSession(data.trim(), '', '', false) },
      ]);
    } else {
      Alert.alert('Invalid QR', 'Could not read a valid session.', [
        { text: 'Try Again', onPress: () => setQrScanned(false) },
      ]);
    }
  };

  const url = Linking.useURL();
  useEffect(() => {
    if (url) {
      const parsed = Linking.parse(url);
      const id   = parsed.queryParams?.sessionId as string;
      const name = (parsed.queryParams?.name      as string) ?? '';
      const pid  = (parsed.queryParams?.patientId as string) ?? '';
      if (id) connectSession(id, name, pid, true);
    }
  }, [url]);

  const takePhoto = async () => {
    if (!cameraRef.current) {
      Alert.alert('Camera Error', 'Camera is not attached.');
      return;
    }
    if (!isCameraReadyRef.current) {
      Alert.alert('Camera Error', 'Camera is not ready yet. Please wait a moment.');
      return;
    }
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!pic) { Alert.alert('Capture Error', 'No image returned.'); return; }
      setPhoto(pic);
      setResult(null);
    } catch (e: any) {
      Alert.alert('Capture Failed', e?.message || 'Unknown error.');
    }
  };

  const uploadPhoto = async () => {
    if (!photo) return;

    if (!sessionId) {
      Alert.alert('No Session', 'Scan QR first.');
      return;
    }

    setLoading(true);

    let uploadStep = 'starting';

    try {
      uploadStep = 'checking server health';

      const healthResponse = await fetch(`${MODEL_BASE_URL}/health`, {
        method: 'GET',
      });

      const healthText = await healthResponse.text();

      if (!healthResponse.ok) {
        throw new Error(`Health failed (${healthResponse.status}): ${healthText}`);
      }

      uploadStep = 'resizing image';

      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 704, height: 704 } }],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      uploadStep = 'uploading image';

      const uploadResult = await FileSystem.uploadAsync(API_URL, resized.uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'image',
        mimeType: 'image/jpeg',
        parameters: {
          sessionId: sessionId,
          patientName: patientName || '',
          patientId: patientId || '',
        },
        headers: {
          Accept: 'application/json',
        },
      });

      const status = uploadResult.status;
      const body = uploadResult.body || '';

      let data: any = {};
      try {
        data = JSON.parse(body);
      } catch {
        data = { raw: body };
      }

      if (status < 200 || status >= 300 || data?.success === false) {
        throw new Error(
          data?.error ||
          data?.message ||
          data?.raw ||
          `Server returned status ${status}`
        );
      }

      setResult({
        success: true,
        message: data?.message || 'Image uploaded successfully to desktop.',
      });
    } catch (e: any) {
      console.log('[MOBILE UPLOAD ERROR]', {
        step: uploadStep,
        message: e?.message,
        error: e,
      });

      setResult({
        success: false,
        message: `Upload failed at ${uploadStep}: ${e?.message || 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectSession = () => {
    Alert.alert('Disconnect Session', 'Are you sure you want to disconnect?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive',
        onPress: () => {
          setSessionId(''); setPatientName(''); setPatientId('');
          setPatientFromQr(false); setMode('qr_scan'); setQrScanned(false);
          setPhoto(null); setResult(null); setSessionInput(''); setZoom(0);
          isCameraReadyRef.current = false;
          setIsCameraReady(false);
        },
      },
    ]);
  };

  // â”€â”€ Guards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!fontsLoaded || !permission) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1F5D3F" /></View>;
  }

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permissionCard}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <MagniTectLogo size={60} color="#1F5D3F" />
          </View>
          <Text style={styles.permissionTitle}>MagniTect</Text>
          <Text style={styles.permissionSub}>
            Camera access is required to scan QR codes and capture urine microscopy images.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <IconCamera size={18} color="#fff" />
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RENDER
  //
  // KEY FIX: Each mode renders its OWN CameraView directly inside the
  // cameraWrapper View. This guarantees the camera feed fills its container
  // and is never hidden behind another view, ScrollView, or zIndex layer.
  //
  // - QR mode:      CameraView with barcode scanning, rendered in its card
  // - Capture mode: CameraView with zoom + ref, rendered in its card
  //
  // When mode switches, the old CameraView unmounts and the new one mounts.
  // Expo Go handles this cleanly â€” there is never more than one active at a time.
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* â”€â”€ QR SCAN SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {mode === 'qr_scan' && (
          <>
            <View style={styles.topbar}>
              <View style={styles.logoRow}>
                <MagniTectLogo size={28} color="#1F5D3F" />
                <Text style={styles.logo}>MagniTect</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: '#aaa' }]} />
                <Text style={styles.statusText}>No Session</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardIconRow}>
                <IconQr size={18} color="#1F5D3F" />
                <Text style={styles.sectionTitle}>Connect to Desktop</Text>
              </View>
              <Text style={styles.hint}>
                Open MagniTect on your desktop and scan the QR code shown there to start a session.
              </Text>
            </View>

            {/*
              QR Camera Card â€” CameraView lives DIRECTLY inside cameraWrapper.
              This is what makes the preview visible. No absolute positioning
              tricks, no zIndex games â€” the camera is a normal flex child.
            */}
            <View style={styles.card}>
              <View style={styles.cameraWrapper}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={!qrScanned ? handleBarCodeScanned : undefined}
                />
                {/* Visual overlay for QR frame guides */}
                <View style={styles.qrOverlay}>
                  <View style={styles.qrFrame}>
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />
                  </View>
                  {qrScanned ? (
                    <View style={styles.scanningBadge}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.scanningText}>Connectingâ€¦</Text>
                    </View>
                  ) : (
                    <View style={styles.scanPromptBadge}>
                      <Text style={styles.scanPromptText}>Point at QR code</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.cameraHint}>Point your camera at the desktop QR code</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardIconRow}>
                <IconLink size={16} color="#1F5D3F" />
                <Text style={styles.sectionTitle}>Or Enter Session ID</Text>
              </View>
              <TextInput
                placeholder="Paste session ID here"
                placeholderTextColor="#aaa"
                style={styles.input}
                value={sessionInput}
                onChangeText={setSessionInput}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 8 }]}
                onPress={() => {
                  if (sessionInput.trim()) connectSession(sessionInput.trim());
                  else Alert.alert('Empty', 'Please enter a session ID first.');
                }}
              >
                <IconLink size={15} color="#fff" />
                <Text style={[styles.primaryText, { marginLeft: 6 }]}>Connect Manually</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* â”€â”€ CAPTURE SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {mode === 'capture' && (
          <>
            <View style={styles.topbar}>
              <View style={styles.logoRow}>
                <MagniTectLogo size={28} color="#1F5D3F" />
                <Text style={styles.logo}>MagniTect</Text>
              </View>
              <TouchableOpacity onPress={disconnectSession} style={styles.statusBadgeActive}>
                <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
                <Text style={[styles.statusText, { color: '#1F5D3F' }]}>Session Active</Text>
                <View style={{ marginLeft: 4 }}><IconX size={12} color="#1F5D3F" /></View>
              </TouchableOpacity>
            </View>

            <View style={styles.sessionBanner}>
              <IconLink size={13} color="#1F5D3F" />
              <Text style={styles.sessionText}>
                {'  '}Session:{' '}
                <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{sessionId}</Text>
              </Text>
            </View>

            {/* Patient Card */}
            <View style={styles.card}>
              <View style={styles.cardIconRow}>
                <IconUser size={16} color="#1F5D3F" />
                <Text style={styles.sectionTitle}>Patient</Text>
              </View>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIconWrap}><IconUser size={15} color="#888" /></View>
                {patientFromQr && patientName ? (
                  <View style={styles.readonlyField}>
                    <Text style={styles.readonlyLabel}>Name</Text>
                    <Text style={styles.readonlyValue}>{patientName}</Text>
                    <View style={styles.readonlyCheck}><IconCheck size={14} color="#1F5D3F" /></View>
                  </View>
                ) : (
                  <TextInput
                    placeholder="Patient Name"
                    placeholderTextColor="#aaa"
                    style={styles.fieldInput}
                    value={patientName}
                    onChangeText={setPatientName}
                  />
                )}
              </View>
              <View style={[styles.fieldWrap, { marginBottom: 0 }]}>
                <View style={styles.fieldIconWrap}><IconId size={15} color="#888" /></View>
                {patientFromQr && patientId ? (
                  <View style={styles.readonlyField}>
                    <Text style={styles.readonlyLabel}>Patient ID</Text>
                    <Text style={styles.readonlyValue}>{patientId}</Text>
                    <View style={styles.readonlyCheck}><IconCheck size={14} color="#1F5D3F" /></View>
                  </View>
                ) : (
                  <TextInput
                    placeholder="Patient ID"
                    placeholderTextColor="#aaa"
                    style={styles.fieldInput}
                    value={patientId}
                    onChangeText={setPatientId}
                  />
                )}
              </View>
            </View>

            {/* Camera / Preview */}
            {!photo ? (
              <View style={styles.card}>
                <View style={styles.cardIconRow}>
                  <IconCamera size={16} color="#1F5D3F" />
                  <Text style={styles.sectionTitle}>Capture Image</Text>
                </View>

                {/*
                  Capture Camera â€” CameraView lives DIRECTLY inside cameraWrapper.
                  The ref, zoom, and onCameraReady are all wired here.
                  pinchResponder wraps the whole cameraWrapper for 2-finger zoom.
                  The shutter button is inside cameraOverlay (absoluteFill sibling
                  of CameraView), so single taps reach it cleanly.
                */}
                <View style={styles.cameraWrapper} {...pinchResponder.panHandlers}>
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    ref={cameraRef}
                    zoom={zoom}
                    onCameraReady={handleCameraReady}
                  />

                  {/* Overlay: corners + shutter */}
                  <View style={styles.cameraOverlay}>
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />

                    <TouchableOpacity
                      style={[styles.captureBtn, !isCameraReady && styles.captureBtnDisabled]}
                      onPress={takePhoto}
                      disabled={!isCameraReady}
                    >
                      {!isCameraReady
                        ? <ActivityIndicator size="small" color="#1F5D3F" />
                        : <View style={styles.captureBtnInner} />
                      }
                    </TouchableOpacity>
                  </View>

                  {isCameraReady && (
                    <ZoomSlider zoom={zoom} zoomRef={zoomRef} onZoomChange={setZoom} />
                  )}

                  {isCameraReady && (
                    <View style={styles.zoomPill}>
                      <Text style={styles.zoomPillText}>
                        {zoom === 0 ? '1Ã—' : `${(1 + zoom * 9).toFixed(1)}Ã—`}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.cameraHint}>
                  {isCameraReady
                    ? 'Pinch or use slider to zoom  Â·  Tap button to capture'
                    : 'Initializing cameraâ€¦'}
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.cardIconRow}>
                  <IconCamera size={16} color="#1F5D3F" />
                  <Text style={styles.sectionTitle}>Preview</Text>
                </View>
                <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => {
                      setPhoto(null);
                      setZoom(0);
                      // Reset so onCameraReady fires again when CameraView re-mounts
                      isCameraReadyRef.current = false;
                      setIsCameraReady(false);
                    }}
                  >
                    <Text style={styles.secondaryText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={uploadPhoto} disabled={loading}>
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : (
                        <>
                          <IconUpload size={16} color="#fff" />
                          <Text style={[styles.primaryText, { marginLeft: 6 }]}>Upload to Desktop</Text>
                        </>
                      )
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Result */}
            {result && (
              <View style={[styles.resultCard, {
                borderLeftColor: result.success ? '#1F5D3F' : '#E24B4A',
                borderLeftWidth: 4,
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {result.success
                    ? <IconCheck size={16} color="#1F5D3F" />
                    : <IconX    size={16} color="#A32D2D" />
                  }
                  <Text style={{
                    color: result.success ? '#1F5D3F' : '#A32D2D',
                    fontFamily: 'Poppins_600SemiBold', flex: 1,
                  }}>
                    {result.message}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </View>
  );
}

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#F1F3EC', paddingTop: 52, paddingHorizontal: 14 },
  scrollContent: { paddingBottom: 36 },

  topbar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo:    { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1a1a1a', letterSpacing: 0.3 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ebebeb', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusBadgeActive: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#e6f4ec', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#b6dcc7',
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#555' },

  sessionBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e8f5ee', borderRadius: 8, padding: 9,
    marginBottom: 10, borderWidth: 1, borderColor: '#c3e3d1',
  },
  sessionText: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#1F5D3F' },

  card: {
    backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardIconRow:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#1a1a1a' },
  hint:         { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#666', lineHeight: 20 },

  fieldWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E2D8', borderRadius: 10,
    marginBottom: 8, overflow: 'hidden', backgroundColor: '#fafafa',
  },
  fieldIconWrap: { paddingHorizontal: 10, justifyContent: 'center' },
  fieldInput: {
    flex: 1, paddingVertical: 10, paddingRight: 12,
    fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#1a1a1a',
  },
  readonlyField: {
    flex: 1, paddingVertical: 10, paddingRight: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  readonlyLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#888', marginRight: 6 },
  readonlyValue: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#1a1a1a', flex: 1 },
  readonlyCheck: { marginLeft: 4 },

  input: {
    borderWidth: 1, borderColor: '#E0E2D8',
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },

  // cameraWrapper: explicit height, no backgroundColor â€” the CameraView fills it
  cameraWrapper: {
    height: 340,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    // NO backgroundColor here â€” letting the camera show through naturally
  },

  qrOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  qrFrame:   { width: 210, height: 210, position: 'relative', justifyContent: 'center', alignItems: 'center' },

  scanningBadge: {
    position: 'absolute', bottom: 18,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, gap: 8,
  },
  scanningText: { color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 13 },

  scanPromptBadge: {
    position: 'absolute', bottom: 18,
    backgroundColor: 'rgba(31,93,63,0.75)', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
  },
  scanPromptText: { color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 13 },

  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20,
  },
  cameraHint: {
    textAlign: 'center', fontSize: 11,
    color: '#8C9A8C', fontFamily: 'Poppins_400Regular', marginTop: 8,
  },

  zoomPill: {
    position: 'absolute', top: 12, left: '50%', marginLeft: -24,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  zoomPillText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  cornerTL: { position: 'absolute', top: 0,    left: 0,  width: 26, height: 26, borderTopWidth: 3,    borderLeftWidth: 3,  borderColor: 'rgba(255,255,255,0.9)', borderRadius: 3 },
  cornerTR: { position: 'absolute', top: 0,    right: 0, width: 26, height: 26, borderTopWidth: 3,    borderRightWidth: 3, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 3 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0,  width: 26, height: 26, borderBottomWidth: 3, borderLeftWidth: 3,  borderColor: 'rgba(255,255,255,0.9)', borderRadius: 3 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderBottomWidth: 3, borderRightWidth: 3, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 3 },

  captureBtn: {
    width: 68, height: 68, backgroundColor: '#fff', borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 5,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  captureBtnInner:    { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1F5D3F' },
  captureBtnDisabled: { backgroundColor: '#ccc', opacity: 0.6 },

  image: { height: 280, width: '100%', borderRadius: 10, marginBottom: 12 },
  row:   { flexDirection: 'row', gap: 10 },
  permissionButton: {
    marginTop: 18,
    width: '100%',
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#1F5D3F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignSelf: 'stretch',
    shadowColor: '#1F5D3F',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    includeFontPadding: false,
  },


  primaryBtn: {
    flex: 1, backgroundColor: '#1F5D3F', paddingVertical: 13,
    alignItems: 'center', borderRadius: 10,
    flexDirection: 'row', justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },

  secondaryBtn:  { flex: 1, backgroundColor: '#EAEAEA', paddingVertical: 13, alignItems: 'center', borderRadius: 10 },
  secondaryText: { color: '#333', fontFamily: 'Poppins_500Medium', fontSize: 14 },

  resultCard: { padding: 14, backgroundColor: '#fff', borderRadius: 10 },

  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F3EC' },
  permissionCard:  { padding: 28, alignItems: 'center' },
  permissionTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', marginBottom: 8, color: '#1a1a1a' },
  permissionSub:   { marginVertical: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center', color: '#555', lineHeight: 20 },
});








