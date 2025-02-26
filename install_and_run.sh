#!/bin/bash

echo "🚀 Inizializzazione dell'applicazione Demucs GUI..."

# Verifica dei prerequisiti
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 è richiesto ma non è installato."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm è richiesto ma non è installato."; exit 1; }

# Creazione e attivazione dell'ambiente virtuale per il backend
echo "🐍 Configurazione del backend..."
cd demucs-backend
python3 -m venv .venv
source .venv/bin/activate

# Installazione delle dipendenze del backend
echo "📦 Installazione dipendenze Python..."
pip install -r requirements.txt

# Creazione delle cartelle necessarie
mkdir -p temp separated

# Configurazione e avvio del frontend
echo "⚛️ Configurazione del frontend..."
cd ../demucs-gui
echo "📦 Installazione dipendenze npm..."
npm install

# Avvio dei servizi
echo "🎯 Avvio dei servizi..."

# Avvio del backend con gunicorn
cd ../demucs-backend
source .venv/bin/activate
gunicorn -c gunicorn_config.py app:app &
BACKEND_PID=$!

# Avvio del frontend
cd ../demucs-gui
npm run dev &
FRONTEND_PID=$!

echo "✨ Applicazione avviata!"
echo "📝 Backend running on http://localhost:5001"
echo "🌐 Frontend running on http://localhost:5173"
echo "Per terminare l'applicazione, premi CTRL+C"

# Gestione della chiusura pulita
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT TERM

# Mantiene lo script in esecuzione
wait 