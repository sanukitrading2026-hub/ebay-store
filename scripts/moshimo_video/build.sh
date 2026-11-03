#!/bin/bash
# もしもナビ紹介動画（v3：人物イラスト＋オリジナルのメロディー）を作り、videos/moshimo_v3.mp4 に置く
set -euo pipefail
D="$(cd "$(dirname "$0")" && pwd)"; cd "$D"
node render.js /tmp/mv_video.mp4
python3 synth.py /tmp/mv_melody.wav 28.8
ffmpeg -y -loglevel error -i /tmp/mv_video.mp4 -i /tmp/mv_melody.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart /tmp/mv_out.mp4
mv /tmp/mv_out.mp4 "$D/../../videos/moshimo_v3.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of compact "$D/../../videos/moshimo_v3.mp4"
