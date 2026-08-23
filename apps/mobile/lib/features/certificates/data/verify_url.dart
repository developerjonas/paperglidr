// lib/features/certificates/data/verify_url.dart
import '../../../core/api_client.dart';

/// Points at the same public verify page your web app already renders
/// (apps/web/src/app/verify/[certificateCode]/page.tsx) — no need to
/// rebuild that UI natively, mobile just links out to it.
String verifyUrlFor(String certificateCode) => '$kApiBaseUrl/verify/$certificateCode';