# Miastometr

Porównywarka polskich miast na prawach powiatu — wynagrodzenia, ludność, bezrobocie i jakość powietrza, oparta wyłącznie na publicznych, bezpłatnych danych rządowych:

- **GUS BDL** (Bank Danych Lokalnych, bdl.stat.gov.pl) — przeciętne wynagrodzenie brutto, stan ludności, liczba zarejestrowanych bezrobotnych.
- **GIOŚ** (api.gios.gov.pl) — bieżący indeks jakości powietrza ze stacji pomiarowych.

Strona jest statyczna (HTML/CSS/JS, brak frameworka, brak backendu) i publikowana przez GitHub Pages z katalogu `docs/`.

## Struktura

- `docs/` — publikowana strona (`index.html`, `styles.css`, `app.js`, `data/cities.json`).
- `data/*.mjs` — skrypty pipeline'u danych:
  - `fetch.mjs` — lista miast na prawach powiatu (GUS BDL `/units`) + mapowanie na jednostki poziomu gminy.
  - `fetch-vars.mjs` — pobiera pełne szeregi danych (wynagrodzenie, ludność, bezrobocie) z GUS BDL `/data/by-variable`.
  - `fetch-gios.mjs` — pobiera stacje i bieżący indeks jakości powietrza z GIOŚ.
  - `build-dataset.mjs` — łączy wszystko w `docs/data/cities.json`.

## Odświeżanie danych

```
node data/fetch.mjs
node data/fetch-vars.mjs
node data/fetch-gios.mjs
node data/build-dataset.mjs
```

GUS BDL ma ścisły limit zapytań (429 przy zbyt częstych wywołaniach) — skrypty respektują nagłówek `Retry-After`.

## Zasięg

~67 miast na prawach powiatu (najpełniejsze i najbardziej wiarygodne dane w GUS BDL). Wskaźnik bezrobocia jest liczony jako liczba zarejestrowanych bezrobotnych na 1000 mieszkańców (nie jest to oficjalna "stopa bezrobocia" GUS, która nie jest publikowana per miasto).
