#!/bin/bash

SOURCE_ICON="src/assets/icon/icon.png"
DEST_DIR="ios/Kelimatik/Images.xcassets/AppIcon.appiconset"

# Ensure destination exists
mkdir -p "$DEST_DIR"

# Resize images using sips
# 20pt
sips -z 40 40   "$SOURCE_ICON" --out "$DEST_DIR/Icon-App-20x20@2x.png"
sips -z 60 60   "$SOURCE_ICON" --out "$DEST_DIR/Icon-App-20x20@3x.png"

# 29pt
sips -z 58 58   "$SOURCE_ICON" --out "$DEST_DIR/Icon-App-29x29@2x.png"
sips -z 87 87   "$SOURCE_ICON" --out "$DEST_DIR/Icon-App-29x29@3x.png"

# 40pt
sips -z 80 80   "$SOURCE_ICON" --out "$DEST_DIR/Icon-App-40x40@2x.png"
sips -z 120 120 "$SOURCE_ICON" --out "$DEST_DIR/Icon-App-40x40@3x.png"

# 60pt
sips -z 120 120 "$SOURCE_ICON" --out "$DEST_DIR/Icon-App-60x60@2x.png"
sips -z 180 180 "$SOURCE_ICON" --out "$DEST_DIR/Icon-App-60x60@3x.png"

# Marketing
sips -z 1024 1024 "$SOURCE_ICON" --out "$DEST_DIR/Icon-App-1024x1024.png"

echo "Images generated."

# Update Contents.json
cat > "$DEST_DIR/Contents.json" << EOF
{
  "images" : [
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "Icon-App-20x20@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "Icon-App-20x20@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "Icon-App-29x29@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "Icon-App-29x29@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "Icon-App-40x40@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "Icon-App-40x40@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "Icon-App-60x60@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "Icon-App-60x60@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "1024x1024",
      "idiom" : "ios-marketing",
      "filename" : "Icon-App-1024x1024.png",
      "scale" : "1x"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}
EOF

echo "Contents.json updated."
