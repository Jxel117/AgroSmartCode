#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/certs"

PAIS="EC"
ESTADO="Loja"
ORG="AgroSmart"
CN_CA="AgroSmart-CA"
CN_SERVIDOR="localhost"   # debe coincidir con el host al que se conectan los clientes

echo "1. Generando clave y certificado de la CA..."
openssl genrsa -out ca.key 2048
openssl req -new -x509 -days 3650 -key ca.key -out ca.crt \
  -subj "/C=$PAIS/ST=$ESTADO/O=$ORG/CN=$CN_CA"

echo "2. Generando clave privada del servidor..."
openssl genrsa -out server.key 2048

echo "3. Generando solicitud de firma (CSR)..."
openssl req -new -key server.key -out server.csr \
  -subj "/C=$PAIS/ST=$ESTADO/O=$ORG/CN=$CN_SERVIDOR"

echo "4. Firmando el certificado del servidor con la CA..."
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out server.crt -days 3650 -sha256

rm -f server.csr
echo ""
echo "Listo. Certificados generados en mqtt/certs/:"
echo "  ca.crt     -> lo usan los clientes (backend, simulador, ESP32)"
echo "  server.crt -> lo usa el broker"
echo "  server.key -> lo usa el broker (privado, no compartir)"
