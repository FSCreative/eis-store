/* ============================================================
   EIS.STORE — Shop-Seite: Filter & Sortierung
   ============================================================ */

(() => {
  const params = new URLSearchParams(location.search);

  /* ---------- Zustand ---------- */
  const state = {
    cats: new Set(params.get("cat") ? [params.get("cat")] : []),
    brands: new Set(),
    price: [0, 250],
    len: [5, 45],
    girth: [4, 26],
    sale: params.get("sale") === "1",
    onlyNew: false,
    sort: params.get("sort") || "pop"
  };
  const DEF = { price: [0, 250], len: [5, 45], girth: [4, 26] };

  /* ---------- Titel je nach Einstieg ---------- */
  const titleEl = document.getElementById("shop-title");
  if (state.cats.size === 1) {
    const c = EIS_CATEGORIES.find(c => c.id === [...state.cats][0]);
    if (c) titleEl.textContent = c.name + ".";
  } else if (state.sort === "new") {
    titleEl.textContent = "Neuheiten.";
  } else if (state.sale) {
    titleEl.textContent = "Sale.";
  }

  /* ---------- Filter-UI aufbauen ---------- */
  const catBody = document.getElementById("f-cats");
  catBody.innerHTML = EIS_CATEGORIES.map(c => {
    const n = EIS_PRODUCTS.filter(p => p.cat === c.id).length;
    return `<label class="fcheck"><input type="checkbox" data-cat="${c.id}" ${state.cats.has(c.id) ? "checked" : ""}> ${c.name} <span class="cnt">${n}</span></label>`;
  }).join("");

  const brands = [...new Set(EIS_PRODUCTS.map(p => p.brand))].sort();
  document.getElementById("f-brands").innerHTML = brands.map(b => {
    const n = EIS_PRODUCTS.filter(p => p.brand === b).length;
    return `<label class="fcheck"><input type="checkbox" data-brand="${b}"> ${b} <span class="cnt">${n}</span></label>`;
  }).join("");

  document.getElementById("sort").value = state.sort;

  /* ---------- Dual-Range-Slider ---------- */
  function initRange(key, minId, maxId, fillId, minVId, maxVId, fmtFn) {
    const minEl = document.getElementById(minId);
    const maxEl = document.getElementById(maxId);
    const fill = document.getElementById(fillId);
    const minV = document.getElementById(minVId);
    const maxV = document.getElementById(maxVId);
    const lo = +minEl.min, hi = +minEl.max;

    function update(fromUser) {
      let a = +minEl.value, b = +maxEl.value;
      if (a > b) [a, b] = [b, a];
      state[key] = [a, b];
      minV.textContent = fmtFn(a);
      maxV.textContent = fmtFn(b);
      fill.style.left = ((a - lo) / (hi - lo) * 100) + "%";
      fill.style.right = (100 - (b - lo) / (hi - lo) * 100) + "%";
      if (fromUser) render();
    }
    minEl.addEventListener("input", () => update(true));
    maxEl.addEventListener("input", () => update(true));
    update(false);
  }
  initRange("price", "price-min", "price-max", "price-fill", "price-min-v", "price-max-v", v => "€ " + v);
  initRange("len",   "len-min",   "len-max",   "len-fill",   "len-min-v",   "len-max-v",   v => v);
  initRange("girth", "girth-min", "girth-max", "girth-fill", "girth-min-v", "girth-max-v", v => String(v).replace(".", ","));

  /* ---------- Events ---------- */
  document.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.cat)   { t.checked ? state.cats.add(t.dataset.cat) : state.cats.delete(t.dataset.cat); render(); }
    if (t.dataset.brand) { t.checked ? state.brands.add(t.dataset.brand) : state.brands.delete(t.dataset.brand); render(); }
    if (t.id === "f-sale") { state.sale = t.checked; render(); }
    if (t.id === "f-new")  { state.onlyNew = t.checked; render(); }
    if (t.id === "sort")   { state.sort = t.value; render(); }
  });
  document.getElementById("f-sale").checked = state.sale;

  document.getElementById("f-reset").onclick = () => {
    state.cats.clear(); state.brands.clear();
    state.sale = false; state.onlyNew = false;
    document.querySelectorAll(".filters input[type=checkbox]").forEach(c => c.checked = false);
    resetRange("price"); resetRange("len"); resetRange("girth");
    render();
  };

  function resetRange(key) {
    const [lo, hi] = DEF[key];
    const map = { price: ["price-min", "price-max"], len: ["len-min", "len-max"], girth: ["girth-min", "girth-max"] };
    document.getElementById(map[key][0]).value = lo;
    document.getElementById(map[key][1]).value = hi;
    document.getElementById(map[key][0]).dispatchEvent(new Event("input"));
  }

  // Filter-Gruppen ein-/ausklappen
  document.querySelectorAll(".fgroup h4").forEach(h =>
    h.addEventListener("click", () => h.parentElement.classList.toggle("closed")));

  // Mobile: Filter-Sheet
  const panel = document.getElementById("filters");
  document.getElementById("filter-toggle").onclick = () => panel.classList.toggle("open");
  document.addEventListener("click", e => {
    if (panel.classList.contains("open") && !panel.contains(e.target) && e.target.id !== "filter-toggle")
      panel.classList.remove("open");
  });

  /* ---------- Filtern ---------- */
  const rangeActive = key => state[key][0] !== DEF[key][0] || state[key][1] !== DEF[key][1];

  function filtered() {
    return EIS_PRODUCTS.filter(p => {
      if (state.cats.size && !state.cats.has(p.cat)) return false;
      if (state.brands.size && !state.brands.has(p.brand)) return false;
      if (p.price < state.price[0] || p.price > state.price[1]) return false;
      if (rangeActive("len")   && (p.len   == null || p.len   < state.len[0]   || p.len   > state.len[1]))   return false;
      if (rangeActive("girth") && (p.girth == null || p.girth < state.girth[0] || p.girth > state.girth[1])) return false;
      if (state.sale && !p.oldPrice) return false;
      if (state.onlyNew && !EIS.isNew(p)) return false;
      return true;
    });
  }

  /* ---------- Sortieren ---------- */
  const sorters = {
    "pop":        (a, b) => b.pop - a.pop,
    "new":        (a, b) => new Date(b.added) - new Date(a.added),
    "price-asc":  (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "rating":     (a, b) => b.rating - a.rating || b.reviews - a.reviews,
    "discount":   (a, b) => ((b.oldPrice || b.price) - b.price) - ((a.oldPrice || a.price) - a.price)
  };

  /* ---------- Aktive Filter-Chips ---------- */
  function chipsHTML() {
    const chips = [];
    state.cats.forEach(id => {
      const c = EIS_CATEGORIES.find(x => x.id === id);
      chips.push({ label: c ? c.name : id, undo: () => { state.cats.delete(id); syncChecks(); } });
    });
    state.brands.forEach(b => chips.push({ label: b, undo: () => { state.brands.delete(b); syncChecks(); } }));
    if (rangeActive("price")) chips.push({ label: `€ ${state.price[0]} – € ${state.price[1]}`, undo: () => resetRange("price") });
    if (rangeActive("len"))   chips.push({ label: `Länge ${state.len[0]}–${state.len[1]} cm`, undo: () => resetRange("len") });
    if (rangeActive("girth")) chips.push({ label: `Umfang ${String(state.girth[0]).replace(".", ",")}–${String(state.girth[1]).replace(".", ",")} cm`, undo: () => resetRange("girth") });
    if (state.sale)    chips.push({ label: "Sale", undo: () => { state.sale = false; document.getElementById("f-sale").checked = false; } });
    if (state.onlyNew) chips.push({ label: "Neuheiten", undo: () => { state.onlyNew = false; document.getElementById("f-new").checked = false; } });
    return chips;
  }

  function syncChecks() {
    document.querySelectorAll("[data-cat]").forEach(c => c.checked = state.cats.has(c.dataset.cat));
    document.querySelectorAll("[data-brand]").forEach(c => c.checked = state.brands.has(c.dataset.brand));
  }

  /* ---------- Rendern ---------- */
  function render() {
    const items = filtered().sort(sorters[state.sort] || sorters.pop);
    document.getElementById("grid").innerHTML = items.length
      ? items.map(EIS.cardHTML).join("")
      : `<div class="empty">Keine Produkte gefunden.<br>Versuch es mit weniger Filtern.</div>`;
    document.getElementById("count").textContent =
      items.length + (items.length === 1 ? " Produkt" : " Produkte");

    const chips = chipsHTML();
    document.getElementById("chips").innerHTML = chips.map((c, i) =>
      `<span class="chip">${c.label} <button data-chip="${i}" aria-label="Filter entfernen">✕</button></span>`).join("");
    document.querySelectorAll("[data-chip]").forEach(btn =>
      btn.onclick = () => { chips[+btn.dataset.chip].undo(); render(); });

    EIS.initReveal();
  }

  render();
})();
