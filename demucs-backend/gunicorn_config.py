# Configurazione di base
bind = "0.0.0.0:5000"        # Indirizzo e porta su cui Gunicorn ascolta
workers = 4                   # Numero fisso di worker processes
worker_class = "sync"         # Usa worker sincroni, buono per operazioni I/O come il processing di file
worker_connections = 1000     # Numero massimo di connessioni attive simultanee per worker
timeout = 300                 # Timeout di 5 minuti, appropriato per il processing audio
keepalive = 2                # Tempo in secondi per mantenere aperte le connessioni client

# Logging
accesslog = "access.log"      # Log delle richieste HTTP
errorlog = "error.log"        # Log degli errori
loglevel = "info"            # Livello di dettaglio dei log

# Security
limit_request_line = 4094     # Limite massimo lunghezza della request line
limit_request_fields = 100    # Numero massimo di header HTTP
limit_request_field_size = 8190  # Dimensione massima di ogni header HTTP