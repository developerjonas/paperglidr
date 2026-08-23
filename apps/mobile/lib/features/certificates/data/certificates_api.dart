// lib/features/certificates/data/certificates_api.dart
import 'dart:convert';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import 'certificate.dart';

class CertificatesApi {
  static Future<List<Certificate>> fetchMyCertificates() async {
    final res = await ApiClient.instance.get('$kApiV1/certificates');
    if (res.statusCode != 200) {
      throw Exception('Failed to load certificates (${res.statusCode})');
    }
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.map((e) => Certificate.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<Certificate> fetchCertificate(String certificateId) async {
    final res = await ApiClient.instance.get('$kApiV1/certificates/$certificateId');
    if (res.statusCode == 404) {
      throw Exception('Certificate not found');
    }
    if (res.statusCode != 200) {
      throw Exception('Failed to load certificate (${res.statusCode})');
    }
    return Certificate.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}