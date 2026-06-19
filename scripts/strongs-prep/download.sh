#!/usr/bin/env bash
# Re-download the raw public-domain / CC-BY-SA source data for the
# original-language word-study feature, then rebuild the bundled app data.
#
#   cd scripts/strongs-prep && ./download.sh && node build.cjs
#
# Sources:
#   OpenScriptures Strong's dictionaries (CC-BY-SA)
#   theonize MetaV KJV database (public domain text + Strong's tagging)
set -e
cd "$(dirname "$0")"
mkdir -p raw
cd raw

OS="https://raw.githubusercontent.com/openscriptures/strongs/master"
curl -sL -o hebrew.js "$OS/hebrew/strongs-hebrew-dictionary.js"
curl -sL -o greek.js  "$OS/greek/strongs-greek-dictionary.js"

MV="https://raw.githubusercontent.com/theonize/KJV-bible-database-with-metadata-MetaV-/master/CSV"
curl -sL -o MainIndex.csv    "$MV/MainIndex.csv"
curl -sL -o StrongsIndex.csv "$MV/StrongsIndex.csv"
curl -sL -o Strongs.csv      "$MV/Strongs.csv"
curl -sL -o Books.csv        "$MV/Books.csv"

echo "Downloaded. Now run: node build.cjs"
