# Gayatri library expansion

15 November 2026. Local implementation; deployment not requested in this turn.

## Scope

Adds 60 source-linked deity Gayatri entries to the existing 40-entry Mantra Library. The Gayatri category contains 62 entries: the new 60, the existing Savitri Gayatri (`gayatri`) and the existing Surya Gayatri (`reading-surya-gayatri`). Existing IDs, text, recordings, counts and backups are preserved. The additional Surya/Aditya recension has different wording from the existing Surya prayer.

There is no fixed exhaustive list covering every regional, sectarian and manuscript recension. This release is a broad selected collection, not a claim to have admitted every text called Gayatri. Identical Vishnu/Narayana and Shiva/Rudra names are searchable together; distinct complete Ganapati and Shiva recensions have distinct titles/IDs. Repetitions of the same text in source compilations are not new cards.

Coverage includes all nine Navagraha deities; Ganesha/Ganapati; Rudra/Shiva; Vishnu/Narayana, Brahma, Rama, Krishna, Gopala, Panduranga, Narasimha, Parashurama and Dhanvantari; Hanuman; Durga, Mahishamardini, Jaya Durga, Lakshmi, Saraswati, Kali, Gauri, Sita, Radha, Annapurna, Tulsi and Shakti; Skanda/Shanmukha; Guru, Dakshinamurti, Dattatreya and Hayagriva; Garuda, Nandi and Sudarshana; Agni, Indra, Varuna, Vayu, Yama, Prithvi, Akasha and Hamsa; Bagalamukhi, Bhairavi, Bhuvaneshwari, Chhinnamasta, Dhumavati, Tara, Tvarita, Matangi and Batuka Bhairava.

## Text sources reviewed

- [Gayatri Mantra-s, Sanskrit Documents](https://sanskritdocuments.org/doc_z_misc_major_works/gaayatriimantraaH.html): selected complete recensions under the corresponding deity headings. The source identifies a mixture of textual traditions; it does not establish that every form is a Rigvedic verse. Several deity headings occur more than once. The new Surya Aditya/sahasrakara form uses the version without `ca` in this collection.
- [Navagraha Gayatris, Sanskrit Documents](https://sanskritdocuments.org/doc_z_misc_navagraha/navagrahagAyatrI.html): Chandra kshiraputra/amritatattva; Mangala angaraka/shaktihasta; Budha chandraputra/rohinipriya; Brihaspati suracharya/surashreshtha; Shukra bhrigusuta/divyadeha; Shani shanaishchara/suryaputra/manda; Rahu shirorupa/amritesha; Ketu chitravarna/sarparupa. These are Gayatri prayers, separate from the existing short Navagraha nama invocations.
- [Sarva Devata Gayatri Mantras, Vaidika Vignanam](https://www.vignanam.org/english/sarva-devata-gayatri-mantras.html): cross-reference for common Rudra, Ganapati, Nandi, Skanda, Garuda and Vishnu forms. Accent marks and source-specific recensional differences are not silently combined.
- [Gayatri Mantras, Shree Peetha Nilaya prayer collection](https://prayers.shreepeethanilaya.org/en/prayers/other-prayers/gayatri-mantras-other-prayers): cross-reference for common deity forms. Its modern translations and living-teacher invocations are not copied into this release.
- [Dhanvantari, Drik Panchang](https://www.drikpanchang.com/hindu-gods/trimurti/lord-vishnu/avatara/twenty-four/lord-dhanvantari/info/lord-dhanvantari.html?lang=en): the complete Tatpurusha/amritakalashahasta Dhanvantari form, in its Mantra section. No healing guarantee is added to the editorial meaning.

Only traditional Sanskrit prayer wording is transcribed, with original concise editorial summaries. Modern translations, recordings, PDF layouts and source compilations are not bulk copied. Sources remain linked for comparison. Sanskrit Documents' volunteer encoding/compilation is not represented as freely licensed modern editorial material.

## Admission and reading rules

Each entry preserves a selected complete text rather than constructing a mantra by substituting deity names in a template. The common three-pada display uses punctuation at clause boundaries. Word forms are retained, including source-specific endings such as Tulsi/Vrinda, rather than silently creating a new recension.

Question-marked or apparently incomplete/uncertain source forms are excluded, including the question-marked Venkateshvara text and incomplete Shodashi endings. Merely finding an online label is insufficient to invent missing words or a scripture attribution. Alternative spellings and regional variants can be added after separate source review.

English/Hindi/Gujarati meanings are original short interpretive summaries, not claims of word-for-word philological translation. Sanskrit is unaccented. Existing shared script conversion supplies Roman transliteration and Gujarati-script Sanskrit; Gujarati script is not a translation of the prayer. Teacher pronunciation and recitation review remains pending. New entries intentionally have no audio asset or recording licence claim.

## UI and persistence

Uses existing compact cards, one guide disclosure, search and practice action. Adds a translated Gayatri category to the existing filter, includes both old Gayatri entries in it, and adds topic choices for Brahma, other Devi forms, Skanda/Murugan and nature deities. Gayatri and Navagraha filters intersect correctly. No new card layers or parallel library.

New content belongs to `apps/japseva/frontend/gayatri-mantras.mjs`; its public asset is explicitly allowlisted. No package, database, login or storage schema change. Personal cloud-storage recommendations remain a separate pending programme.

Verification results are recorded in the functionality ledger after checks complete.
