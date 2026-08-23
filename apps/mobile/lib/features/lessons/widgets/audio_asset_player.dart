// lib/features/lessons/widgets/audio_asset_player.dart
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import '../../../core/auth/request_headers.dart';

class AudioAssetPlayer extends StatefulWidget {
  final String url;
  const AudioAssetPlayer({super.key, required this.url});

  @override
  State<AudioAssetPlayer> createState() => _AudioAssetPlayerState();
}

class _AudioAssetPlayerState extends State<AudioAssetPlayer> {
  final _player = AudioPlayer();
  bool _ready = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final headers = await RequestHeaders.auth();
      await _player.setAudioSource(AudioSource.uri(Uri.parse(widget.url), headers: headers));
      if (mounted) setState(() => _ready = true);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Text('Could not load audio.\n$_error', style: const TextStyle(color: Colors.red));
    }
    if (!_ready) return const Center(child: CircularProgressIndicator());

    return StreamBuilder<PlayerState>(
      stream: _player.playerStateStream,
      builder: (context, snapshot) {
        final playing = snapshot.data?.playing ?? false;
        return Row(
          children: [
            IconButton(
              icon: Icon(playing ? Icons.pause_circle : Icons.play_circle, size: 40),
              onPressed: () => playing ? _player.pause() : _player.play(),
            ),
            Expanded(
              child: StreamBuilder<Duration>(
                stream: _player.positionStream,
                builder: (context, posSnapshot) {
                  final pos = posSnapshot.data ?? Duration.zero;
                  final total = _player.duration ?? Duration.zero;
                  return Slider(
                    value: pos.inMilliseconds.clamp(0, total.inMilliseconds).toDouble(),
                    max: total.inMilliseconds.toDouble().clamp(1, double.infinity),
                    onChanged: (v) => _player.seek(Duration(milliseconds: v.round())),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}