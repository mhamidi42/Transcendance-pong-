#!/bin/bash

set -e

echo "🔍 Détection automatique de l'IP réseau..."

HOST_IP=$(ip -4 addr show \
	| grep -oP '(?<=inet\s)\d+(\.\d+){3}' \
	| grep -v 127.0.0.1 \
	| head -n 1)

if [ -z "$HOST_IP" ]; then
	echo "❌ Impossible de détecter une IP réseau"
	exit 1
fi

echo "✅ IP détectée : $HOST_IP"

sed -i '/^HOST_IP=/d' .env

echo "HOST_IP=$HOST_IP" >> .env

echo "🚀 Lancement Docker..."
docker compose up -d --build
