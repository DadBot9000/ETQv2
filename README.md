## Documentation

### Learning Translation System

ETIQUETTE uses a structured translation pipeline for learning modules based on:

- canonical Polish source modules
- translation overlay files
- deterministic registries
- automated validation and reporting tooling

The system supports multiple **cultural profiles** and **application languages**, which are intentionally independent dimensions.

Example:

- Cultural profile: `JP`
- Application language: `DE`

This means:
- the etiquette content comes from the Japanese cultural profile
- the UI language is German

These dimensions must never be merged.

Full operational documentation:

👉 `docs/LEARNING_TRANSLATION_WORKFLOW.md`

This document explains:

- translation architecture
- overlay format
- stable ID usage
- validation pipeline
- coverage / gap / quality reports
- bootstrap tools for missing overlays
- recommended workflows for translators and developers

---

### Useful Translation Commands

Validate translation pipeline:

```bash
npm run validate:learning-translations