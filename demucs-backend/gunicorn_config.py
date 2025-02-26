# Configurazione di base
bind = "0.0.0.0:5001"        # Indirizzo e porta su cui Gunicorn ascolta
workers = 2                   # Riduco a 2 worker per debug
worker_class = "sync"         # Usa worker sincroni
worker_connections = 1000     
timeout = 300                 
keepalive = 2                

# Logging
accesslog = "-"              # Output su stdout
errorlog = "-"              # Output su stderr
loglevel = "debug"          # Aumentiamo il livello di log per debug

# Security
limit_request_line = 4094     
limit_request_fields = 100    
limit_request_field_size = 8190  

# Reload automatico in development
reload = True                # Aggiungiamo questa opzione per il reload automatico