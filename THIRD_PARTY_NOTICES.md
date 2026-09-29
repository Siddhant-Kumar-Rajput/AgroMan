# Third-party notices

## eSpeak NG Emscripten

AgroMan uses `@echogarden/espeak-ng-emscripten` as an on-device speech
fallback for supported Indian languages. The package and eSpeak NG are
distributed under the GNU General Public License v3.0.

- Package source: https://github.com/echogarden-project/espeak-ng-emscripten
- eSpeak NG source: https://github.com/espeak-ng/espeak-ng
- License: https://www.gnu.org/licenses/gpl-3.0.html

The speech assets are loaded only when a compatible native browser voice is
not available. No speech text is sent to eSpeak NG or a third-party speech API.
