-- Desy Nails — dati iniziali (listino, orari, calendario)
-- Idempotente: ON CONFLICT non sovrascrive servizi già modificati dall'admin.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO services (
  id, name, description, category, price_cents, price_from, is_addon,
  price_note, duration_minutes, bookable, active, sort_order
) VALUES
  ('manicure-semplice', 'Manicure Semplice', 'Cura e bellezza delle unghie naturali.', 'servizi', 1200, FALSE, FALSE, '', 30, TRUE, TRUE, 10),
  ('semipermanente', 'Semipermanente', 'Smalto semipermanente per un risultato duraturo.', 'servizi', 2500, FALSE, FALSE, '', 60, TRUE, TRUE, 20),
  ('semipermanente-rinforzato', 'Semipermanente Rinforzato', 'Semipermanente con rinforzo per unghie più resistenti.', 'servizi', 3000, FALSE, FALSE, '', 75, TRUE, TRUE, 30),
  ('copertura-gel', 'Copertura in Gel', 'Copertura in gel su unghia naturale.', 'servizi', 3500, FALSE, FALSE, '', 90, TRUE, TRUE, 40),
  ('ricostruzione-corta', 'Ricostruzione Corta (S)', 'Ricostruzione in gel, lunghezza corta.', 'servizi', 4500, FALSE, FALSE, '', 120, TRUE, TRUE, 50),
  ('ricostruzione-media-lunga', 'Ricostruzione Media / Lunga (M-L)', 'Ricostruzione in gel, lunghezza media o lunga.', 'servizi', 5000, TRUE, FALSE, '', 150, TRUE, TRUE, 60),

  ('refil-gel', 'Refil Copertura in Gel', 'Refill copertura in gel (entro 4 settimane).', 'refill', 3000, FALSE, FALSE, 'Entro 4 settimane', 75, TRUE, TRUE, 110),
  ('refil-corta', 'Refil Ricostruzione Corta (S)', 'Refill ricostruzione corta (entro 4 settimane).', 'refill', 3500, FALSE, FALSE, 'Entro 4 settimane', 90, TRUE, TRUE, 120),
  ('refil-media-lunga', 'Refil Ricostruzione Media/Lunga (M-L)', 'Refill ricostruzione media/lunga (entro 4 settimane).', 'refill', 4000, FALSE, FALSE, 'Entro 4 settimane', 105, TRUE, TRUE, 130),
  ('rimozione-mia', 'Rimozione del mio lavoro + nuovo servizio', 'Rimozione del lavoro eseguito in studio, inclusa se seguita da un nuovo servizio.', 'refill', 0, FALSE, TRUE, 'Inclusa', 15, FALSE, TRUE, 140),
  ('rimozione-altra', 'Rimozione lavoro di altra onicotecnica + nuovo servizio', 'Rimozione di un lavoro eseguito da un''altra onicotecnica, se seguita da un nuovo servizio.', 'refill', 500, FALSE, TRUE, '', 20, FALSE, TRUE, 150),
  ('rimozione-completa', 'Rimozione completa senza nuovo servizio', 'Rimozione completa senza applicazione di un nuovo servizio.', 'refill', 1000, FALSE, FALSE, '', 45, TRUE, TRUE, 160),

  ('riparazione', 'Riparazione unghia', 'Riparazione di una singola unghia.', 'extra', 300, FALSE, TRUE, '', 15, FALSE, TRUE, 210),
  ('french', 'French', 'French classica in aggiunta al servizio.', 'extra', 500, FALSE, TRUE, '', 20, FALSE, TRUE, 220),
  ('babyboomer', 'Babyboomer', 'Sfumatura babyboomer in aggiunta al servizio.', 'extra', 500, FALSE, TRUE, '', 25, FALSE, TRUE, 230),
  ('nail-art-semplice', 'Nail Art Semplice', 'Decorazione semplice, prezzo ad unghia.', 'extra', 100, FALSE, TRUE, 'ad unghia', 10, FALSE, TRUE, 240),
  ('nail-art-elaborata', 'Nail Art Elaborata', 'Decorazione elaborata, da valutare in base al disegno.', 'extra', 500, TRUE, TRUE, '', 20, FALSE, TRUE, 250)
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (key, value) VALUES
  ('studio_name', 'Desy Nails'),
  ('studio_full_name', 'Desiree Tropini Studio'),
  ('tagline', 'ogni dettaglio, la mia passione'),
  ('instagram', '__desy.nails__'),
  ('phone', ''),
  ('address', ''),
  ('timezone', 'Europe/Rome'),
  ('slot_interval', '30'),
  ('buffer_minutes', '0'),
  ('calendar_token', 'desy-' || replace(gen_random_uuid()::text, '-', '')),
  ('caldav_url', ''),
  ('caldav_username', ''),
  ('caldav_password', ''),
  ('caldav_calendar_url', ''),
  ('working_hours', '{
    "0": [],
    "1": [],
    "2": [{"start":"09:30","end":"19:00"}],
    "3": [{"start":"09:30","end":"19:00"}],
    "4": [{"start":"09:30","end":"19:00"}],
    "5": [{"start":"09:30","end":"19:00"}],
    "6": [{"start":"09:30","end":"17:00"}]
  }')
ON CONFLICT (key) DO NOTHING;

UPDATE settings SET value = '__desy.nails__' WHERE key = 'instagram' AND value IN ('desy.nails', '');
