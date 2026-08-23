-- Desy Nails — dati iniziali (listino, orari, calendario)
-- Idempotente: INSERT IGNORE non sovrascrive servizi già modificati dall'admin.

INSERT IGNORE INTO services (
  id, name, description, category, price_cents, price_from, is_addon,
  price_note, duration_minutes, bookable, active, sort_order
) VALUES
  ('manicure-semplice', 'Manicure Semplice', 'Cura e bellezza delle unghie naturali.', 'servizi', 1200, 0, 0, '', 30, 1, 1, 10),
  ('semipermanente', 'Semipermanente', 'Smalto semipermanente per un risultato duraturo.', 'servizi', 2500, 0, 0, '', 60, 1, 1, 20),
  ('semipermanente-rinforzato', 'Semipermanente Rinforzato', 'Semipermanente con rinforzo per unghie più resistenti.', 'servizi', 3000, 0, 0, '', 75, 1, 1, 30),
  ('copertura-gel', 'Copertura in Gel', 'Copertura in gel su unghia naturale.', 'servizi', 3500, 0, 0, '', 90, 1, 1, 40),
  ('ricostruzione-corta', 'Ricostruzione Corta (S)', 'Ricostruzione in gel, lunghezza corta.', 'servizi', 4500, 0, 0, '', 120, 1, 1, 50),
  ('ricostruzione-media-lunga', 'Ricostruzione Media / Lunga (M-L)', 'Ricostruzione in gel, lunghezza media o lunga.', 'servizi', 5000, 1, 0, '', 150, 1, 1, 60),
  ('refil-gel', 'Refil Copertura in Gel', 'Refill copertura in gel (entro 4 settimane).', 'refill', 3000, 0, 0, 'Entro 4 settimane', 75, 1, 1, 110),
  ('refil-corta', 'Refil Ricostruzione Corta (S)', 'Refill ricostruzione corta (entro 4 settimane).', 'refill', 3500, 0, 0, 'Entro 4 settimane', 90, 1, 1, 120),
  ('refil-media-lunga', 'Refil Ricostruzione Media/Lunga (M-L)', 'Refill ricostruzione media/lunga (entro 4 settimane).', 'refill', 4000, 0, 0, 'Entro 4 settimane', 105, 1, 1, 130),
  ('rimozione-mia', 'Rimozione del mio lavoro + nuovo servizio', 'Rimozione del lavoro eseguito in studio, inclusa se seguita da un nuovo servizio.', 'refill', 0, 0, 1, 'Inclusa', 15, 0, 1, 140),
  ('rimozione-altra', 'Rimozione lavoro di altra onicotecnica + nuovo servizio', 'Rimozione di un lavoro eseguito da un''altra onicotecnica, se seguita da un nuovo servizio.', 'refill', 500, 0, 1, '', 20, 0, 1, 150),
  ('rimozione-completa', 'Rimozione completa senza nuovo servizio', 'Rimozione completa senza applicazione di un nuovo servizio.', 'refill', 1000, 0, 0, '', 45, 1, 1, 160),
  ('riparazione', 'Riparazione unghia', 'Riparazione di una singola unghia.', 'extra', 300, 0, 1, '', 15, 0, 1, 210),
  ('french', 'French', 'French classica in aggiunta al servizio.', 'extra', 500, 0, 1, '', 20, 0, 1, 220),
  ('babyboomer', 'Babyboomer', 'Sfumatura babyboomer in aggiunta al servizio.', 'extra', 500, 0, 1, '', 25, 0, 1, 230),
  ('nail-art-semplice', 'Nail Art Semplice', 'Decorazione semplice, prezzo ad unghia.', 'extra', 100, 0, 1, 'ad unghia', 10, 0, 1, 240),
  ('nail-art-elaborata', 'Nail Art Elaborata', 'Decorazione elaborata, da valutare in base al disegno.', 'extra', 500, 1, 1, '', 20, 0, 1, 250);

INSERT IGNORE INTO settings (`key`, value) VALUES
  ('studio_name', 'Desy Nails'),
  ('studio_full_name', 'Desiree Tropini Studio'),
  ('tagline', 'ogni dettaglio, la mia passione'),
  ('instagram', '__desy.nails__'),
  ('phone', ''),
  ('address', ''),
  ('timezone', 'Europe/Rome'),
  ('slot_interval', '30'),
  ('buffer_minutes', '0'),
  ('calendar_token', CONCAT('desy-', REPLACE(UUID(), '-', ''))),
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
  }');

UPDATE settings SET value = '__desy.nails__' WHERE `key` = 'instagram' AND value IN ('desy.nails', '');
