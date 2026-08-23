// lib/features/certificates/data/certificate.dart
class Certificate {
  final String id;
  final String certificateCode;
  final String courseId;
  final String? userNameSnapshot; // only present on the detail fetch
  final String courseTitleSnapshot;
  final String instructorNameSnapshot;
  final int courseDurationMinutesSnapshot;
  final DateTime issuedAt;
  final DateTime? revokedAt;
  final String? revokedReason;

  bool get isRevoked => revokedAt != null;

  Certificate({
    required this.id,
    required this.certificateCode,
    required this.courseId,
    this.userNameSnapshot,
    required this.courseTitleSnapshot,
    required this.instructorNameSnapshot,
    required this.courseDurationMinutesSnapshot,
    required this.issuedAt,
    this.revokedAt,
    this.revokedReason,
  });

  factory Certificate.fromJson(Map<String, dynamic> json) {
    return Certificate(
      id: json['id'] as String,
      certificateCode: json['certificateCode'] as String? ?? '',
      courseId: json['courseId'] as String? ?? '',
      userNameSnapshot: json['userNameSnapshot'] as String?,
      courseTitleSnapshot: json['courseTitleSnapshot'] as String? ?? '',
      instructorNameSnapshot: json['instructorNameSnapshot'] as String? ?? '',
      courseDurationMinutesSnapshot: json['courseDurationMinutesSnapshot'] as int? ?? 0,
      issuedAt: DateTime.tryParse(json['issuedAt'] as String? ?? '') ?? DateTime.now(),
      revokedAt: json['revokedAt'] != null ? DateTime.tryParse(json['revokedAt'] as String) : null,
      revokedReason: json['revokedReason'] as String?,
    );
  }
}