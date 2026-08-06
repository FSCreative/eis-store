/* ============================================================
   EIS.STORE — Gemeinsame Logik (Warenkorb, Altersabfrage,
   Produkt-Artwork, Helfer)
   ============================================================ */

const EIS = (() => {
  const NEW_DAYS = 60; // "Neu" = innerhalb der letzten 60 Tage

  /* ---------- Helfer ---------- */
  const byId = id => EIS_PRODUCTS.find(p => p.id === id);
  const fmt = n => n.toLocaleString("de-AT", { style: "currency", currency: "EUR" });

  const isNew = p => (Date.now() - new Date(p.added).getTime()) < NEW_DAYS * 864e5;

  const stars = r => {
    const full = Math.round(r);
    return "★".repeat(full) + "☆".repeat(5 - full);
  };

  /* ---------- Produkt-Artwork (abstrakte SVG-Platzhalter) ---------- */
  function art(p, big) {
    const [bg, fg, shape] = p.art;
    const id = "g" + p.id.replace(/[^a-z0-9]/g, "");
    let inner = "";
    const scale = v => Math.max(0.25, Math.min(1, v));

    if (shape === "capsule") {
      const h = 150 * scale((p.len || 16) / 30);
      const w = 42 * scale((p.girth || 11) / 16);
      inner = `<rect x="${150 - w / 2}" y="${160 - h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="url(#${id}b)"/>`;
    } else if (shape === "drop") {
      inner = `<path d="M150 82 C 190 130, 198 168, 150 208 C 102 168, 110 130, 150 82 Z" fill="url(#${id}b)"/>
               <ellipse cx="150" cy="222" rx="34" ry="10" fill="${fg}" opacity=".45"/>`;
    } else if (shape === "ring") {
      inner = `<circle cx="150" cy="155" r="56" fill="none" stroke="url(#${id}b)" stroke-width="26"/>`;
    } else if (shape === "wave") {
      inner = `<path d="M78 190 C 108 120, 138 120, 152 160 C 166 200, 196 200, 222 132" fill="none" stroke="url(#${id}b)" stroke-width="26" stroke-linecap="round"/>`;
    } else if (shape === "beads") {
      inner = [10, 13, 16, 19, 22].map((r, i) =>
        `<circle cx="150" cy="${88 + i * 34}" r="${r}" fill="url(#${id}b)"/>`).join("");
    } else if (shape === "balls") {
      inner = `<circle cx="126" cy="150" r="34" fill="url(#${id}b)"/>
               <circle cx="178" cy="166" r="30" fill="url(#${id}b)" opacity=".85"/>
               <path d="M204 186 q 26 14 18 38" fill="none" stroke="${fg}" stroke-width="7" stroke-linecap="round"/>`;
    } else if (shape === "bottle") {
      inner = `<rect x="118" y="104" width="64" height="120" rx="16" fill="url(#${id}b)"/>
               <rect x="136" y="76" width="28" height="30" rx="7" fill="${fg}"/>
               <rect x="128" y="140" width="44" height="46" rx="8" fill="#ffffff" opacity=".82"/>`;
    }

    return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name}">
      <defs>
        <linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${bg}"/>
        </linearGradient>
        <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${fg}"/><stop offset="1" stop-color="${fg}" stop-opacity=".65"/>
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#${id}a)"/>
      <circle cx="236" cy="66" r="90" fill="${fg}" opacity=".08"/>
      <circle cx="52" cy="248" r="70" fill="${fg}" opacity=".06"/>
      ${inner}
    </svg>`;
  }

  /* ---------- Warenkorb (localStorage) ---------- */
  const CART_KEY = "eis_cart_v1";
  const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { return {}; } };
  const saveCart = c => { localStorage.setItem(CART_KEY, JSON.stringify(c)); renderBadge(); };
  const cartCount = () => Object.values(getCart()).reduce((a, b) => a + b, 0);

  function addToCart(id, qty = 1) {
    const c = getCart();
    c[id] = (c[id] || 0) + qty;
    saveCart(c);
    toast("Zum Warenkorb hinzugefügt");
  }
  function setQty(id, qty) {
    const c = getCart();
    if (qty <= 0) delete c[id]; else c[id] = qty;
    saveCart(c);
  }
  function clearCart() { saveCart({}); }

  function renderBadge() {
    const el = document.querySelector(".cart-badge");
    if (!el) return;
    const n = cartCount();
    el.textContent = n;
    el.classList.toggle("show", n > 0);
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ---------- Altersabfrage ---------- */
  function ageGate() {
    if (localStorage.getItem("eis_age_ok") === "1") return;
    const gate = document.createElement("div");
    gate.className = "agegate";
    gate.innerHTML = `
      <div class="agegate-card">
        <div class="logo">EIS<em>.</em>STORE</div>
        <h2>Bist du 18 Jahre oder älter?</h2>
        <p>Diese Seite enthält Inhalte für Erwachsene. Bitte bestätige, dass du volljährig bist.</p>
        <div class="btns">
          <button class="btn btn-primary" id="age-yes">Ja, ich bin 18+</button>
          <button class="leave" id="age-no">Nein, Seite verlassen</button>
        </div>
      </div>`;
    document.body.appendChild(gate);
    document.body.classList.add("gated");
    gate.querySelector("#age-yes").onclick = () => {
      localStorage.setItem("eis_age_ok", "1");
      gate.remove();
      document.body.classList.remove("gated");
    };
    gate.querySelector("#age-no").onclick = () => { location.href = "https://www.google.com"; };
  }

  /* ---------- Produktkarte ---------- */
  function cardHTML(p) {
    const dims = p.len
      ? `Länge ${String(p.len).replace(".", ",")} cm · Umfang ${String(p.girth).replace(".", ",")} cm`
      : p.material;
    const badge = isNew(p) ? `<span class="badge new">NEU</span>`
      : p.oldPrice ? `<span class="badge sale">SALE</span>` : "";
    return `
    <a class="card reveal" href="product.html?id=${p.id}">
      ${badge}
      <div class="card-img">${art(p)}</div>
      <div class="card-body">
        <span class="brand">${p.brand}</span>
        <h3>${p.name}</h3>
        <span class="dims">${dims}</span>
        <span class="rating"><span class="stars">${stars(p.rating)}</span> ${p.rating.toFixed(1)} (${p.reviews})</span>
        <div class="price-row">
          <span class="price">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="old">${fmt(p.oldPrice)}</span>` : ""}
        </div>
      </div>
    </a>`;
  }

  /* ---------- Scroll-Reveal ---------- */
  function initReveal() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => { ageGate(); renderBadge(); initReveal(); });

  return { byId, fmt, isNew, stars, art, cardHTML, getCart, addToCart, setQty, clearCart, cartCount, toast, initReveal };
})();
