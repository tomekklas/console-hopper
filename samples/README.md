# Sample configurations

Starter configs you can paste straight into Console Hopper's
**Import Settings** dialog (side menu → Import Settings).

After import the extension reloads with the imported settings applied;
then customize the labels and patterns via the side-menu **Manage …**
modals to match your actual org.

## Files

### `landing-zone-example.json`

AWS Landing Zone / Control Tower starter:

- **Environments**: PROD (red) / TEST (yellow) / DEV (green) with the
  common name patterns (`prod`/`production`, `test`/`staging`/`stg`,
  `dev`/`development`/`sandbox`).
- **Organizations**: two illustrative labels (`Platform`, `Apps`) —
  rename to your real organisations.
- **Account types**: Management / Security / Logging / Network with
  AWS-LZA-style match patterns.
- **Role names**: Admin / PowerUser / ReadOnly with common substrings.
- **Services**: 8 deep-links (CloudWatch, S3, EC2, IAM, Lambda,
  CloudFormation, VPC, RDS), using the `{region}` placeholder so they
  pick up the region from General Settings.
- **Sensitive sign-in** triggers on the `admin` role keyword and on
  the `management` + `security` account types.

## How to use

1. Open the AWS SAML sign-in page so Console Hopper is loaded.
2. Hover the right edge → **Import Settings**.
3. Open this file, copy the entire contents, paste into the textarea.
4. Click **Import**. The page reloads with the new config.
5. Edit labels / patterns / colours via the **Manage …** modals to fit
   your real organisation.

## Format

Each sample is a wrapped export document:

```json
{
  "_meta": { "plugin": "Console Hopper", "version": "...", "description": "..." },
  "settings": { /* every key matches a chrome.storage.local key */ }
}
```

The importer also accepts a plain `settings` object without the `_meta`
wrapper. Unknown keys are ignored; malformed entries are rejected
individually.
