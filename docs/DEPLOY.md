# Deploy-a GitHub Releaseko datu-basearekin

Produkzioko bideak aplikazioaren kodea eta SQLite artefaktua bereizten ditu.
Datu-basea GitHub Release bateko asset konprimitu eta aldaezin bat da; APIaren
OCI irudiak build garaian deskargatu, SHA-256 bidez egiaztatu, deskonprimitu eta
`PRAGMA integrity_check` exekutatzen du. Deno prozesuak ez du sarerik behar
datu-basea lortzeko.

## 1. Draft Release-a prestatu

GitHubeko **Actions → Prepare database release → Run workflow** aukeran eman
`db-v0.1.0` gisako etiketa. Workflowak:

1. datu-basea iturburu finkoetatik eraikitzen du;
2. testak eta lau estaldura-auditak exekutatzen ditu;
3. SQLite integritatea eta `complete: true` egiaztatzen ditu;
4. assetak konprimitu eta SHA-256 balioak sortzen ditu;
5. GitHub Release bat **draft** egoeran sortzen du.

Ez du Release-a automatikoki publiko egiten. Draft-a berrikusi eta GitHubeko
**Publish release** ekintza eskuz erabili behar da.

Assetak:

- `aditzak.sqlite.zst`: produkzioko datu-base konprimitu eta aldaezina;
- `coverage.json`: estaldura-laburpena;
- `SHA256SUMS`: hiru asseten hash kriptografikoak;
- `aditzak-database-source.tar.zst`: kodea, datu-iturri birbanagarriak,
  lizentziak eta datu-basea berreraikitzeko scriptak.

Euskaltzaindiaren PDFak auditatzeko deskargatzen dira, baina ez dira Releasean
birbanatzen.

Asset berak lokalean prestatzeko, Release-rik sortu gabe:

```sh
npm run data:fetch
npm run data:build
npm run data:release:package -- /tmp/aditzak-release db-v0.1.0
```

Irteera-direktorioak hutsik egon behar du, lehengo asset bat isilean ez
gainidazteko. Git lan-zuhaitzak ere garbi egon behar du; horrela source
artxiboa eta datu-basea commit beretik datozela bermatzen da.

## 2. Release finkoarekin eraiki eta abiarazi

Argitaratutako Releaseko `SHA256SUMS` fitxategitik hartu
`aditzak.sqlite.zst` lerroko hash-a. `docker/.env` fitxategian ezarri:

```dotenv
WEB_BIND_ADDRESS=127.0.0.1
WEB_PORT=8006
DATABASE_RELEASE_URL=https://github.com/ZiTAL/aditzak/releases/download/db-v0.1.0/aditzak.sqlite.zst
DATABASE_RELEASE_SHA256=HEMEN_64_KARAKTEREKO_SHA256_BALIOA
```

Ondoren:

```sh
cd docker
podman compose -f compose.yaml -f compose.release.yaml up --build -d
podman compose -f compose.yaml -f compose.release.yaml ps
curl --fail http://127.0.0.1:8006/health
curl --fail http://127.0.0.1:8006/api/v1/meta
```

`compose.release.yaml` fitxategiak URL edo hash hutsa duen deploy-a berehala
geldiarazten du. Containerfileak hash okerra, SQLite hondatua edo
`complete: true` ez duen datu-basea ere baztertzen du.

Proxy korporatiboaren CA behar bada:

```sh
podman compose \
  -f compose.yaml \
  -f compose.release.yaml \
  -f compose.ca.yaml \
  up --build -d
```

## 3. Eguneraketa eta rollback-a

Datu-base berria zabaltzeko, aldatu bi aldagaiak Release berriaren URL eta
hash-era, eta errepikatu `up --build -d`. API irudi berriak datu-base berria
barruan izango du; web irudia ez da datu-basearen mende eraikitzen.

Rollback-erako, aurreko Releasearen URL eta hash-a berrezarri eta komando bera
exekutatu. URLak etiketa zehatz bat erabiltzen du eta SHA-256 balioak edukia
finkatzen du; ez erabili `latest/download` URL aldakorrik.

## 4. Tokiko fallback-a

`DATABASE_RELEASE_URL` eta `DATABASE_RELEASE_SHA256` biak hutsik badaude,
oinarrizko `compose.yaml` fluxuak datu-basea iturburuetatik eraikitzen jarraitzen
du. Bat bakarrik ematea errorea da.

```sh
cd docker
podman compose up --build -d
```

## 5. Internetera irekitzea

Uneko Compose konfigurazioak frontend-a, APIa eta `/health` sarrera bakarrean
argitaratzen ditu: `127.0.0.1:8006`. API edukiontziaren `3000` ataka Compose
sare pribatuan bakarrik dago. LANetik `8006` atakara zuzenean sartzeko,
`WEB_BIND_ADDRESS=0.0.0.0` ezarri `docker/.env` fitxategian.
Produkzio publikorako bi aukera daude:

- zerbitzariaren kanpoko reverse proxy/TLS geruzak `127.0.0.1:8006` helbidera
  bideratzea; edo
- Caddyri benetako domeinua eman eta 80/443 atakak argitaratzea.

Domeinua eta zerbitzariaren sare-eredua aukeratu arte ez da komeni bigarren
aukera automatikoki ezartzea.
