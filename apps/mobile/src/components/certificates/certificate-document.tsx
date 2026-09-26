import { StyleSheet, View } from 'react-native';

import { QrCode } from '@/components/certificates/qr-code';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const GOLD = '#b8860b';
const RED = '#dc2626';

/**
 * The certificate, as the website's CertificateDocument: title, name,
 * course, instructor, seal, date issued, code and a QR to verify it; a
 * REVOKED stamp when revoked. Always on paper-white, like a printout.
 */
export function CertificateDocument({
  certificate,
  isRevoked,
  qrValue,
}: {
  certificate: {
    certificateCode: string;
    userNameSnapshot: string;
    courseTitleSnapshot: string;
    instructorNameSnapshot: string;
    issuedAt: string;
  };
  isRevoked: boolean;
  /** The verify link to encode; no QR when absent. */
  qrValue?: string;
}) {
  const accent = isRevoked ? RED : GOLD;
  const issued = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.paper, { borderColor: accent }]}>
      <View style={[styles.inner, { borderColor: accent }]}>
        <Text2 style={[styles.eyebrow, { color: accent }]}>CERTIFICATE OF COMPLETION</Text2>
        <Text2 style={styles.muted}>This certifies that</Text2>
        <Text2 style={styles.name}>{certificate.userNameSnapshot}</Text2>
        <Text2 style={styles.muted}>has successfully completed all requirements of the course</Text2>
        <Text2 style={styles.course}>{certificate.courseTitleSnapshot}</Text2>

        <View style={styles.footer}>
          <View style={styles.footerCell}>
            <Text2 style={styles.footerValue}>{certificate.instructorNameSnapshot}</Text2>
            <View style={styles.line} />
            <Text2 style={styles.footerLabel}>Instructor</Text2>
          </View>
          <View style={[styles.seal, { borderColor: accent }]}>
            <Text2 style={[styles.sealText, { color: accent }]}>{isRevoked ? 'Revoked' : 'Verified'}</Text2>
          </View>
          <View style={styles.footerCell}>
            <Text2 style={styles.footerValue}>{issued}</Text2>
            <View style={styles.line} />
            <Text2 style={styles.footerLabel}>Date Issued</Text2>
          </View>
        </View>

        {qrValue ? (
          <View style={styles.qr}>
            <QrCode value={qrValue} size={132} />
            <Text2 style={styles.footerLabel}>Scan to verify</Text2>
          </View>
        ) : null}
        <Text2 style={styles.code}>{certificate.certificateCode}</Text2>

        {isRevoked ? (
          <View pointerEvents="none" style={styles.stampWrap}>
            <Text2 style={styles.stamp}>REVOKED</Text2>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Fixed dark ink: the certificate is always paper-white, in dark mode too.
function Text2({ style, children }: { style?: object; children: React.ReactNode }) {
  return <ThemedText style={[{ color: '#1f2937' }, style]}>{children}</ThemedText>;
}

const styles = StyleSheet.create({
  paper: { backgroundColor: '#fffdf7', borderWidth: 2, borderRadius: 8, padding: 6 },
  inner: { borderWidth: 1, borderRadius: 4, padding: Spacing.four, alignItems: 'center', gap: Spacing.two },
  eyebrow: { fontSize: 13, letterSpacing: 2, fontWeight: '700', textAlign: 'center' },
  muted: { fontSize: 14, color: '#4b5563', textAlign: 'center' },
  name: { fontSize: 28, lineHeight: 34, fontWeight: '700', textAlign: 'center', marginVertical: Spacing.one },
  course: { fontSize: 20, lineHeight: 26, fontWeight: '600', textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.four, width: '100%' },
  footerCell: { flex: 1, alignItems: 'center', gap: 4 },
  footerValue: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  line: { height: 1, alignSelf: 'stretch', backgroundColor: '#9ca3af' },
  footerLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center' },
  seal: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  sealText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  qr: { alignItems: 'center', gap: 4, marginTop: Spacing.three },
  code: { fontSize: 12, color: '#6b7280', letterSpacing: 1, marginTop: Spacing.two, fontFamily: 'monospace' },
  stampWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  stamp: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 8,
    color: 'rgba(220,38,38,0.55)',
    borderWidth: 4,
    borderColor: 'rgba(220,38,38,0.55)',
    paddingHorizontal: Spacing.three,
    transform: [{ rotate: '-18deg' }],
  },
});
