# Aditzak deseraiki — garapen-plana

## Egungo egoera (2026-09-24)

Plana idatzi ondoren prototipo funtzionala eraiki da. Uneko datu-baseak 43 lema,
10.579 oinarrizko forma desberdin, 412.746 azaleko forma eta 664.616 analisi
inportatu, sortu eta berrikusi ditu. Apertium corpusaren commit finkoari
Euskaltzaindiaren 14. arauko 5.252 sarrera parekaturen eta 78. arauko 2.779
gelaxka argiren auditak, eta Wiktionaryren hitano-algoritmoaren GPLv3
egokitzapena gehitu zaizkio. Audit horietan ez da hutsunerik atzeman; hala ere,
zenbaki horiek ez dira euskara batuko forma guztien kopuru egiaztatua.
`complete: false` da.

78. arauko adizki osoko taulak dituzten 54 orrialdeak bigarren auditak
parekatzen ditu: 2.831 forma-agerpenetan NOR/NORI/NORK, lema, mota, modua eta
aldia. Hogeita hiru irakurketa falta arauaren aipamenarekin gehitu dira.
PDFko lerro hautsi batzuk eskuz transkribatu dira; bi gelaxka ez daude
inprimatutako adizki osoko taulan. Tratamendua eta morfema-zatiketa ez ditu
audit honek egiaztatzen, eta sintetikoei ez die 78. arauak estaldura ematen.

*Euskal Aditz Batua* (1979) liburuko paradigma ofizialen 63 orrialdeetan,
EGON, JOAN, ETORRI, IBILI eta ETZANen NOR saileko 263 agerpen,
IRAKATSIren aginterako 36, IHARDUN/IHARDUKIren 70 eta
ERAUNTSI/EUTSIren 56, JARIOren 64, EROANen 26, ERAKUTSIren 98,
ATXEKI/JARRAIKIren 272, EKINen 52, EDUKIren 170, EKARRIren 165,
ERAMANen NNN saileko 116 eta beste paradigma trinkoetako 303 agerpen
auditatu dira; guztira 1.691. EUTSIren zortzi eta EKARRI/ERAMANen NOR
pluraleko 232 ohar-aldaera ere estaltzen dira.
1977ko JARRAIKI jatorrizkoak bi iturri-akats ditu: `garraizkie` falta da eta
`zinderraizkien` gelaxkan `ginderraizkien` errepikatzen da; 1979ko taulak
biak zuzen ematen ditu.
*Irakatsi*ren 158¹. orrialdea
(PDF 338) ofiziala dela berretsi da; horren hitz bakarreko paradigmak eta
Apertiumeko lema-zuzenketa gehitu dira. Oraingoz ez da desadostasunik; beste
paradigma trinkoak eta tratamenduen egiaztapena falta dira. IHARDUKIren
aginterako sei forma eta beste lau forma osatu dira. ERAUNTSIren lau agintera
eta EUTSIren 1979ko lau `daut-` aldaera ere gehitu dira. EUTSIren aginterako
20 irakurketak eta i-rik gabeko zortzi aldaerak ere estali dira; 1979ko
`beutse` errepikapena eta 1977ko `beutsete` lekukotasuna biak gorde dira.
Aurrez aurreko eraikuntza-taulak
editorearenak dira, ez Akademiaren paradigma ofizialak.

JARIO/JARIN/JARIATUren 1979ko NN4/NN9 taulek beste 24 analisi falta
erakutsi dituzte (8 ahalerazko, 16 aginterazko). EROANen NN4/NN9 taulek
beste 18 (6 ahalerazko, 12 aginterazko); agintera 1977ko jatorrizkoan ere
egiaztatu da. NN4ren modu/aldia Apertiumeko lehendik zegoen sailari jarraituz
eman da; iturri ofizialak forma eta pertsona bermatzen ditu. Bi taula horien
zatiketa morfologikoa oraindik ez dago egiaztatuta.

IRAUN eta IRUDI/IRUDITUren lau orri, EMANen bi, UTZI, IGORRI, EROSI eta
IHARDETSIren agintera-orriak eta ESAN/ERRANen lehen bi orriak gehitu dira
auditoriara. EMANen bost forma eta ESAN/ERRANen hamar irakurketa falta
gehitu dira; iturriko `-k/-n` bikoteak toka/noka gisa berrikusi dira.

ERAKUTSIren 149¹–151¹. orrialdeetako hiru taula osoak auditatu dira.
Lehenaldiko bi adizki, baldintzako 13 irakurketa eta `herakuske`ren bi
modu-irakurketa gehitu dira. Aginterako `-k/-n` bikoteetan lehen «hika
(zehaztu gabe)» ziren 18 irakurketak toka/noka gisa zuzendu dira, 1979ko
taula eta 1977ko jatorrizkoa erabiliz. NN3/NN4ko modu-interpretazio berriak
«sortua» dira; inprimatutako gelaxkak forma eta pertsona egiaztatzen ditu,
ez nahitaez etiketa gramatikal hori.

EUTSIren `daut-` formak 1979ko liburuan ageri dira, baina 1977ko jatorrizko
*Aditz sintetikoa* zerrendak `deut-` ematen du. Gatazka ebatzi gabe dago;
`daut-` sarrerak «sortua» gisa agertzen dira eta ez dute alokutiborik sortzen.
`deut-` saileko lau oinarrizko irakurketak 1977ko zerrendarekin berrikusi dira.
1977ko dokumentuko IRAUN/IRUDI sailen 70, EMANen 80, EUTSIren 20, IHARDUKIren 10 eta
ERAUNTSIren lau, EROANen hamabi eta ERAKUTSIren hamasei agerpen ere egiaztatu dira,
hutsegiterik gabe; honek ez du gainerako aditz trinkoen estaldura frogatzen.

Vue interfazea, Fastify APIa, SQLite inportatzailea, iturri-erregistroa eta
Podman edukiontziak martxan daude. `hatzait` kasua, hitanoa, anbiguotasuna,
normalizazioa, iradokizunak, ba- eta bait- sailak, formaren atzizki dokumentatuak,
sei zatiketa egiaztatu eta bi gai historiko dokumentatu probatuta daude.
`nintzatekeen`-en suposiziozko eta baldintzaren ondoriozko interpretazioak
bereizita daude. Kodearen eta Apertium datuen lizentziak `NOTICE.md` eta
`LICENSE` fitxategietan dokumentatuta daude.

Amaitu gabe: 3. ataleko inbentario arauemaile osoa, batuko
arautasun-auditoria forma guztientzat, morfema eta historia azalpen osoak,
eta iturriek hitanoko generoa bereizten ez duten kasuen banakako egiaztapena.
Beraz, 15. ataleko 3., 6., 9. eta 12. irizpideak partzialki betetzen dira;
gainerako irizpideen egoera probek eta estaldura-fitxategiak erakusten dute.


## 1. Helburua

Euskara batuko adizki bakar bat emanda, haren analisi gramatikal posible guztiak
itzultzen dituen web-prototipoa eraikitzea.

Adibidez, `hatzait` sarrerak gutxienez hau eman behar du:

- lema edo paradigma: `izan` / aditz laguntzailea;
- modua: indikatiboa;
- aldia: orainaldia;
- mota: NOR–NORI;
- NOR: hi;
- NORI: niri;
- NORK: ez dago;
- morfema-zatiketa sinkroniko eta pedagogikoa;
- morfema-zatiketa tekniko xeheagoa;
- azalpen historikoa, aldaketa fonologikoak eta iturriak;
- analisiaren ziurtasun-maila eta, desadostasunik badago, hipotesi alternatiboak.

Aplikazioak ez du esaldi, perifrasi edo hitz anitzeko aditz multzorik aztertuko.
Sarrera hitz bakarreko adizkia izango da.

## 2. Irismen funtzionala

### 2.1. Lehen bertsioan sartuko dena

- Euskara batuko adizki laguntzaile guztiak.
- Euskara batuko aditz trinko guztiak, erabilera-maiztasuna edozein dela ere,
  betiere iturri fidagarri batean dokumentatuta badaude.
- Aditz trinko bakoitzaren lema.
- Forma neutroak eta alokutiboak.
- Hitanoa, toka eta noka bereizita.
- Analisi anbiguo guztiak; ez da emaitza bakarra modu arbitrarioan hautatuko.
- Paradigma nagusietako adizki soilak.
- Ahal den neurrian, arauzko aurrizki eta atzizki emankorrak: besteak beste,
  `ba-`, `bait-`, `-n`, `-la`, `-nean` eta `-lako`.
- Morfemen azalpen sinkronikoa eta historikoa.
- Analisi historiko alternatiboak, iturrien arteko desadostasunak eta
  ziurtasun-mailak.
- Maiuskulen, kanpoko zuriuneen, Unicode idazkeraren eta amaierako puntuazio
  arruntaren normalizazioa.
- Emaitzarik ez dagoenean mezu argia eta antzeko forma zuzenen proposamenak.
- Euskara hutsezko interfazea, etorkizuneko hizkuntzetarako prestatua.
- Aditzak.eus-en arbel-giroan inspiratutako diseinu propioa.

### 2.2. Lehen bertsioan sartuko ez dena

- Esaldi osoen analisia.
- `etorri nintzen` gisako hitz anitzeko aditz multzoen analisia.
- Euskalkietako corpusak; datu-eredua haiek gero gehitzeko prestatuko da.
- Erabiltzaile-kontuak.
- Bilaketa-historia pertsonala.
- Administrazio-panela.
- Analitika edo jarraipen-cookieak.
- Aditzak.eus-en datu, kode, logotipo edo irudien kopia.

## 3. “Datu osoa”ren definizio operatiboa

“Guztiak” ezin da webgune jakin bateko zerrendaren sinonimo izan. Estaldura
errepikagarri eta egiaztagarria izateko, inbentario arauemailea eraikiko da:

1. iturri akademiko eta arauemaileetako aditz laguntzaileak eta aditz trinkoak
   identifikatu;
2. lema eta paradigma bakoitzerako dokumentatutako forma guztiak bildu;
3. iturrien arteko aldeak estaldura-matrize batean jaso;
4. forma bakoitzari gutxienez analisi gramatikal bat lotu;
5. forma anbiguoei analisi guztiak lotu;
6. forma eratorri emankorrak arau esplizituen bidez sortu edo analizatu;
7. ezin egiaztatutako formak ez asmatu: gabezia gisa erregistratu.

Prototipoaren forma-estaldura osoa izango da hautatutako iturri-multzoak
dokumentatzen duen inbentarioarekiko. Inbentarioaren kopuruak ingestio-fasean
argitaratuko dira, ez aurretik asmatutako zenbaki baten bidez.

## 4. Datu-iturriak eta trazabilitatea

Hasierako iturri hautagaiak:

- Euskaltzaindiaren 78. araua, *Aditz laguntzaile batua*.
- Euskaltzaindiaren *Euskal Aditz Batua* eta hari lotutako paradigma-taulak.
- Euskaltzaindiaren gramatika eta adizkien osaketari buruzko materialak.
- EHUko Euskara Institutuaren Euskal Adizkitegi Automatikoa.
- EHUren *Euskal Gramatika: Egiturak eta Osagaiak*.
- Behar diren bestelako artikulu, corpus eta lan akademiko primarioak,
  bereziki morfologia historikorako.

Iturri bakoitzarentzat gordeko da:

- izenburua, egilea/erakundea eta URL edo erreferentzia bibliografikoa;
- bertsioa edo kontsulta-data;
- lizentzia eta berrerabilera-baldintzak;
- zein datu edo baieztapen sostengatzen duen;
- orrialdea, taula edo atal zehatza, posible denean;
- erregistroaren konfiantza-maila.

Ez da edukirik masiboki berrerabiliko haren lizentzia egiaztatu gabe. Iturri
baten lizentziak datuak birbanatzea uzten ez badu, erreferentzia eta
egiaztapen-gurutzatua erabiliko dira, baina ez haren datu-basearen kopia.
Aditzak.eus erreferentzia funtzional eta estetikoa baino ez da izango.

## 5. Analisi linguistikoaren eredua

### 5.1. Analisi gramatikala

Analisi bakoitzak eremu egituratu hauek izan ditzake:

- lema;
- aditz mota: laguntzailea edo trinkoa;
- laguntzaile/paradigma identifikatzailea;
- forma: sintetikoa, eta etorkizunerako bestelako balio hedagarriak;
- modua;
- aldia;
- aspektua, aplikagarria eta iturriak bermatua denean;
- polaritatea edo lotutako aurrizkia;
- argumentu-egitura: NOR, NOR–NORI, NOR–NORK edo NOR–NORI–NORK;
- NOR, NORI eta NORK argumentuen pertsona eta numeroa;
- tratamendua: neutroa, toka edo noka;
- menderagailuak eta gainerako morfema erantsiak;
- euskara-aldaera: lehen bertsioan `batua`;
- erabilera- edo arautasun-oharrak;
- iturriak eta ziurtasun-maila.

Eremuek kode egonkorrak erabiliko dituzte; erabiltzaileari erakutsitako testua
itzulpen-fitxategietatik etorriko da.

### 5.2. Morfema-zatiketaren hiru geruzak

Forma bakoitzak, iturriek uzten dutenean, hiru ikuspegi izango ditu:

1. **Azaleko zatiketa**: hitzean ikus daitezkeen segmentuak eta haien kokapena.
2. **Analisi sinkroniko/pedagogikoa**: segmentu bakoitzaren gaur egungo funtzioa,
   alomorfoak eta fusioak ikasleari ulertzeko moduan.
3. **Analisi historikoa**: berreraikuntza, bilakaera fonologikoa eta hipotesi
   dokumentatuak.

Ez da azalpen historikoa sinkronikoaren egia bakar gisa aurkeztuko. Hipotesi
historiko bakoitzak honakoak izango ditu:

- deskribapena;
- segmentazioa edo bilakaera-urratsak;
- iturria;
- ziurtasun-maila: `handia`, `ertaina`, `txikia` edo `eztabaidatua`;
- egilearen edo iturriaren oharra;
- kontraesan edo hipotesi alternatiboetarako loturak.

Informazio historikorik ez dagoenean, aplikazioak “ez dago analisi historiko
egiaztaturik” adieraziko du; ez du azalpenik asmatuko.

### 5.3. Aurrizki eta atzizki emankorrak

Analizatzaileak bi urrats izango ditu:

1. datu-baseko forma dokumentatuen bilaketa zehatza;
2. arau morfologiko mugatu eta iturridunen bidezko deskonposizioa.

Arau batek sortutako analisiak eta zuzenean dokumentatutakoak bereiziko dira.
Arauak ez dira kateak mugarik gabe kentzeko heuristika hutsak izango: baldintza
morfologikoak, alomorfiak, bateraezintasunak eta iturriak izango dituzte.

## 6. Anbiguotasuna eta bilaketa

Bilaketa-fluxua:

1. erabiltzailearen jatorrizko sarrera gorde;
2. kanpoko zuriuneak kendu;
3. Unicode NFC normalizazioa egin;
4. minuskulazko bilaketa-gakoa sortu;
5. amaierako puntuazio arrunta kendu, hitzaren barruko karaktereak aldatu gabe;
6. forma zehatzaren analisi guztiak bilatu;
7. beharrezkoa bada, morfologia-arau bidez analizatu;
8. emaitzarik ezean antzeko forma dokumentatuak proposatu.

Iradokizunen sailkapenak gutxienez edit distantzia, luzera-aldea eta hasierako
segmentuen antzekotasuna erabiliko ditu. Iradokizuna ez da analisi zuzentzat
aurkeztuko erabiltzaileak hautatu arte.

## 7. Datu-basea

SQLite erabiliko da. Foreign key-ak aktibatuta egongo dira, eta migrazioak
bertsionatu egingo dira.

Hasierako taula logikoak:

- `language_varieties`: batua eta etorkizuneko euskalkiak;
- `lemmas`: aditz laguntzaile eta trinkoen lemak;
- `forms`: azaleko forma eta bilaketa-gako normalizatua;
- `analyses`: forma baten analisi gramatikaletako bakoitza;
- `arguments`: NOR/NORI/NORK balio egituratuak;
- `morpheme_analyses`: segmentazio sinkroniko edo tekniko bat;
- `morpheme_segments`: segmentuak, ordena, funtzioa eta azaleko tartea;
- `historical_hypotheses`: azalpen historiko alternatiboak;
- `derivation_steps`: aldaketa fonologiko edo morfologiko ordenatuak;
- `morphological_rules`: aurrizki/atzizki emankorren arauak;
- `sources`: erreferentzia bibliografikoak eta lizentziak;
- `citations`: datu-erregistroen eta iturrien arteko loturak;
- `import_runs`: ingestioaren bertsioa, data eta emaitzak;
- `localized_labels`: datuetako termino itzulgarriak, beharrezkoa bada.

Forma batek analisi asko izan ditzake, eta analisi batek segmentazio edo hipotesi
historiko asko. Eskema horrek anbiguotasuna ez galtzea bermatuko du.

SQLite fitxategi sortua artefaktu errepikagarria izango da: iturri egituratu eta
migrazioetatik berreraiki ahal izango da. Ez da eskuzko aldaketa opakurako
fitxategi bakar gisa mantenduko.

## 8. Arkitektura teknikoa

Monorepo sinple bat erabiliko da:

```text
aditzak-deseraiki/
├── apps/
│   ├── web/                 # Vue 3 + Vite + TypeScript
│   └── api/                 # Deno edukiontzian / Node lokalean + Fastify + TypeScript
├── packages/
│   └── shared/              # API kontratuak, kode partekatuak eta motak
├── data/
│   ├── sources/             # Baimendutako/propio sortutako sarrera egituratuak
│   ├── curated/             # Berrikusitako datu linguistikoak
│   └── generated/           # Sortutako SQLite; ez da egia-iturri bakarra
├── scripts/                 # Ingestioa, balidazioa eta estaldura-txostenak
├── docs/                    # Iturriak, erabakiak eta estaldura
├── docker/                  # Compose, Containerfile eta Caddy
├── .dockerignore            # docker/.dockerignore fitxategirako lotura
└── PLAN.md
```

### 8.1. Frontenda

- Vue 3.
- Vite.
- TypeScript modu zorrotzean.
- Vue Router, emaitzak URL bidez partekatzeko beharrezkoa bada.
- `vue-i18n` edo baliokide arina; lehen hizkuntza `eu`.
- API mota partekatuak, erantzunen egitura ez bikoizteko.

### 8.2. Backenda

- Deno 2.9 APIaren produkzio-edukiontzian; Node.js 24 datuen/frontendaren
  eraikuntzan eta garapen lokaleko npm fluxuan.
- Fastify.
- TypeScript modu zorrotzean.
- SQLite driver sinkroniko fidagarria, API irakurketa-lanerako egokia.
- JSON Schema bidezko sarrera- eta irteera-balidazioa.
- Datu-basearen migrazio eta eraikuntza-scriptak.

### 8.3. Edukiontziak

- OCI/Docker bateragarriak diren Containerfile/Dockerfile-ak.
- `compose.yaml` estandarra.
- Podman eta `podman compose` bidez probatua.
- Gutxienez `web` eta `api` zerbitzuak.
- SQLite datua APIaren bolumen izendatu batean edo proiektuko garapen-bolumen
  esplizitu batean.
- Root gabeko edukiontziekin bateragarritasuna.
- Healthcheck-ak.

Ez da PostgreSQL edo bestelako datu-base zerbitzurik gehituko.

## 9. APIaren hasierako kontratua

Gutxieneko endpointak:

- `GET /health`: zerbitzuaren egoera.
- `GET /api/v1/analyze?form=hatzait`: forma baten analisi guztiak.
- `GET /api/v1/forms/:id`: forma eta haren xehetasun osoak.
- `GET /api/v1/sources/:id`: iturri baten metadatuak.
- `GET /api/v1/meta`: datu-bertsioa, estaldura eta aldaerak.

`analyze` erantzunak honakoak bereiziko ditu:

- sarrera originala eta normalizatua;
- bat-etortze zehatzak;
- arauz eratorritako analisiak;
- analisi anbiguoak;
- morfema-zatiketak;
- hipotesi historikoak eta iturriak;
- emaitzarik ezean iradokizunak;
- datu-bertsioa.

APIa irakurtzeko soilik izango da prototipoan. Sarreraren gehieneko luzera eta
karaktere-balidazioa ezarriko dira.

## 10. Interfazea

Pantaila nagusiak elementu hauek izango ditu:

- izen eta marka propioa, oraingoz “Aditzak deseraiki”;
- bilaketa-eremu nagusi bakarra;
- teklatuz osorik erabil daitekeen bilaketa;
- arbel-estetikako emaitza nagusia, CSS eta aktibo propioekin;
- analisi bat baino gehiago dagoenean, guztiak bereizitako txarteletan;
- analisi gramatikalaren laburpena;
- argumentuen taula argia: NOR, NORI eta NORK;
- lema, aditz mota, modua, aldia eta tratamendua;
- morfema-zatiketa bisuala;
- azalpen pedagogikoa;
- analisi historiko hedagarria;
- iturri eta ziurtasun-adierazleak;
- “ez da aurkitu” egoera eta iradokizun hautagarriak;
- datu-estalduraren eta metodologiaren azalpen-orria.

Aditzak.eus-en giroa mantentzeko gradiente urdin/turkesa eta arbelaren ideia
erabil daitezke, baina logotipo, irudi, CSS edo beste aktibo bat kopiatu gabe.

Irisgarritasun-helburua WCAG 2.2 AA izango da: kontrastea, foku ikusgarria,
etiketa semantikoak, pantaila-irakurlearen azalpenak eta mugimendu murriztua.

## 11. Nazioartekotzea eta euskalkiak

Erabiltzaileari erakusten zaion testurik ez da osagaietan zuzenean finkatuko.
Gako egonkorrak eta euskarazko itzulpen-fitxategia erabiliko dira.

Datu linguistikoek `language_variety_id` izango dute. Bilaketa eta API kontratua
aldaera-iragazkia jasotzeko prestatuko dira, nahiz eta lehen bertsioan `batua`
bakarrik egon. Euskalki bat gehitzeak ez du eskema edo frontendaren oinarrizko
logika berridaztea eskatu behar.

## 12. Test-estrategia

### 12.1. Datuen testak

- foreign key eta eskema-murriztapen guztiak;
- lema eta paradigma inbentarioaren osotasuna;
- iturririk gabeko datu linguistikorik ez egotea;
- forma bakoitzak gutxienez analisi bat izatea;
- NOR/NORI/NORK konbinazioaren koherentzia motarekin;
- toka/noka etiketaren koherentzia;
- segmentuen ordena eta azaleko tarteak;
- iturri bakoitzeko estaldura eta desadostasun-txostenak;
- sortzailearen eta analizatzailearen round-trip probak, aplikagarria denean.

### 12.2. Backend testak

- normalizazio-unitate testak;
- forma zehatzen bilaketa;
- anbiguotasunaren itzulera osoa;
- morfologia-arauen testak;
- antzeko formen ranking-a;
- API eskema eta errore-erantzunak;
- SQLite migrazio eta berreraikuntza garbia.

### 12.3. Frontend testak

- osagai-unitate testak;
- analisi bakarra eta analisi anitzak;
- toka/noka bistaratzea;
- segmentazio eta hipotesi historikoen bistaratzea;
- emaitzarik gabeko egoera;
- teklatu bidezko erabilera eta oinarrizko irisgarritasuna;
- nabigatzaileko end-to-end bilaketa nagusiak.

Erreferentziazko lehen kasuen artean egongo dira `hatzait`, aditz trinko arrunt
bat, forma anbiguo bat, toka/noka bikote bat, forma atzizkidun bat eta akats
ortografiko bat.

## 13. Lizentziak

- Proiektuaren banaketa bateratua: GNU GPL, `GPL-3.0-only` identifikatzailearekin.
- Mendekotasunak: GPLrekin bateragarriak direla egiaztatuko da.
- Datuak: kodearen lizentziatik bereizita dokumentatuko dira.
- `LICENSE` fitxategia kodearentzat.
- `DATA-LICENSES.md` edo baliokidea datu-iturri eta erregistroentzat.
- Iturri bakoitzaren atribuzio- eta birbanaketa-baldintzak beteko dira.
- Lizentzia ezezaguna duen datu-multzoa ez da banatuko baimenik gabe.

## 14. Garapen-faseak

### 0. Plana onartu

- Dokumentu hau berrikusi.
- Aldaketak adostu.
- Plana onartu arte ez sortu aplikazio-scaffoldik.

### 1. Iturri- eta estaldura-inbentarioa

- Iturri primarioak bildu eta lizentziak egiaztatu.
- Aditz laguntzaile eta trinkoen lema-zerrenda bateratua sortu.
- Paradigma, forma eta hutsuneen estaldura-matrizea argitaratu.
- Terminologia-kode egonkorrak definitu.

### 2. Monorepoa eta exekuzio-ingurunea

- Vue/Vite/TypeScript frontenda sortu.
- Fastify/TypeScript backenda sortu.
- Pakete partekatua konfiguratu.
- SQLite migrazioak eta datu-eraikitzailea prestatu.
- Containerfile-ak eta `compose.yaml` sortu.
- Podman bidezko garapen-fluxua egiaztatu.

### 3. Datu-ingestioa eta balidazioa

- Iturri baimenduak formatu egituratura bihurtu.
- Provenance eta aipuak lotu.
- Desadostasun-txosten automatikoa sortu.
- Paradigma osoen balidazioak exekutatu.
- SQLite artefaktua eraiki.

### 4. Analizatzailea eta APIa

- Normalizazioa.
- Bilaketa zehatza eta analisi anitzak.
- Morfologia-arau dokumentatuak.
- Iradokizun-motorra.
- API kontratua eta integrazio-testak.

### 5. Morfema eta historia geruzak

- Segmentazio sinkronikoak.
- Azalpen pedagogikoak.
- Bilakaera historiko eta hipotesi alternatiboak.
- Ziurtasun-mailak eta aipu zehatzak.
- Estaldura-txostena; informaziorik gabeko kasuak esplizituki markatu.

### 6. Frontendaren esperientzia

- Bilaketa eta emaitza nagusiak.
- Arbel-estetika propioa.
- Analisi anitzen nabigazioa.
- Morfema eta historia panelak.
- Iradokizunak, iturriak eta metodologia.
- Responsive eta irisgarritasun-probak.

### 7. Amaierako egiaztapena

- Test-suite osoa.
- Podman bidezko eraikuntza hutsetik.
- Datu-estaldura eta lizentzia-auditoria.
- Dokumentazioa eta erabilera-argibideak.

## 15. Onarpen-irizpideak

Prototipoa amaitutzat joko da baldintza hauek betetzean:

1. `podman compose up --build` bidez hutsetik abiatzen da.
2. Weba eta APIa healthcheck egoera onean daude.
3. Iturri-inbentarioak dokumentatutako euskara batuko aditz laguntzaile eta
   trinko guztiek estaldura dute.
4. Datu-baseko forma bakoitzak analisi trazagarria du.
5. Forma anbiguoek analisi guztiak erakusten dituzte.
6. Toka eta noka bereizita daude.
7. Aditz trinkoek lema erakusten dute.
8. `hatzait` kasuak espero den analisi gramatikala eta morfema-geruzak ematen
   ditu.
9. Forma atzizkidun dokumentatuek oinarrizko adizkia eta morfema erantsiak
   bereizten dituzte.
10. Sarrera normalizazioak maiuskulak, zuriuneak eta puntuazioa kudeatzen ditu.
11. Emaitzarik gabeko bilaketek antzeko proposamen erabilgarriak ematen dituzte.
12. Hipotesi historikoak iturria eta ziurtasun-maila erakutsita aurkezten dira.
13. Interfazeko testu guztiak nazioartekotze-geruzatik datoz.
14. Datu-ereduak etorkizuneko euskalkiak gehitzea ahalbidetzen du.
15. Ez da Aditzak.eus-eko datu edo aktibo jabedunik kopiatu.
16. Banaketa bateratuak GPL-3.0-only lizentzia dauka eta datu-lizentziak aparte daude.
17. Test automatiko guztiak pasatzen dira.

## 16. Arrisku nagusiak eta neurriak

### Iturrien lizentziak

**Arriskua:** iturri batek kontsulta uztea baina datuak birbanatzea ez uztea.

**Neurria:** iturri bakoitzaren lizentzia ingestioa baino lehen egiaztatu,
provenance bereizi eta birbanatzeko baimenik gabeko datuak ez paketatu.

### “Forma guztien” muga

**Arriskua:** aurrizki eta atzizkien konbinazio emankorrek forma-kopuru irekia
sortzea.

**Neurria:** forma dokumentatuen inbentarioa eta arauz eratorritako analisiak
bereizi; estaldura-matrizean biak aparte neurtu.

### Segmentazio ez-gardena

**Arriskua:** fusioak eta alomorfiak direla eta letra bakoitzari esanahi bakarra
esleitzea okerra izatea.

**Neurria:** azaleko, sinkroniko eta historiko geruzak bereizi; iturri eta
ziurtasun-mailak erakutsi.

### Analisi historikoen desadostasuna

**Arriskua:** hipotesi bat egia ziur gisa aurkeztea.

**Neurria:** hipotesi alternatiboak lehen mailako datu gisa modelatu eta iturria
nahiz ziurtasuna derrigorrezko egin.

### Euskalkien etorkizuneko integrazioa

**Arriskua:** batuko kodeak balio linguistikoak zuzenean finkatzea.

**Neurria:** aldaera, etiketa eta arauak datu bidez modelatu; `batua` ez erabili
programako baldintza berezi gisa.

## 17. Garapen-printzipioak

- Ez asmatu datu linguistikorik.
- Emaitza bakoitza iturri bateraino trazatu.
- Anbiguotasuna gorde, ez ezkutatu.
- Arau bidez sortutakoa eta zuzenean dokumentatutakoa bereizi.
- Datuak, negozio-logika eta aurkezpena banandu.
- Euskara lehenetsi, baina testuak nazioartekotzeko prest mantendu.
- Diseinua eta aktiboak propioak izan.
- Podman bidezko erreproduzigarritasuna mantendu fase bakoitzean.
