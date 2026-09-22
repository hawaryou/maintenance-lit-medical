# ENR08-V05 — version iPhone avec scan

Version complète de la fiche de maintenance.

Le scan reprend le système du fichier de référence :
- Code 128 / EAN-13 via BarcodeDetectorPolyfill (ZBar WebAssembly) ;
- QR Code / Data Matrix via ZXing WebAssembly ;
- lecture d’une photo du code via html5-qrcode ;
- zoom et autofocus caméra.

Champs équipés : N° de série ou de parc du lit, N° de série de la potence et N° de série des barrières.

La caméra nécessite HTTPS, notamment sur iPhone/Safari.
