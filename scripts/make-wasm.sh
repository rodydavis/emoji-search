#!/bin/bash

cd third_party/emsdk
./emsdk install latest
./emsdk activate latest
source "/Users/rodydavis/Developer/@sqlite/emoji-search/third_party/emsdk/emsdk_env.sh"
cd ../..

cd third_party/sqlite-vec
./scripts/vendor.sh
make sqlite-vec.h
make wasm
cd ../..

cp third_party/sqlite-vec/dist/.wasm/sqlite3.mjs public/sqlite3.mjs
cp third_party/sqlite-vec/dist/.wasm/sqlite3.wasm public/sqlite3.wasm
