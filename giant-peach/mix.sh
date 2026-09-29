#!/bin/bash
# Voiceover + score (ducked under the voice) + effects, normalized to -16 LUFS (storytelling / YouTube).
FF=${FF:-ffmpeg}
cd "$(dirname "$0")"
MG=${MG:-1.25}; FG=${FG:-0.95}
$FF -loglevel error -y -i music.wav -i sfx.wav -i assets/voiceover.mp3 -filter_complex "\
[2:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=5:release=120:makeup=2,apad=whole_dur=121.5,asplit=2[vo][vosc];\
[0:a]volume=$MG[m];[m][vosc]sidechaincompress=threshold=0.03:ratio=5:attack=40:release=500[mduck];\
[1:a]volume=$FG[fx];\
[vo][mduck][fx]amix=inputs=3:normalize=0,atrim=0:121.5,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[out]" -map "[out]" -c:a pcm_s16le master.wav
$FF -loglevel error -y -i master.wav -c:a aac -b:a 192k assets/giant-peach-audio.m4a
$FF -loglevel error -y -i master.wav -c:a libmp3lame -b:a 256k assets/giant-peach-audio.mp3
