# Aditzak deseraiki

Euskarazko **adizki bakarra** emanda, haren analisi gramatikal guztiak bilatzen
dituen prototipo lokala. Vue + TypeScript, Fastify + Node.js eta SQLite.

`hatzait` → **indikatiboa · orainaldia · NOR–NORI · hi · niri**.
Morfemen adibidea: `ha · tzai · t`, erreferentziak eta zatiketa-mailaren azalpena
barne. Hitanoa, anbiguotasunak, atzizkiak, aipuak eta iturri teknikoak ikusgai.

## Abio azkarra: Podman

```sh
cd docker
podman compose up --build -d
```

Weba: <http://localhost:8080>. APIa webaren `/api/v1/` azpian dago. Lehen
eraikuntzak Internet behar du npm paketeak eta Apertiumeko corpus finkatua
deskargatzeko; ondorengo erabilerak ez du Internet behar.

`podman compose` hornitzailea falta bada, `podman-compose up --build -d` erabili.
Docker Compose-rekin ere bateragarria da. Beste ataka bat hautatzeko:

```sh
WEB_PORT=8090 podman compose up --build -d
```

```sh
podman compose ps
podman compose logs api
podman compose down
```

Hemen instalatutako `podman-compose` 1.3.0 hornitzailearekin, iturburua aldatu
ondoren edukiontzi zaharrak ordezteko `podman compose down` eta jarraian
`podman compose up --build -d` exekutatu. Datu-basea irudiaren barruan dago;
komando horrek ez du bilaketa-historiarik ezabatzen, ez baita gordetzen.

Ataka `127.0.0.1` helbidean bakarrik argitaratzen da. Edukiontziak ez dira root
gisa exekutatzen, fitxategi-sistema irakurtzeko soilik dute, eta ez dago kanpoko
datu-base zerbitzaririk. SQLite irudiaren barruan dago; bilaketek ez dute daturik
aldatzen, eta ez da erabiltzailearen bilaketa-historiarik gordetzen.

TLS proxy korporatiboa badago, hosteko CA multzoa build-secret gisa pasa:

```sh
podman compose -f compose.yaml -f compose.ca.yaml up --build -d
```

`BUILD_CA_FILE` aldagaiarekin CA bundle-aren kokalekua alda daiteke. Ez da TLS
egiaztapena desgaitzen, eta ziurtagiria ez da irudian gordetzen. Lan-ingurune
honetan `docker/` barruan Git-etik kanpo dagoen `compose.override.yaml` lokala gehitu da;
horregatik `podman compose up --build -d` komando arruntak ere proxyaren
ziurtagiria erabiltzen du. Beste makina batean override hori ez da beharrezkoa
ziurtagiri publiko arruntak balio badute.

Docker konfigurazioko fitxategiak `docker/` karpetan daude. Erroko
`.dockerignore` bide sinbolikoa da: eraikuntza-testuingurua proiektuaren erroa
denez, Dockerrek eta Podmanek bertan bilatzen dute bazterketa-zerrenda;
edukia `docker/.dockerignore` fitxategian dago.

## Garapen lokala

Node.js 24 edo berriagoa, npm eta curl behar dira. Komando hauek proiektuaren
erroan exekutatzen dira (`docker/` barruan bazaude, lehenik `cd ..`).

```sh
npm ci
npm run data:fetch
npm run data:build
npm run dev
```

Weba: <http://127.0.0.1:5173>; APIa: <http://127.0.0.1:3000>.
SQLite Node-ren `node:sqlite` modulutik erabiltzen da; Node 24k modulu
esperimentalaren abisua erakuts dezake. Ez da instalazio natibo osagarririk behar.

```sh
npm run check
npm run test:e2e
E2E_BASE_URL=http://127.0.0.1:8080 npm run test:e2e
```

E2E probek `/usr/bin/chromium` erabiltzen dute. Beste kokaleku bat:
`CHROMIUM_PATH=/path/to/chromium npm run test:e2e`.

## Estaldura: ez da oraindik osoa

Uneko corpusak **40 lema** hartzen ditu: Apertiumeko 35 paradigma eta `ba-`
sailetik ateratako beste bost. Zenbaketa zehatza webeko estaldura-panelean,
`GET /api/v1/meta` erantzunean eta `data/generated/coverage.json` fitxategian dago.
Forma atzizkidunak eta nominalizazioak ere zenbatzen dira: ez nahasi azaleko
forma-kopurua oinarrizko adizki-kopuruarekin.

Mugak garrantzitsuak dira:

- **Ez dago euskara batuko forma guztien estaldura edo arautasun-auditoria
  amaituta.** `complete: false` da. Apertiumek forma literario eta arraroak ere
  biltzen ditu; analisi inportatu bat ez da automatikoki batuko baliozkotzea.
- Erauntsi, eroan, iharduki, irakin eta jario lemen estaldura partziala da.
  Haien indikatiboko oinarriak `ba-` paradigmaren bidez berreskuratu dira;
  eratorritako gisa etiketatzen dira.
- EHUko inbentarioko `atxeki`, `erion`, `io` eta `irudi` ez dira izen horiekin
  ageri. `atxiki`, `jario`, `erran` eta `iruditu` lemekiko baliokidetasunak
  banaka egiaztatzeko daude; ez dira automatikoki parekatu.
- Morfema-zatiketa oso egiaztatuak sei formatarako daude. Beste indikatiboko
  forma batzuetan kanpoko marka batzuen **zatiketa partziala** dago. Gainerakoetan
  ez da zatiketa ziurrik asmatzen.
- Ohar historikoak bi gai dokumentatutara mugatzen dira: `zu/zuek` eta `dut`.
  Ez dago forma guztien historia edo kontrako hipotesien katalogo osoa.
- Iturriak hitanoaren generoa bereizten ez duenean «hika, zehaztu gabe» jartzen
  da. `hi` argumentua eta alokutibotasuna ez dira gauza bera.
- `prob2` saileko laguntzaileek iraganeko suposizioa eta baldintzaren ondorioa
  adieraz ditzakete; bi interpretazioak erakusten dira, Odriozolaren azalpena
  aipatuta. Testuingururik gabe ezin da bakarra aukeratu.
- `bait-`-ren arau mugatu bat dago indikatiboko forma ez-alokutiboetarako;
  ez da edozein aurrizki/atzizki-kate itsu-itsuan onartzen.
- Baztertutako sarrera ez-interpretagarriak build-txostenean zenbatzen dira.

Beraz, aplikazioa **prototipo erabilgarria** da; ez da oraindik PLAN.md-ko
estaldura linguistiko osoaren onarpen-irizpidea bete dela adierazten.

## APIa

```sh
curl 'http://localhost:8080/api/v1/analyze?form=hatzait'
curl 'http://localhost:8080/api/v1/analyze?form=nauk&variety=batua'
curl 'http://localhost:8080/api/v1/meta'
curl 'http://localhost:8080/api/v1/sources'
curl 'http://localhost:8080/health'
```

- `GET /api/v1/analyze?form=…&variety=batua`: analisi guztiak, forma normalizatua,
  iradokizunak eta iturriak. Bat ez aurkitzea `200` eta `analyses: []` da.
- `GET /api/v1/forms/:id`: lexikoko analisi baten xehetasunak.
- `GET /api/v1/meta`: estaldura, bertsioa eta mugak.
- `GET /api/v1/sources` eta `GET /api/v1/sources/:id`: bibliografia eta lizentziak.
- `GET /health`: APIaren osasuna eta kargatutako corpusaren bertsioa.
- `400`: sarrera baliogabea edo aldaera ezezaguna; `404`: ID ezezaguna.

Analisi bakoitzak honako hauek ditu: `lemma`, `kind`, `mood`, `tense`, `type`,
`nor/nori/nork`, `treatment`, `allocutive`, `affixes`, `baseForm`, `rawTags`,
`origin`, `validation`, `citations`, `segmentation` eta `history`.
URL bidez forma parteka daiteke: `/?adizkia=hatzait`.

## Egitura

```text
apps/api/          Fastify APIa, SQLite irakurketa eta azalpen linguistikoak
apps/web/          Vue interfazea eta i18n testuak
packages/shared/   Kontratu eta mota partekatuak
scripts/           Iturriak deskargatu eta DIX → SQLite konpilatu
data/sources.json  Bibliografia eta erabilera/lizentzia metadatuak
data/vendor/       Jatorrizko corpusa; sortua, Git-etik kanpo
data/generated/    SQLite eta estaldura-txostena; sortuak, Git-etik kanpo
tests/             Unitate, API eta arakatzaile-probak
docker/            Containerfile, Compose, Nginx eta eraikuntza-konfigurazioa
PLAN.md            Garapena hasi aurreko plana eta amaierako egoera
```

## Datuen eguneraketa eta luzapenak

Corpusaren commit-a `scripts/fetch-sources.ts` fitxategian finkatuta dago;
SHA-256 hash-a build-ak egiaztatzen du. Datu-base berria aldi baterako fitxategi
batean eraikitzen da, integritatea eta kanpo-gakoak egiaztatzen dira, eta
orduan ordezten da sortutako SQLite. APIa berrabiarazi behar da bertsio berria
kargatzeko. Ez editatu sortutako datu-basea eskuz.

Euskalki berri bat gehitzeko, iturri baimendua eta `variety` identifikatzaile
berria erantsi, inportatzailea egokitu eta estalduran erregistratu. Analisiak
aldaeraren arabera kontsultatzen dira. SQLite eskemak `varieties` taula dauka;
ez dago euskalkirik inportatuta oraingoz.

UI hizkuntza berriak `apps/web/src/i18n.ts` fitxategian gehitzen dira. Azalpen
linguistikoek `Localized` egitura dute, hizkuntza-kodearen arabera. Euskara da
fallback-a. Etiketak ez dira datu-baseko kode teknikoen mende itzultzen.

Kodea eta datuak banatuta lizentziatzen dira: ikusi [NOTICE.md](NOTICE.md),
[LICENSE](LICENSE) eta [iturri-inbentarioa](data/sources.json).
