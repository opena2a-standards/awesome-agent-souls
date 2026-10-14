# Soul Integrity

A `SOUL.md` file shapes agent behavior. If it is tampered with, your agent could be manipulated into violating its boundaries. Use [ConfigGuard](https://github.com/opena2a-org/opena2a) to record a SHA-256 hash of your soul files and check them against it.

**Sign your soul file:**

```bash
npx --yes opena2a-cli@latest guard sign --files SOUL.md
```

This writes `.opena2a/guard/signatures.json`, which records the file's SHA-256 hash and when it was signed. Name each file after `--files`: a file name given without it is read as a directory to search, and nothing is signed. The record is a hash, not a keyed signature: anyone who can edit `SOUL.md` can also run `guard sign --files SOUL.md` again, so review changes to `.opena2a/guard/` as you review changes to `SOUL.md`.

**Verify before each session:**

```bash
npx --yes opena2a-cli@latest guard verify
```

If the file has been modified since signing, verification fails and the agent should refuse to proceed. This prevents supply chain attacks where a compromised dependency or CI step silently alters agent instructions.

**Recommended workflow:**

1. Write or copy a `SOUL.md` into your project.
2. Sign it with `guard sign --files SOUL.md`.
3. Commit both `SOUL.md` and `.opena2a/guard/` to version control.
4. In CI, run `guard verify` before any AI-assisted step.
