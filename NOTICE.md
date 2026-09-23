# Lizentziak eta aitortzak

Proiektu honen banaketa bateratua **GNU General Public License, 3. bertsioa
(GPL-3.0-only)** lizentziarekin eskaintzen da. Lizentziaren testu
osoa `LICENSE` fitxategian dago. Bermerik gabe banatzen da. Kode jatorrizkoaren
zenbait zati GPL-3.0-or-later baldintzetan ere eskain daitezke bereizita, baina
corpusaren eta egokitutako moduluaren banaketa bateratuak GPLv3ra mugatzen du.

## Apertium eus

Corpusaren iturria: <https://github.com/apertium/apertium-eus>.
Erabilitako commit-a: `f2888cdc7dca17488fa343dd1d9a7da49283842c`.
Jatorrizko `COPYING` fitxategiak GPL 3. bertsioa dauka. Datuetarako ez dugu
berariaz «or-later» baimenik gehitzen. Egileak, upstream `AUTHORS` fitxategitik:

- 2014, Francis M. Tyers
- 2014, Inari Listenmaa
- 2014, Kevin Brubeck Unhammer

Jatorrizko DIX, COPYING eta AUTHORS `npm run data:fetch` komandoak deskargatzen
ditu; APIaren edukiontzian ere badaude, `/usr/share/aditzak-source` direktorioan.
SQLite datu-basea corpus horren eratorpena da; inportazio-kodea eta egindako
interpretazioak proiektu honetan daude. Ez da jatorrizko corpusaren homologazio
edo arautasun-ziurtagiririk iradokitzen.

## Erreferentzia linguistikoak

Euskaltzaindiaren arauak, Itziar Lakaren gramatika, EHUren adizkitegia eta
Hualderen artikulua kontsulta-iturriak dira. Haien testu osoak, datu-baseak edo
programak ez dira proiektu honetan birbanatzen. Azalpenak laburpen propioak
dira; erreferentzia eta kokalekua gordetzen dira. Metadatuak: `data/sources.json`.
Euskaltzaindiaren 14. eta 78. arauetako banakako forma arauemaile gutxi batzuk
ere egiaztapen eta osagarri gisa jaso dira; ez dira taula osoak birbanatzen.

## Wiktionaryren hikako algoritmoa

`scripts/allocutive.ts` fitxategiko hautagai-sorkuntza
[Module:eu-verb](https://en.wiktionary.org/w/index.php?title=Module:eu-verb&oldid=91771505)
modulutik egokitu da (Wiktionary contributors; 2026-08-01eko 91771505
berrikuspena; CC BY-SA 4.0). Aldaketak: Lua-tik TypeScript-era eraman,
erabilera adizki trinkoetako oinarrizko forma neutroetara mugatu, eta
iturburu/ziurtasun metadatuak gehitu. *io-ren `zion` noka forma 14. arauaren
arabera mantendu da (moduluaren `ziona` salbuespenik gabe). Egokitzapen hori GPLv3ren baldintzetan
banatzen da; CC BY-SA 4.0ren eta GPLv3ren arteko bateragarritasuna noranzko
horretan bakarrik da. Jatorrizko moduluko akats edo mugak egon daitezke;
sortutako emaitzak ez dira banaka Euskaltzaindiak egiaztatuak.

## Aditzak.eus

Funtzionamenduaren eta arbel/urdin-berde estetikaren inspirazioa izan da.
Ez da haren kodea, datu-basea, logoa, irudirik edo bestelako aktiborik kopiatu.
Ez dago lotura instituzionalik edo zerbitzu ofizialaren ordezkaritzarik.

## Mendekotasunak

Vue, Fastify, Vite, Deno, Node.js, Caddy eta gainerako mendekotasunek beren lizentziak
dituzte. npm mendekotasunen bertsioak `package-lock.json` fitxategian daude;
oinarrizko irudien bertsioak `docker/Containerfile` fitxategian. Lizentziak paketeekin
batera mantentzen dira. Interfazeak ez du kanpoko letra-tiporik, analitikarik
edo hirugarrenen sare-eskaerarik egiten.
