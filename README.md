# Demucs GUI

Un'interfaccia grafica per Demucs, uno strumento per la separazione delle tracce musicali. Questa applicazione permette di caricare un file audio e separarlo nelle sue componenti: voce, batteria, basso e altri strumenti.

## 🚀 Caratteristiche

- Interfaccia web intuitiva
- Separazione delle tracce in tempo reale
- Anteprima audio delle tracce separate
- Download delle singole tracce
- Supporto per vari formati audio

## 📋 Prerequisiti

- Python 3.8 o superiore
- npm (Node Package Manager)
- Git

## 💻 Installazione Rapida

1. Clona il repository:

```bash
git clone <url-del-repository>
cd demucs-gui
```

2. Esegui lo script di installazione automatica:

```bash
chmod +x install_and_run.sh
./install_and_run.sh
```

3. Apri il browser e vai a:
```
http://localhost:5173
```

## 🛠 Installazione Manuale

Se preferisci installare manualmente, segui questi passaggi:

### Backend

```bash
cd demucs-backend
python3 -m venv .venv
source .venv/bin/activate  # Su Windows: .venv\Scripts\activate
pip install -r requirements.txt
gunicorn -c gunicorn_config.py app:app
```

### Frontend

```bash
cd demucs-gui
npm install
npm run dev
```

## 🏗 Struttura del Progetto

```
demucs-gui/
├── demucs-backend/     # Server Flask
│   ├── app.py         # Entry point del backend
│   └── requirements.txt
├── demucs-gui/        # Client React
│   ├── src/          # Codice sorgente frontend
│   └── package.json
└── install_and_run.sh # Script di installazione
```

## 🔧 Tecnologie Utilizzate

- **Backend**: 
  - Flask (Python)
  - Gunicorn
  - Demucs

- **Frontend**:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS

## 🤝 Contribuire

Le pull request sono benvenute. Per modifiche importanti, apri prima un issue per discutere cosa vorresti cambiare.

## 📝 Licenza

[MIT](https://choosealicense.com/licenses/mit/)

## 👥 Autori

- huchukato 
  - 🐙 [GitHub](https://github.com/huchukato)
  - 🐦 [X (Twitter)](https://twitter.com/huchukato)
  - 🎨 [Civitai](https://civitai.com/user/huchukato) - Check out my AI art models!

## 🙏 Ringraziamenti

- [Facebook Research](https://github.com/facebookresearch/demucs) per Demucs
