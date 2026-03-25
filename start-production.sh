#!/bin/bash

# Script de inicialização permanente para Guru 2

export NODE_ENV=production
export JWT_SECRET=guru_secret_key_2026_test_manus_deployment
export ADMIN_EMAIL=admin@raphaguru.com
export ADMIN_PASSWORD=Admin@2024
export SUPERADMIN_BOOTSTRAP_USER=superadmin
export SUPERADMIN_BOOTSTRAP_PASSWORD=TroqueAgora!2026
export SUPERADMIN_BOOTSTRAP_CODE=246810
export SUPERADMIN_COOKIE_NAME=rg_superadmin
export SUPERADMIN_SESSION_TTL_MINUTES=480
export SUPERADMIN_REQUIRE_PASSWORD_CHANGE=true

cd /home/ubuntu/guru_2_project

# Log de inicialização
echo "[$(date)] Iniciando Guru 2 - Football Tips Pro"
echo "[$(date)] Ambiente: $NODE_ENV"
echo "[$(date)] Diretório: $(pwd)"

# Iniciar o servidor
node dist/index.js
