# Kanji data source

The 2,136 Jōyō Kanji records are loaded from the open `jkindrix/japanese-language-data` Jōyō dataset, derived from KANJIDIC2.

Source: https://github.com/jkindrix/japanese-language-data
Jōyō dataset: https://raw.githubusercontent.com/jkindrix/japanese-language-data/main/data/core/kanji-joyo.json

The app normalizes records by the Kanji character itself and derives a stable ID from Unicode, avoiding array-position/index associations. The normalized 2,136-record dataset is persisted in IndexedDB after the first successful download, so subsequent study sessions work offline.

The source documents English and Spanish meanings, on'yomi, kun'yomi, grade, current Waller JLPT classification, stroke count and radical/component information. Jōyō count and field definitions are documented in the source repository.

License/attribution: the upstream project states CC-BY-SA 4.0 / EDRDG-derived licensing. See the upstream repository and its ATTRIBUTION.md before redistribution.
