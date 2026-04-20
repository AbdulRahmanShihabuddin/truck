# Truck HOS Planner

Full-stack React + Django app for deterministic trucking Hours of Service planning and ELD-style log generation.

## Run Locally

Backend:

```bash
python3 -m pip install -r backend/requirements.txt
python3 backend/manage.py migrate
python3 backend/manage.py runserver
```

Frontend:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Open `http://localhost:5173`.

## Tests

```bash
python3 backend/manage.py test
npm --prefix frontend test -- --run
npm --prefix frontend run build
```

## Notes

- Route distance is deterministic and offline. Supported city coordinates or explicit latitude/longitude inputs are used for all route estimates.
- Unknown free-text locations are rejected; enter a supported city or latitude/longitude coordinates.
- HOS planning follows the v1 assumptions documented in `docs/API.md`.
- Review/export uses browser print/save-to-PDF and JSON download. Archives and log remarks persist through Django.
