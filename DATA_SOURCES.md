# Kanji data sources

The Jōyō Kanji records are generated from the CC-BY-SA 4.0 dataset published by `jkindrix/japanese-language-data`, whose kanji data is derived from KANJIDIC2/EDRDG. The generated records use the Spanish and English meanings, Japanese on'yomi/kun'yomi, stroke count, grade and radical/component information from that source.

JLPT levels come from the same project's Waller-derived JLPT classification. JLPT classifications are community-derived, not official JLPT lists.

Example vocabulary is derived from the project's common JMdict-derived word dataset.

Sources:
- https://github.com/jkindrix/japanese-language-data
- https://www.edrdg.org/edrdg/licence.html
- https://kanjivg.tagaini.net/ (stroke-order source used by the project; this build keeps stroke paths separate from dictionary metadata)

The app deliberately keys every Kanji record by its character and a stable Unicode-based ID. Array position is never used to associate metadata with a character.
