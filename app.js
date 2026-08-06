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

  /* ---------- Produkt-Artwork (stilisierte SVG-Illustrationen) ----------
     Eigene, maßstabsgetreue Darstellungen — keine Herstellerfotos.       */
  function art(p, big) {
    const [bg, fg, shape] = p.art;
    const id = "g" + p.id.replace(/[^a-z0-9]/g, "");
    let inner = "";
    const scale = v => Math.max(0.25, Math.min(1, v));
    const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.18}" fill="#1d1d1f" opacity=".10"/>`;
    const gloss = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="#ffffff" opacity=".35"/>`;

    if (shape === "capsule") {
      const isWand = p.cat === "vibratoren" && (p.len || 0) >= 28;
      if (isWand) {
        // Wand: runder Kopf + schlanker Griff
        inner = `${shadow(150, 246, 55)}
          <rect x="136" y="120" width="28" height="120" rx="14" fill="url(#${id}b)"/>
          <circle cx="150" cy="96" r="34" fill="url(#${id}b)"/>
          <circle cx="150" cy="96" r="34" fill="none" stroke="#ffffff" stroke-opacity=".25" stroke-width="3"/>
          ${gloss(139, 74, 9, 26)}
          <rect x="142" y="196" width="16" height="5" rx="2.5" fill="#ffffff" opacity=".5"/>`;
      } else {
        const h = 156 * scale((p.len || 16) / 34);
        const w = 44 * scale((p.girth || 11) / 19);
        const x = 150 - w / 2, y = 158 - h / 2;
        const isDildo = p.cat === "dildos";
        inner = `${shadow(150, y + h + 14, w * 1.35)}
          ${isDildo ? `<ellipse cx="150" cy="${y + h - 2}" rx="${w * 0.95}" ry="12" fill="url(#${id}b)"/>` : ""}
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="url(#${id}b)"/>
          <ellipse cx="150" cy="${y + w * 0.42}" rx="${w * 0.42}" ry="${w * 0.34}" fill="#ffffff" opacity=".18"/>
          ${gloss(x + w * 0.16, y + w * 0.5, w * 0.18, h * 0.42)}
          ${!isDildo ? `<rect x="${150 - 6}" y="${y + h - 13}" width="12" height="4" rx="2" fill="#ffffff" opacity=".5"/>` : ""}`;
      }
    } else if (shape === "drop") {
      const s = scale(((p.girth || 8) / 16) + 0.25);
      inner = `${shadow(150, 232, 52)}
        <ellipse cx="150" cy="220" rx="40" ry="11" fill="url(#${id}b)"/>
        <rect x="143" y="196" width="14" height="22" rx="6" fill="url(#${id}b)"/>
        <path d="M150 ${208 - 122 * s} C ${150 + 52 * s} ${208 - 68 * s}, ${150 + 56 * s} ${208 - 32 * s}, 150 202 C ${150 - 56 * s} ${208 - 32 * s}, ${150 - 52 * s} ${208 - 68 * s}, 150 ${208 - 122 * s} Z" fill="url(#${id}b)"/>
        <path d="M${150 - 18 * s} ${208 - 88 * s} q ${8 * s} ${-16 * s} ${22 * s} ${-20 * s}" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width="7" stroke-linecap="round"/>`;
    } else if (shape === "ring") {
      inner = `${shadow(150, 226, 62)}
        <circle cx="150" cy="150" r="58" fill="none" stroke="url(#${id}b)" stroke-width="30"/>
        <circle cx="150" cy="150" r="58" fill="none" stroke="#ffffff" stroke-opacity=".15" stroke-width="12"/>
        <circle cx="150" cy="86" r="22" fill="url(#${id}b)"/>
        <circle cx="144" cy="80" r="6" fill="#ffffff" opacity=".4"/>`;
    } else if (shape === "wave") {
      inner = `${shadow(150, 224, 70)}
        <path d="M84 186 C 112 116, 142 116, 155 156 C 168 196, 198 196, 220 130" fill="none" stroke="url(#${id}b)" stroke-width="30" stroke-linecap="round"/>
        <path d="M92 176 C 114 128, 136 124, 148 150" fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="9" stroke-linecap="round"/>`;
    } else if (shape === "beads") {
      const n = 5, top = 78;
      inner = `${shadow(150, 248, 44)}
        <circle cx="150" cy="${top - 14}" r="13" fill="none" stroke="url(#${id}b)" stroke-width="8"/>` +
        [9, 12, 15, 18, 22].map((r, i) =>
          `<circle cx="150" cy="${top + 22 + i * 33}" r="${r}" fill="url(#${id}b)"/>
           <circle cx="${145 - r * 0.2}" cy="${top + 16 + i * 33}" r="${r * 0.28}" fill="#ffffff" opacity=".4"/>`).join("");
    } else if (shape === "balls") {
      inner = `${shadow(150, 218, 66)}
        <circle cx="124" cy="146" r="36" fill="url(#${id}b)"/>
        <circle cx="182" cy="162" r="31" fill="url(#${id}b)"/>
        <circle cx="112" cy="134" r="10" fill="#ffffff" opacity=".4"/>
        <circle cx="172" cy="152" r="8" fill="#ffffff" opacity=".35"/>
        <path d="M208 184 q 30 16 20 44" fill="none" stroke="${fg}" stroke-width="8" stroke-linecap="round"/>`;
    } else if (shape === "bottle") {
      const initial = (p.brand || "E").charAt(0).toUpperCase();
      inner = `${shadow(150, 240, 52)}
        <rect x="116" y="100" width="68" height="130" rx="17" fill="url(#${id}b)"/>
        <path d="M136 100 q 0 -14 14 -16 q 14 2 14 16 Z" fill="url(#${id}b)"/>
        <rect x="134" y="66" width="32" height="22" rx="6" fill="${fg}"/>
        <rect x="134" y="66" width="32" height="8" rx="4" fill="#ffffff" opacity=".25"/>
        <rect x="126" y="136" width="48" height="56" rx="9" fill="#ffffff" opacity=".92"/>
        <text x="150" y="160" text-anchor="middle" font-family="-apple-system, Helvetica, Arial" font-size="20" font-weight="700" fill="${fg}">${initial}</text>
        <rect x="134" y="170" width="32" height="4" rx="2" fill="${fg}" opacity=".45"/>
        <rect x="138" y="179" width="24" height="4" rx="2" fill="${fg}" opacity=".3"/>
        ${gloss(124, 110, 8, 100)}`;
    }

    return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name} (stilisierte Illustration)">
      <defs>
        <radialGradient id="${id}a" cx="0.35" cy="0.3" r="1.1">
          <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${bg}"/>
        </radialGradient>
        <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${fg}"/><stop offset="1" stop-color="${fg}" stop-opacity=".72"/>
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#${id}a)"/>
      <circle cx="240" cy="60" r="86" fill="${fg}" opacity=".07"/>
      <circle cx="48" cy="252" r="66" fill="${fg}" opacity=".05"/>
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
