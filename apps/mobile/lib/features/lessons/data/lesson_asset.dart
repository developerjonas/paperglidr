// lib/features/lessons/data/lesson_asset.dart
enum AssetType { youtube, videoFile, pdf, image, audio, unknown }
enum AssetRole { primary, attachment }

AssetType _parseType(String? s) {
  switch (s) {
    case 'youtube': return AssetType.youtube;
    case 'video_file': return AssetType.videoFile;
    case 'pdf': return AssetType.pdf;
    case 'image': return AssetType.image;
    case 'audio': return AssetType.audio;
    default: return AssetType.unknown;
  }
}

class LessonAsset {
  final String id;
  final AssetType type;
  final AssetRole role;
  final String? externalId; // youtube video id
  final String? fileName;
  final int? fileSizeBytes;
  final bool downloadable;
  final int? durationSeconds;

  LessonAsset({
    required this.id,
    required this.type,
    required this.role,
    this.externalId,
    this.fileName,
    this.fileSizeBytes,
    required this.downloadable,
    this.durationSeconds,
  });

  factory LessonAsset.fromJson(Map<String, dynamic> json) {
    return LessonAsset(
      id: json['id'] as String,
      type: _parseType(json['type'] as String?),
      role: (json['role'] as String?) == 'attachment' ? AssetRole.attachment : AssetRole.primary,
      externalId: json['externalId'] as String?,
      fileName: json['fileName'] as String?,
      fileSizeBytes: json['fileSizeBytes'] as int?,
      downloadable: json['downloadable'] as bool? ?? false,
      durationSeconds: json['durationSeconds'] as int?,
    );
  }
}