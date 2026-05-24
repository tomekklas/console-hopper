// Minimal jQuery-subset DOM shim extracted from content.js (ROADMAP.md
// Stage 3/4). Implements only the methods content.js uses, with
// jQuery-faithful semantics. Browser globals (document/window/etc.) are
// available at runtime in the content script and via jsdom in tests.

const uniq = (arr) => arr.filter((el, i) => arr.indexOf(el) === i);

const parseHTML = (html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = String(html).trim();
  return Array.from(tpl.content.childNodes);
};

// Mirror jQuery's data() coercion so values read from data-* attributes keep
// the exact types the old code received (e.g. a numeric account id -> Number).
const coerceData = (data) => {
  if (data == null) return undefined;
  if (data === "true") return true;
  if (data === "false") return false;
  if (data === "null") return null;
  if (data === +data + "") return +data;
  if (/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/.test(data)) {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
};

const domReady = (fn) => {
  if (document.readyState !== "loading") setTimeout(fn, 0);
  else document.addEventListener("DOMContentLoaded", () => fn(), { once: true });
};

const MOUSE_EVENTS = ["click", "auxclick", "mousedown", "mouseup", "dblclick"];

class Wrapper {
  constructor(els) {
    this.els = els;
    this.length = els.length;
    els.forEach((el, i) => {
      this[i] = el; // array-like indexing: $x[0]
    });
  }

  // -- iteration / collection --
  each(fn) {
    this.els.forEach((el, i) => fn.call(el, i, el));
    return this;
  }
  map(fn) {
    const out = [];
    this.els.forEach((el, i) => {
      const v = fn.call(el, i, el);
      if (v != null) out.push(v);
    });
    return new Wrapper(out);
  }
  get(i) {
    return i == null ? this.els.slice() : this.els[i];
  }

  // -- traversal --
  first() {
    return new Wrapper(this.els.slice(0, 1));
  }
  last() {
    return new Wrapper(this.els.slice(-1));
  }
  eq(i) {
    const el = this.els.at(i);
    return new Wrapper(el ? [el] : []);
  }
  filter(sel) {
    if (typeof sel === "function") {
      return new Wrapper(this.els.filter((el, i) => sel.call(el, i, el)));
    }
    return new Wrapper(this.els.filter((el) => el.matches && el.matches(sel)));
  }
  not(sel) {
    return new Wrapper(this.els.filter((el) => !(el.matches && el.matches(sel))));
  }
  is(sel) {
    return this.els.some((el) => el.matches && el.matches(sel));
  }
  find(sel) {
    const out = [];
    this.els.forEach((el) => {
      if (el.querySelectorAll) out.push(...el.querySelectorAll(sel));
    });
    return new Wrapper(uniq(out));
  }
  closest(sel) {
    const out = [];
    this.els.forEach((el) => {
      const m = el.closest && el.closest(sel);
      if (m) out.push(m);
    });
    return new Wrapper(uniq(out));
  }
  parent() {
    return new Wrapper(uniq(this.els.map((el) => el.parentElement).filter(Boolean)));
  }
  children(sel) {
    const out = [];
    this.els.forEach((el) => {
      Array.from(el.children || []).forEach((c) => {
        if (!sel || c.matches(sel)) out.push(c);
      });
    });
    return new Wrapper(out);
  }
  prev() {
    return new Wrapper(uniq(this.els.map((el) => el.previousElementSibling).filter(Boolean)));
  }
  prevAll(sel) {
    const out = [];
    this.els.forEach((el) => {
      let p = el.previousElementSibling;
      while (p) {
        if (!sel || p.matches(sel)) out.push(p);
        p = p.previousElementSibling;
      }
    });
    return new Wrapper(out); // nearest-first, matching jQuery
  }

  // -- insertion / removal --
  _insert(content, place) {
    const nodes = toNodes(content);
    this.els.forEach((el, idx) => {
      const ns = idx === this.els.length - 1 ? nodes : nodes.map((n) => n.cloneNode(true));
      place(el, ns);
    });
    return this;
  }
  append(content) {
    return this._insert(content, (el, ns) => ns.forEach((n) => el.appendChild(n)));
  }
  prepend(content) {
    return this._insert(content, (el, ns) => {
      const ref = el.firstChild;
      ns.forEach((n) => el.insertBefore(n, ref));
    });
  }
  before(content) {
    return this._insert(content, (el, ns) => {
      if (el.parentNode) ns.forEach((n) => el.parentNode.insertBefore(n, el));
    });
  }
  after(content) {
    return this._insert(content, (el, ns) => {
      if (!el.parentNode) return;
      const ref = el.nextSibling;
      ns.forEach((n) => el.parentNode.insertBefore(n, ref));
    });
  }
  appendTo(target) {
    $(target).append(this);
    return this;
  }
  remove() {
    this.els.forEach((el) => el.remove && el.remove());
    return this;
  }
  empty() {
    this.els.forEach((el) => {
      while (el.firstChild) el.removeChild(el.firstChild);
    });
    return this;
  }

  // -- content / attributes --
  text(v) {
    if (v === undefined) return this.els[0] ? this.els[0].textContent : "";
    this.els.forEach((el) => {
      el.textContent = v;
    });
    return this;
  }
  html(v) {
    if (v === undefined) return this.els[0] ? this.els[0].innerHTML : "";
    this.els.forEach((el) => {
      el.innerHTML = v;
    });
    return this;
  }
  val(v) {
    if (v === undefined) return this.els[0] ? this.els[0].value : undefined;
    this.els.forEach((el) => {
      el.value = v;
    });
    return this;
  }
  attr(name, v) {
    if (v === undefined) return this.els[0] ? this.els[0].getAttribute(name) : undefined;
    this.els.forEach((el) => el.setAttribute(name, v));
    return this;
  }
  removeAttr(name) {
    this.els.forEach((el) => el.removeAttribute(name));
    return this;
  }
  prop(name, v) {
    if (v === undefined) return this.els[0] ? this.els[0][name] : undefined;
    this.els.forEach((el) => {
      el[name] = v;
    });
    return this;
  }
  data(key) {
    const el = this.els[0];
    return el ? coerceData(el.getAttribute("data-" + key)) : undefined;
  }
  css(prop, v) {
    if (v === undefined && typeof prop === "string") {
      const el = this.els[0];
      if (!el) return undefined;
      return getComputedStyle(el).getPropertyValue(prop) || el.style[prop];
    }
    this.els.forEach((el) => {
      el.style[prop] = v;
    });
    return this;
  }
  addClass(c) {
    const names = String(c).split(/\s+/).filter(Boolean);
    this.els.forEach((el) => el.classList.add(...names));
    return this;
  }
  removeClass(c) {
    const names = String(c).split(/\s+/).filter(Boolean);
    this.els.forEach((el) => el.classList.remove(...names));
    return this;
  }
  toggleClass(c, state) {
    this.els.forEach((el) => {
      if (state === undefined) el.classList.toggle(c);
      else el.classList.toggle(c, !!state);
    });
    return this;
  }
  hasClass(c) {
    return this.els.some((el) => el.classList.contains(c));
  }

  // -- events / effects --
  on(events, selector, handler) {
    if (typeof selector === "function") {
      handler = selector;
      selector = null;
    }
    const types = String(events).split(/\s+/).filter(Boolean);
    this.els.forEach((el) => {
      types.forEach((type) => {
        el.addEventListener(type, (e) => {
          let target = el;
          if (selector) {
            const match = e.target && e.target.closest ? e.target.closest(selector) : null;
            if (!match || !el.contains(match)) return;
            target = match;
          }
          const ret = handler.call(target, e);
          if (ret === false) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
      });
    });
    return this;
  }
  trigger(arg) {
    this.els.forEach((el) => {
      if (arg instanceof Event) {
        el.dispatchEvent(arg);
        return;
      }
      if (arg === "focus" && el.focus) return el.focus();
      if (arg === "blur" && el.blur) return el.blur();
      if (arg === "select" && el.select) return el.select();
      if (arg === "submit" && el.submit) return el.submit();
      const Ctor = MOUSE_EVENTS.includes(arg) ? MouseEvent : Event;
      el.dispatchEvent(new Ctor(arg, { bubbles: true, cancelable: true }));
    });
    return this;
  }
  submit() {
    this.els.forEach((el) => {
      if (el.submit) el.submit();
      else el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    return this;
  }
  focus() {
    if (this.els[0] && this.els[0].focus) this.els[0].focus();
    return this;
  }
  blur() {
    this.els.forEach((el) => el.blur && el.blur());
    return this;
  }
  ready(fn) {
    domReady(fn);
    return this;
  }
  show() {
    this.els.forEach((el) => {
      if (el.style && el.style.display === "none") el.style.display = "";
    });
    return this;
  }
  hide() {
    this.els.forEach((el) => {
      if (el.style) el.style.display = "none";
    });
    return this;
  }
  fadeOut(duration, cb) {
    this.els.forEach((el) => {
      if (el.style) {
        el.style.transition = `opacity ${duration}ms`;
        el.style.opacity = "0";
      }
    });
    if (cb) setTimeout(cb, duration);
    return this;
  }
}

const toNodes = (content) => {
  if (content == null) return [];
  if (typeof content === "string") return parseHTML(content);
  if (content instanceof Wrapper) return content.els.slice();
  if (Array.isArray(content) || content instanceof NodeList) {
    return Array.from(content).flatMap(toNodes);
  }
  if (content.nodeType) return [content];
  return [];
};

function $(arg) {
  if (arg instanceof Wrapper) return arg;
  if (arg == null) return new Wrapper([]);
  if (typeof arg === "function") {
    domReady(arg);
    return new Wrapper([document]);
  }
  if (typeof arg === "string") {
    const s = arg.trim();
    if (s[0] === "<") return new Wrapper(parseHTML(s));
    return new Wrapper(Array.from(document.querySelectorAll(s)));
  }
  if (arg === window || arg === document || arg.nodeType) return new Wrapper([arg]);
  if (Array.isArray(arg) || arg instanceof NodeList) return new Wrapper(Array.from(arg));
  return new Wrapper([arg]);
}

// jQuery.Event factory — used once to forward metaKey/ctrlKey into a
// programmatic click so ⌘/Ctrl+Enter mirrors a modified mouse click.
$.Event = (type, props) => {
  const Ctor = MOUSE_EVENTS.includes(type) ? MouseEvent : Event;
  return new Ctor(type, { bubbles: true, cancelable: true, ...(props || {}) });
};

export { $, coerceData };
