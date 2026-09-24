# Aditzak deseraiki

Euskarazko **adizki bakarra** emanda, haren analisi gramatikal guztiak bilatzen
dituen prototipo lokala. Vue + TypeScript, Fastify + Deno eta SQLite.

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
Caddyk web estatikoa eta APIaren proxy-a zerbitzatzen ditu; tokiko konfigurazio
honetan HTTPS automatikoa desaktibatuta dago, domeinurik edo ataka publikorik ez
dagoelako.

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
SQLite `node:sqlite` modulutik erabiltzen da, bai Node-n bai Deno-n; Node 24k
modulu esperimentalaren abisua erakuts dezake. Ez da instalazio natibo osagarririk behar.
Garapen lokaleko npm komandoek Node erabiltzen dute oraindik; edukiontziko APIak,
aldiz, Deno 2.9rekin TypeScript iturburua zuzenean exekutatzen du, APIa
JavaScriptera konpilatu gabe. Eraikuntza-etapak Node erabiltzen jarraitzen du
corpusaren datu-basea sortzeko eta Vue/Vite frontenda browser-erako biltzeko.

```sh
npm run check
npm run test:e2e
E2E_BASE_URL=http://127.0.0.1:8080 npm run test:e2e
```

E2E probek `/usr/bin/chromium` erabiltzen dute. Beste kokaleku bat:
`CHROMIUM_PATH=/path/to/chromium npm run test:e2e`.

## Estaldura: taula nagusiak auditatuak, baina ez oraindik osoa

Uneko datu-baseak **43 lema** hartzen ditu: Apertiumeko 35 paradigma, `ba-`
sailetik ateratako beste bost, *iro/*io osagarriak eta *irakatsi*ren agintera.
Zenbaketa zehatza webeko estaldura-panelean,
`GET /api/v1/meta` erantzunean eta `data/generated/coverage.json` fitxategian dago.
Forma atzizkidunak eta nominalizazioak ere zenbatzen dira: ez nahasi azaleko
forma-kopurua oinarrizko adizki-kopuruarekin.

Euskaltzaindiaren [14. arauaren](https://www.euskaltzaindia.eus/dok/arauak/Araua_0014.pdf)
PDFko hiru zutabeko 5.252 forma/aldaera konparagarriak aztertu dira: azaleko
formarik eta lema/tratamendu analisi parekaturik ez da falta. Errenkada
bakoitzeko hiru tratamenduetan aldi, modu eta pertsona bateragarritasuna ere
egiaztatu da; aurkitutako lau desadostasunak zuzendu dira.
[78. arauaren](https://www.euskaltzaindia.eus/dok/arauak/Araua_0078.pdf)
taula argiko 2.779 gelaxka (bi hizki edo gehiago; zutabe-izenak eta zatiketa
morfologikoko piezak baztertuta) alderatzean ere ez da
azaleko hutsunerik atzeman. Auditak ez dira bi dokumentuen irakurketa exhaustiboa:
ez dituzte PDF erauzketako lerro hautsiak, forma guztiak edo analisi
gramatikal bakoitzaren egiaztapena barne hartzen. Errepikatzeko, PDFak lokalean
deskargatu eta hau exekutatu:

```sh
npm run audit:alokutibo -- /bidea/Araua_0014.pdf
npm run audit:laguntzaile -- /bidea/Araua_0078.pdf
npm run audit:laguntzaile:semantika -- /bidea/Araua_0078.pdf
npm run audit:trinkoak -- /bidea/euskal-aditz-batua.pdf /bidea/aditz-sintetikoa-1977.pdf
```

78. arauko bigarren auditak adizki osoko taulak dituzten 54 orrialdeak
irakurtzen ditu: 2.831 forma-agerpenen NOR/NORI/NORK, lema, mota, modua eta
aldia egiaztatzen ditu, indikatiboa, ahalerazkoa, subjuntiboa eta agintera
barne. Aurkitutako 23 irakurketa falta ziren eta arauko aipamenarekin gehitu
dira. PDFko lerro hautsiak banaka transkribatu dira; bi gelaxka ez daude
inprimatutako adizki osoko taulan. Tratamendua eta morfema-zatiketa ez ditu
egiaztatzen, eta aditz trinkoak beste iturri batzuen mende daude;
`complete: false` mantentzen da.

Euskaltzaindiaren [*Euskal Aditz Batua* (1979)](https://www.euskaltzaindia.eus/dok/iker_jagon_tegiak/6833.pdf)
liburuko ezkerreko paradigma ofizialen 26 orrialdetan, EGON, JOAN, ETORRI,
IBILI, ETZAN, IRAKATSI, IHARDUN, IHARDUKI, ERAUNTSI eta EUTSI aditzen
409 adizki-agerpen
alderatu dira: azaleko forma,
lema, NOR pertsona eta NOR saileko analisiak ez dute desadostasunik. N1/N2,
N3, N4, N5 eta N9 sailen modu/aldia ere egiaztatzen dira; N4', N7 eta N10
sailen interpretazio anitzak ez dira etiketa bakarrera behartzen. Liburuaren
hitzaurreak zehazten du eskuineko eraikuntza-taulak eta sailen izen
gramatikalak editorearenak direla, ez Euskaltzaindiaren onespen berekoak.
Horregatik, auditak ez ditu horiek paradigma ofizial gisa hartzen. Gainerako
aditz trinkoen paradigma osoak, alokutiboen semantika eta zatiketa
morfologikoa egiaztatu gabe daude.

IRAKATSIren 158¹. orrialdea (PDFko 338.a) paradigma ofiziala da, ez
eraikuntza-taula: PDFan aurrez aurreko orri zuria dago. Orrialde horretako
hitz bakarreko 36 aginterazko adizki gehitu dira, NOR/NORI/NORK eta
hitanoaren generoarekin; tartearekin idatzitako aukera analitikoak ez dira
bilaketa honen hitz bakarreko sarrerak. Apertiumek `erakutsi` azpian zuen
`irakatsiguzu` forma *irakatsi* leman zuzendu da, baina «inportatua» izaten
jarraitzen du. Beste aldi/moduen paradigmarik ez da asmatu.

IHARDUKIren orrialde ofizialetan falta ziren aginterako sei formak, orainaldiko
forma bat eta N4 saileko hiru forma gehitu dira. N4ren ahalerazko
interpretazioa Apertiumeko dagoen analisiaren araberakoa da; 1979ko taulak
forma eta pertsonak bermatzen ditu, ez modu-etiketa bera.

ERAUNTSIren lau agintera-formak eta EUTSIren `daut-` orainaldiko lau
formak ere gehitu dira, NORI/NORK pertsona zehatzekin. Alabaina,
[1977ko *Aditz sintetikoa* jatorrizko zerrendak](https://www.euskaltzaindia.eus/dok/euskera/7623.pdf)
`deut-` formak inprimatzen ditu eta 1979ko liburuak `daut-` formak: gatazka
horregatik, `daut-` irakurketak «sortua» gisa markatu dira, ez
«berrikusia» gisa, eta ez da haiengandik alokutiborik sortzen. Apertiumeko
`deut-` lau irakurketa jatorrizko zerrendaren bidez berrikusi dira.
Bigarren PDFa audit-komandoan hautazkoa da, baina emanez gero iturri-gatazka
eta IRAUN/IRUDIren 70, IHARDUKIren 10 eta ERAUNTSIren lau jatorrizko
adizki-agerpenak ere egiaztatzen dira; multzo horretan ez da hutsunerik aurkitu.

Arauaren bidez berrikusitako irakurketak inportatu gabekoen aurretik erakusten
dira; Apertiumeko beste irakurketak ez dira automatikoki ezabatzen, banakako
arautasun-egiaztapena falta baitzaie.

Mugak garrantzitsuak dira:

- **Ez dago euskara batuko forma guztien estaldura edo arautasun-auditoria
  amaituta.** `complete: false` da. Apertiumek forma literario eta arraroak ere
  biltzen ditu; analisi inportatu bat ez da automatikoki batuko baliozkotzea.
- Erauntsi, eroan, iharduki, irakin eta jario lemen indikatiboko oinarriak
  `ba-` sailetik berreskuratu dira; 14. arauko hikako oinarri batzuk gehitu dira,
  baina beste sailen estaldura partziala izan daiteke.
- `atxeki` forma historikoa [Hiztegi Batuak atxiki-ra bidaltzen du](https://www.euskaltzaindia.eus/dok/euskera/56115.pdf);
  [irudi/iruditu](https://www.euskaltzaindia.eus/dok/euskera/74851.pdf) lotura ere
  lexiko arauemailean dokumentatua dago. *io bereizi da `erran` lematik.
  [erion ere jario-ren bizkaierazko aldaera urritzat](https://www.euskaltzaindia.eus/dok/euskera/66559.pdf)
  jotzen du Hiztegi Batuak; ez da batuko lema bereizi gisa inportatu.
- Hitano-forma sortuak `validation: generated` gisa markatuta daude; taulako
  azaleko bat-etortzeak ez du esan nahi haien guztien erabilera banaka ziurtatua denik.
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
URL bidez forma parteka daiteke: `/?q=hatzait`.

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
docker/            Containerfile, Compose, Caddy eta eraikuntza-konfigurazioa
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
