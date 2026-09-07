# Store screenshot staging

Produces a 1280×800 Chrome Web Store screenshot from the live role picker.

    ./shoot.sh <chrome-window-id> out.png

`shoot.sh` sizes and activates a Chrome window, runs `stage.js` in it, and
captures the viewport. `stage.js` does the staging and gates the shot.

**Prerequisites**

- mock-saml running on `localhost:4000` (`npm run dev`), and that window signed
  in at `localhost:4000/saml/login` — the form arrives pre-filled with the AWS
  ACS URL, so submitting it is one click and lands on the role picker.
- Chrome's **View → Developer → "Allow JavaScript from Apple Events"** enabled.
- Screen Recording permission for the terminal running the script.
- The display unlocked: a locked or sleeping screen makes `screencapture`
  return a black frame or fail outright.

**What `stage.js` does**

- Rewrites visible account ids, account names, role names and tags to demo
  values, keyed off `data-account-id` so it is stable and re-runnable. Every
  `data-*` attribute keeps its real value; a page reload restores everything.
- Refuses the shot (`leaks`) if any real account id, `CH*` role name, real
  jump-profile name, off-list tag, or AWS service-name list is still legible.
- Fits the picker to the frame: the store's 1280×800 is this display's full
  width, so it renders at `zoom: 0.84` and captures 1:1 rather than shooting
  large and downscaling — `screencapture -R` silently clips at the screen edge
  and a later `sips -z` would stretch the clipped image without complaining.
- Parks the slide-out side menu (`#tm_actions_container`) at its collapsed
  position. It is `position: fixed` at a `left` the extension computes once and
  does not recompute on a synthetic resize, and that inline value carries
  `!important` — so staging has to override it the same way.

Adjust the scene (which dialog is open, theme, filters) by editing `stage.js`.
