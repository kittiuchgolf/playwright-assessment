# Branch Protection

GitHub branch protection could not be enabled while this repository is private because GitHub returned:

```text
Upgrade to GitHub Pro or make this repository public to enable this feature.
```

When branch protection or repository rulesets are available, protect `main` with these settings:

- Require a pull request before merging.
- Require branches to be up to date before merging.
- Require conversation resolution before merging.
- Block force pushes.
- Block branch deletion.
- Require these status checks:
  - `Typecheck`
  - `Lint`
  - `Security Audit`
  - `UI Tests`
  - `API Tests`
