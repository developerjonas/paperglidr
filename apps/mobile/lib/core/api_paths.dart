// lib/core/api_paths.dart
/// Central place for API route prefixes. Every feature's data/ file should
/// build paths off kApiV1 rather than hardcoding '/api/...' directly, so
/// bumping to v2 later is a one-line change here instead of a repo-wide
/// find-and-replace.
const String kApiV1 = '/api/v1';