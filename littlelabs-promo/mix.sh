#!/bin/bash
# Mixes voiceover + music (ducked under the voice) + effects to -14 LUFS.
FF=${FF:-ffmpeg}
cd "$(dirname "$0")"
$FF -loglevel error -y -i music.wav -i sfx.wav -i assets/voiceover.mp3 -filter_complex "\
[2:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=100:makeup=2,apad=whole_dur=25.5,asplit=2[vo][vosc];\
[0:a]volume=0.45[m];[m][vosc]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350[mduck];\
[1:a]volume=0.55[fx];\
[vo][mduck][fx]amix=inputs=3:normalize=0,atrim=0:25.5,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]" -map "[out]" -c:a pcm_s16le master.wav
$FF -loglevel error -y -i master.wav -c:a aac -b:a 192k assets/littlelabs-promo-audio.m4a
$FF -loglevel error -y -i master.wav -c:a libmp3lame -b:a 256k assets/littlelabs-promo-audio.mp3
