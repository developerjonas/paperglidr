import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { parseCertificateCode } from '@/lib/certificates';

/**
 * Check a certificate: scan its QR code (it holds the verify link) or type
 * its code. Anyone can do this — no account needed.
 */
export default function VerifyScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  function open(raw: string) {
    const parsed = parseCertificateCode(raw);
    if (!parsed) {
      setError("That isn't a Chiyali certificate code. It looks like CERT- followed by 10 letters and numbers.");
      return false;
    }
    setError(null);
    router.push(`/verify/${parsed}`);
    return true;
  }

  function onScan(result: BarcodeScanningResult) {
    // The camera reports the same code many times a second: act once.
    if (handled.current) return;
    handled.current = true;
    open(result.data);
    setTimeout(() => (handled.current = false), 1500);
  }

  const cameraAvailable = Platform.OS !== 'web';

  return (
    <>
      <Stack.Screen options={{ title: 'Verify a certificate' }} />
      <Screen>
        <ThemedText type="subtitle">Verify a certificate</ThemedText>
        <ThemedText themeColor="textSecondary">
          Point the camera at the QR code on a Chiyali certificate, or type the code printed under it.
        </ThemedText>

        {cameraAvailable ? (
          permission?.granted ? (
            <View style={styles.camera}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onScan}
              />
              <View pointerEvents="none" style={styles.frame} />
            </View>
          ) : (
            <ThemedView type="backgroundElement" style={styles.permission}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {permission && !permission.canAskAgain
                  ? 'Camera access is off for Chiyali. Turn it on in Settings, or type the code below.'
                  : 'Allow camera access to scan a certificate QR code.'}
              </ThemedText>
              {!permission || permission.canAskAgain ? (
                <Button title="Allow camera" onPress={() => void requestPermission()} />
              ) : null}
            </ThemedView>
          )
        ) : null}

        <TextField
          label="Certificate code"
          value={code}
          onChangeText={setCode}
          placeholder="CERT-XXXXXXXXXX"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => open(code)}
        />
        <FormMessage message={error} />
        <Button title="Check certificate" onPress={() => open(code)} disabled={!code.trim()} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  camera: { width: '100%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  frame: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    right: '20%',
    bottom: '20%',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
  },
  permission: { borderRadius: 16, padding: Spacing.four, gap: Spacing.three, alignItems: 'center' },
  center: { textAlign: 'center' },
});
