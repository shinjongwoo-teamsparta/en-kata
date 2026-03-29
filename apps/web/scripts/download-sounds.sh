#!/bin/bash
# Download and convert sound assets from Monkeytype (MIT License)
# Source: https://github.com/monkeytypegame/monkeytype

set -euo pipefail

BASE_URL="https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/sound"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/sounds"
TMP_DIR=$(mktemp -d)

trap "rm -rf $TMP_DIR" EXIT

echo "=== Downloading Monkeytype sound assets ==="

# Preset mapping:
#   soft       -> click3 (pop)         - 3 variations
#   mechanical -> click4 (nk creams)   - 6 keydown variations
#   retro      -> click5 (typewriter)  - 6 keydown variations
#   minimal    -> click1 (click)       - 3 variations
# Error sounds -> error1 (damage)

declare -A PRESET_MAP
PRESET_MAP[soft]="click3"
PRESET_MAP[mechanical]="click4"
PRESET_MAP[retro]="click5"
PRESET_MAP[minimal]="click1"

# Download a file
download() {
  local url="$1"
  local dest="$2"
  echo "  Downloading: $(basename "$url")"
  curl -sL "$url" -o "$dest"
}

# Convert WAV to MP3 (64kbps mono)
to_mp3() {
  local input="$1"
  local output="$2"
  ffmpeg -y -i "$input" -ac 1 -ab 64k -ar 44100 "$output" 2>/dev/null
}

# --- Download and convert key sounds ---
for preset in soft mechanical retro minimal; do
  src="${PRESET_MAP[$preset]}"
  dest_dir="$OUT_DIR/$preset"
  mkdir -p "$dest_dir"

  echo ""
  echo "--- $preset (from $src) ---"

  if [[ "$src" == "click3" || "$src" == "click1" ]]; then
    # Simple packs: 3 variations, single files
    for i in 1 2 3; do
      download "$BASE_URL/$src/${src}_${i}.wav" "$TMP_DIR/${src}_${i}.wav"
      to_mp3 "$TMP_DIR/${src}_${i}.wav" "$dest_dir/key${i}.mp3"
    done
    # Duplicate first as key4 for 4 variations
    cp "$dest_dir/key1.mp3" "$dest_dir/key4.mp3"

  elif [[ "$src" == "click4" || "$src" == "click5" ]]; then
    # Paired packs: use keydown sounds only (_N.wav, skip _NN.wav keyup)
    for i in 1 2 3 4; do
      download "$BASE_URL/$src/${src}_${i}.wav" "$TMP_DIR/${src}_${i}.wav"
      to_mp3 "$TMP_DIR/${src}_${i}.wav" "$dest_dir/key${i}.mp3"
    done
  fi

  echo "  Key sounds ready: key1-4.mp3"
done

# --- Download error sound ---
echo ""
echo "--- Error sound (from error1) ---"
download "$BASE_URL/error1/error1_1.wav" "$TMP_DIR/error1_1.wav"

for preset in soft mechanical retro minimal; do
  to_mp3 "$TMP_DIR/error1_1.wav" "$OUT_DIR/$preset/error.mp3"
done
echo "  Error sound ready for all presets"

# --- Generate complete sounds using ffmpeg ---
echo ""
echo "--- Generating complete (chime) sounds ---"

# Generate a pleasant two-tone chime for word completion
# Different character per preset
generate_chime() {
  local output="$1"
  local freq1="$2"
  local freq2="$3"
  local wave="$4"

  ffmpeg -y \
    -f lavfi -i "sine=frequency=${freq1}:duration=0.12" \
    -f lavfi -i "sine=frequency=${freq2}:duration=0.12" \
    -filter_complex "[0]afade=t=out:st=0.06:d=0.06[a];[1]adelay=80|80,afade=t=out:st=0.06:d=0.06[b];[a][b]amix=inputs=2:duration=longest,volume=0.5" \
    -ac 1 -ab 64k -ar 44100 "$output" 2>/dev/null
}

generate_chime "$OUT_DIR/soft/complete.mp3" 523 784 sine
generate_chime "$OUT_DIR/mechanical/complete.mp3" 440 660 sine
generate_chime "$OUT_DIR/retro/complete.mp3" 392 587 sine
generate_chime "$OUT_DIR/minimal/complete.mp3" 600 900 sine

echo "  Complete sounds ready for all presets"

# --- Summary ---
echo ""
echo "=== Done! ==="
echo "Files placed in: $OUT_DIR"
echo ""
for preset in soft mechanical retro minimal; do
  echo "$preset/:"
  ls -lh "$OUT_DIR/$preset/" | grep -v total
  echo ""
done
