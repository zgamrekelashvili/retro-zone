/* ============================================================
   main.js — Module Entry Point & DOM Orchestrator
   ============================================================ */

import {
  fetchAllItems,
  fetchItemById,
  applyFilters,
  loadCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCart,
  loadUserListings,
  saveUserListing,
  deleteUserListing,
  state
} from "./api.js";

// ---------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------

/** Format price as USD string */
function formatPrice(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/** Debounce closure — wraps a function to delay execution */
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** Show / hide loading spinner */
function setLoading(show) {
  const el = document.getElementById("loading");
  if (el) el.classList.toggle("hidden", !show);
}

/** Show error notice */
function showError(msg) {
  const el = document.getElementById("error-notice");
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
  }
  setLoading(false);
}

/** Update cart badge across all pages */
function updateCartBadge() {
  const cart = getCart();
  const badge = document.getElementById("cart-badge");
  if (badge) {
    badge.textContent = cart.length;
    badge.classList.add("bump");
    setTimeout(() => badge.classList.remove("bump"), 300);
  }
}

// ---------------------------------------------------------------
// PAGE DETECTION — runs the right init based on current filename
// ---------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  updateCartBadge();
  initMobileNav();

  const path = window.location.pathname;
  const page = path.split("/").pop() || "index.html";

  if (page === "index.html" || page === "") initCatalogPage();
  else if (page === "detail.html")          initDetailPage();
  else if (page === "post.html")            initPostPage();
  else if (page === "profile.html")         initProfilePage();
  else if (page === "cart.html")            initCartPage();
});

// ---------------------------------------------------------------
// MOBILE NAV TOGGLE
// ---------------------------------------------------------------
function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav    = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.toggle("open"));
}

// ---------------------------------------------------------------
// INDEX.HTML — Catalog Page
// ---------------------------------------------------------------
async function initCatalogPage() {
  setLoading(true);

  try {
    await fetchAllItems();
    renderGrid(state.filteredItems);
  } catch (err) {
    showError("Failed to load listings. Please refresh the page.");
    return;
  }

  // Search with debounce closure
  const searchInput = document.getElementById("search-input");
  const debouncedSearch = debounce(async (val) => {
    state.filters.search = val.trim();
    setLoading(true);
    const results = await applyFilters();
    renderGrid(results);
  }, 350);

  if (searchInput) {
    searchInput.addEventListener("input", e => debouncedSearch(e.target.value));
  }

  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      if (searchInput) debouncedSearch(searchInput.value);
    });
  }

  // Catalog-type radio filters
  document.querySelectorAll('input[name="catalog"]').forEach(radio => {
    radio.addEventListener("change", async () => {
      state.filters.catalog = radio.value;
      // Sync the active tab button
      document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.tab === radio.value || (radio.value === "all" && b.dataset.tab === "cars"));
      });
      setLoading(true);
      const results = await applyFilters();
      renderGrid(results);
    });
  });

  // Tab buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.filters.catalog = btn.dataset.tab;
      // Sync the radio
      const radio = document.querySelector(`input[name="catalog"][value="${btn.dataset.tab}"]`);
      if (radio) radio.checked = true;
      setLoading(true);
      const results = await applyFilters();
      renderGrid(results);
    });
  });

  // Checkbox filters — closure in loop
  ["era", "country", "engine", "trim"].forEach(filterKey => {
    const filterStateKey = filterKey === "era" ? "eras"
      : filterKey === "country" ? "countries"
      : filterKey === "engine"  ? "engines"
      : "trims";

    document.querySelectorAll(`input[name="${filterKey}"]`).forEach(cb => {
      cb.addEventListener("change", async () => {
        // Closure captures filterStateKey correctly
        const checked = [...document.querySelectorAll(`input[name="${filterKey}"]:checked`)]
          .map(el => el.value);
        state.filters[filterStateKey] = checked;
        setLoading(true);
        const results = await applyFilters();
        renderGrid(results);
      });
    });
  });

  // Reset filters
  const resetBtn = document.getElementById("reset-filters");
  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      // Reset checkboxes + radios
      document.querySelectorAll(".sidebar input").forEach(el => {
        if (el.type === "checkbox") el.checked = false;
        if (el.type === "radio" && el.value === "all") el.checked = true;
      });
      if (searchInput) searchInput.value = "";
      state.filters = { catalog: "all", eras: [], countries: [], engines: [], trims: [], search: "" };
      setLoading(true);
      const results = await applyFilters();
      renderGrid(results);
    });
  }

  const clearFiltersEmpty = document.getElementById("clear-filters-empty");
  if (clearFiltersEmpty) {
    clearFiltersEmpty.addEventListener("click", () => {
      document.getElementById("reset-filters")?.click();
    });
  }
}

/** Render the items grid */
function renderGrid(items) {
  setLoading(false);
  const grid    = document.getElementById("items-grid");
  const empty   = document.getElementById("empty-state");
  const counter = document.getElementById("result-count");

  if (!grid) return;

  if (counter) {
    counter.textContent = items.length === 0
      ? "No results"
      : `${items.length} listing${items.length !== 1 ? "s" : ""}`;
  }

  if (items.length === 0) {
    grid.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");

  grid.innerHTML = "";
  items.forEach((item, index) => {
    // Closure to capture each item's index / data for event handler
    const card = buildCard(item, index);
    grid.appendChild(card);
  });
}

/** Build a card element via DOM APIs */
function buildCard(item, index) {
  const article = document.createElement("article");
  article.className = "item-card";
  article.style.animationDelay = `${index * 0.04}s`;

  article.innerHTML = `
    <div class="card-image-wrap">
      <img src="${item.image}" alt="${item.title}" loading="lazy" />
      <span class="card-badge ${item.type === "cars" ? "badge-car" : "badge-part"}">${item.type === "cars" ? "Car" : "Part"}</span>
      <span class="card-era">${item.era}</span>
    </div>
    <div class="card-body">
      <h2 class="card-title">${item.title}</h2>
      <div class="card-specs">
        <span class="spec-tag">${item.country}</span>
        <span class="spec-tag">${item.engine}</span>
        <span class="spec-tag">${item.trim}</span>
        <span class="spec-tag">${item.condition}</span>
      </div>
      <p class="card-price">${formatPrice(item.price)}</p>
    </div>
    <div class="card-footer">
      <button class="btn-add-cart" data-id="${item.id}">+ Add to Cart</button>
      <a href="detail.html?id=${item.id}" class="card-detail-link">View Details →</a>
    </div>
  `;

  // Closure: each button captures its specific item
  const addBtn = article.querySelector(".btn-add-cart");
  addBtn.addEventListener("click", () => {
    const added = addToCart(item);
    if (added) {
      addBtn.textContent = "✓ Added";
      addBtn.classList.add("added");
      setTimeout(() => {
        addBtn.textContent = "+ Add to Cart";
        addBtn.classList.remove("added");
      }, 2000);
    } else {
      addBtn.textContent = "Already in Cart";
      setTimeout(() => { addBtn.textContent = "+ Add to Cart"; }, 1500);
    }
    updateCartBadge();
  });

  return article;
}

// ---------------------------------------------------------------
// DETAIL.HTML — Product Detail Page
// ---------------------------------------------------------------
async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    showError("No listing ID found in URL. Please return to the catalog.");
    return;
  }

  setLoading(true);

  try {
    const item = await fetchItemById(id);
    setLoading(false);
    renderDetailView(item);
    document.title = `RetroZone — ${item.title}`;
  } catch (err) {
    showError(err.message || "Failed to load listing. Please go back and try another.");
  }
}

function renderDetailView(item) {
  const root = document.getElementById("detail-root");
  if (!root) return;

  // Wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "detail-wrapper";

  // Gallery column
  const gallery = document.createElement("div");
  gallery.className = "detail-gallery";

  const img = document.createElement("img");
  img.src = item.image;
  img.alt = item.title;
  img.className = "detail-main-img";
  gallery.appendChild(img);

  // Info column
  const info = document.createElement("div");
  info.className = "detail-info";

  // Eyebrow
  const eyebrow = document.createElement("div");
  eyebrow.className = "detail-eyebrow";
  eyebrow.innerHTML = `
    <span class="card-badge ${item.type === "cars" ? "badge-car" : "badge-part"}" style="position:static;">${item.type === "cars" ? "Classic Car" : "Spare Part"}</span>
    <span>${item.era}</span>
    <span>${item.country}</span>
  `;
  info.appendChild(eyebrow);

  // Title
  const title = document.createElement("h1");
  title.className = "detail-title";
  title.textContent = item.title;
  info.appendChild(title);

  // Price block
  const priceBlock = document.createElement("div");
  priceBlock.className = "detail-price-block";
  priceBlock.innerHTML = `
    <span class="detail-price">${formatPrice(item.price)}</span>
    <span class="spec-tag">${item.condition}</span>
  `;
  info.appendChild(priceBlock);

  // Specifications grid
  const specsTitle = document.createElement("h3");
  specsTitle.textContent = "Technical Specifications";
  info.appendChild(specsTitle);

  const specsGrid = document.createElement("div");
  specsGrid.className = "specs-grid";
  Object.entries(item.specs).forEach(([key, val]) => {
    const row = document.createElement("div");
    row.className = "spec-row";
    row.innerHTML = `<span class="spec-key">${key}</span><span class="spec-val">${val}</span>`;
    specsGrid.appendChild(row);
  });
  info.appendChild(specsGrid);

  // Historical background
  const historyTitle = document.createElement("h3");
  historyTitle.textContent = "Background";
  info.appendChild(historyTitle);

  const history = document.createElement("div");
  history.className = "detail-history";
  history.textContent = item.history;
  info.appendChild(history);

  // Tags
  const tags = document.createElement("div");
  tags.className = "detail-tags";
  [item.era, item.engineType, item.trim, item.country].forEach(tag => {
    const span = document.createElement("span");
    span.className = "spec-tag";
    span.textContent = tag;
    tags.appendChild(span);
  });
  info.appendChild(tags);

  // Add to Cart button
  const addBtn = document.createElement("button");
  addBtn.className = "btn btn-primary btn-large";
  addBtn.textContent = "Add to Cart";
  addBtn.addEventListener("click", () => {
    const added = addToCart(item);
    if (added) {
      addBtn.textContent = "✓ Added to Cart";
      setTimeout(() => { addBtn.textContent = "Add to Cart"; }, 2000);
    } else {
      addBtn.textContent = "Already in Cart";
      setTimeout(() => { addBtn.textContent = "Add to Cart"; }, 1500);
    }
    updateCartBadge();
  });
  info.appendChild(addBtn);

  wrapper.appendChild(gallery);
  wrapper.appendChild(info);
  root.appendChild(wrapper);
}

// ---------------------------------------------------------------
// POST.HTML — Post an Ad Form
// ---------------------------------------------------------------
function initPostPage() {
  const form        = document.getElementById("post-form");
  const successCard = document.getElementById("success-card");
  const postAnother = document.getElementById("post-another");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!validatePostForm()) return;

    const data = new FormData(form);
    const listing = {
      id: "user-" + Date.now(),
      title:       data.get("title"),
      category:    data.get("category"),
      era:         data.get("era"),
      price:       parseFloat(data.get("price")) || 0,
      country:     data.get("country") || "Other",
      condition:   data.get("condition"),
      engine:      data.get("engine") || "Not specified",
      trim:        data.get("trim") || "Base",
      email:       data.get("email"),
      description: data.get("description"),
      postedAt:    new Date().toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" })
    };

    saveUserListing(listing);

    form.classList.add("hidden");
    successCard.classList.remove("hidden");
    updateCartBadge();
  });

  if (postAnother) {
    postAnother.addEventListener("click", () => {
      form.reset();
      clearFieldErrors();
      successCard.classList.add("hidden");
      form.classList.remove("hidden");
    });
  }
}

function validatePostForm() {
  clearFieldErrors();
  let valid = true;

  const rules = [
    { id: "ad-title",       errId: "err-title",       check: v => v.length >= 10, msg: "Title must be at least 10 characters." },
    { id: "ad-category",    errId: "err-category",    check: v => v !== "",       msg: "Please select a category." },
    { id: "ad-era",         errId: "err-era",         check: v => v !== "",       msg: "Please select an era." },
    { id: "ad-price",       errId: "err-price",       check: v => parseFloat(v) > 0, msg: "Please enter a valid price." },
    { id: "ad-email",       errId: "err-email",       check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: "Please enter a valid email address." },
    { id: "ad-description", errId: "err-description", check: v => v.length >= 30, msg: "Description must be at least 30 characters." }
  ];

  rules.forEach(({ id, errId, check, msg }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el || !err) return;
    if (!check(el.value.trim())) {
      err.textContent = msg;
      el.classList.add("error");
      valid = false;
    }
  });

  // Condition radio
  const conditionChecked = document.querySelector('input[name="condition"]:checked');
  const conditionErr = document.getElementById("err-condition");
  if (!conditionChecked && conditionErr) {
    conditionErr.textContent = "Please select a condition.";
    valid = false;
  }

  return valid;
}

function clearFieldErrors() {
  document.querySelectorAll(".field-error").forEach(el => { el.textContent = ""; });
  document.querySelectorAll(".error").forEach(el => el.classList.remove("error"));
}

// ---------------------------------------------------------------
// PROFILE.HTML — User Profile
// ---------------------------------------------------------------
function initProfilePage() {
  const listingsEl = document.getElementById("my-listings");
  const statNum    = document.getElementById("stat-listings");
  const statCart   = document.getElementById("stat-cart");

  const listings = loadUserListings();
  const cart     = getCart();

  if (statNum)  statNum.textContent  = listings.length;
  if (statCart) statCart.textContent = cart.length;

  if (!listingsEl) return;

  if (listings.length === 0) {
    listingsEl.innerHTML = `
      <div class="profile-empty">
        <span class="empty-icon">🏁</span>
        <p>You haven't posted any listings yet.</p>
        <p><a href="post.html">Post your first listing →</a></p>
      </div>
    `;
    return;
  }

  listings.forEach(listing => {
    const card = buildListingCard(listing);
    listingsEl.appendChild(card);
  });
}

function buildListingCard(listing) {
  const div = document.createElement("div");
  div.className = "listing-card";
  div.dataset.id = listing.id;

  const priceStr = listing.price > 0 ? formatPrice(listing.price) : "Price on Request";

  div.innerHTML = `
    <div class="listing-info">
      <h3>${listing.title}</h3>
      <div class="listing-meta">
        <span>${listing.category === "cars" ? "🚗 Classic Car" : "🔧 Spare Part"}</span>
        <span>·</span>
        <span>${listing.era}</span>
        <span>·</span>
        <span>${listing.condition}</span>
        <span>·</span>
        <span>Posted ${listing.postedAt}</span>
      </div>
    </div>
    <div class="listing-actions">
      <span class="listing-price">${priceStr}</span>
      <button class="btn btn-danger" data-delete="${listing.id}">Remove</button>
    </div>
  `;

  // Delete button — closure captures listing.id
  const deleteBtn = div.querySelector(`[data-delete="${listing.id}"]`);
  deleteBtn.addEventListener("click", () => {
    deleteUserListing(listing.id);
    div.remove();

    // Update stat
    const statNum = document.getElementById("stat-listings");
    if (statNum) statNum.textContent = loadUserListings().length;

    // Show empty if all removed
    const listingsEl = document.getElementById("my-listings");
    if (listingsEl && listingsEl.children.length === 0) {
      listingsEl.innerHTML = `
        <div class="profile-empty">
          <span class="empty-icon">🏁</span>
          <p>You haven't posted any listings yet.</p>
          <p><a href="post.html">Post your first listing →</a></p>
        </div>
      `;
    }
  });

  return div;
}

// ---------------------------------------------------------------
// CART.HTML — Cart & Checkout Page
// ---------------------------------------------------------------
function initCartPage() {
  renderCartItems();

  // Clear all button
  const clearBtn = document.getElementById("clear-cart");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearCart();
      renderCartItems();
      updateCartBadge();
    });
  }

  // Checkout form
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateCheckoutForm()) return;
      if (getCart().length === 0) {
        showError("Your cart is empty. Add some items before checking out.");
        return;
      }

      // Simulate successful order
      clearCart();
      updateCartBadge();

      const cartLayout    = document.querySelector(".cart-layout");
      const orderSuccess  = document.getElementById("order-success");
      if (cartLayout)   cartLayout.classList.add("hidden");
      if (orderSuccess) orderSuccess.classList.remove("hidden");
    });
  }
}

function renderCartItems() {
  const cart         = getCart();
  const listEl       = document.getElementById("cart-items-list");
  const actionsEl    = document.getElementById("cart-actions");
  const sidebarEl    = document.getElementById("cart-sidebar");
  const summaryCount = document.getElementById("summary-count");
  const subtotalEl   = document.getElementById("summary-subtotal");
  const totalEl      = document.getElementById("summary-total");

  if (!listEl) return;
  listEl.innerHTML = "";

  if (cart.length === 0) {
    listEl.innerHTML = `
      <div class="cart-empty-state">
        <span class="empty-icon">🛒</span>
        <p>Your cart is empty.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:16px;">Browse Listings</a>
      </div>
    `;
    if (actionsEl) actionsEl.style.display = "none";
    if (sidebarEl) sidebarEl.style.display = "none";
    return;
  }

  if (actionsEl) actionsEl.style.display = "";
  if (sidebarEl) sidebarEl.style.display = "";

  let total = 0;
  cart.forEach(item => {
    total += item.price;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${item.image}" alt="${item.title}" class="cart-item-img" loading="lazy" />
      <div class="cart-item-info">
        <p class="cart-item-title">${item.title}</p>
        <p class="cart-item-sub">${item.type === "cars" ? "Classic Car" : "Spare Part"}</p>
      </div>
      <span class="cart-item-price">${formatPrice(item.price)}</span>
      <button class="btn btn-danger" data-remove="${item.id}">Remove</button>
    `;

    // Closure captures item.id
    div.querySelector(`[data-remove="${item.id}"]`).addEventListener("click", () => {
      removeFromCart(item.id);
      updateCartBadge();
      renderCartItems();
    });

    listEl.appendChild(div);
  });

  if (summaryCount) summaryCount.textContent = cart.length;
  if (subtotalEl)   subtotalEl.textContent   = formatPrice(total);
  if (totalEl)      totalEl.textContent      = formatPrice(total);
}

function validateCheckoutForm() {
  // Clear prior errors
  ["err-checkout-name", "err-checkout-email", "err-checkout-address", "err-checkout-payment"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "";
    });
  document.querySelectorAll(".checkout-form .error").forEach(el => el.classList.remove("error"));

  let valid = true;
  const rules = [
    { id: "checkout-name",    errId: "err-checkout-name",    check: v => v.length >= 3,  msg: "Full name required (min 3 chars)." },
    { id: "checkout-email",   errId: "err-checkout-email",   check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: "Valid email required." },
    { id: "checkout-address", errId: "err-checkout-address", check: v => v.length >= 10, msg: "Please enter a full shipping address." },
    { id: "checkout-payment", errId: "err-checkout-payment", check: v => v !== "",       msg: "Please select a payment method." }
  ];

  rules.forEach(({ id, errId, check, msg }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el || !err) return;
    if (!check(el.value.trim())) {
      err.textContent = msg;
      el.classList.add("error");
      valid = false;
    }
  });

  return valid;
}
/* =========================================================
   RetroZone — main.js
   Covers: auth helpers, catalog, post, cart, profile
   All persistence via localStorage with "rz_" prefix
   ========================================================= */

/* ─── STORAGE KEYS ───────────────────────────────────────── */
const RZ_USER_KEY      = 'rz_current_user';   // { username, email, memberYear }
const RZ_LISTINGS_KEY  = 'rz_listings';        // [ ListingObject, … ]
const RZ_CART_KEY      = 'rz_cart';            // [ CartItem, … ]
const RZ_ORDERS_PREFIX = 'rz_orders_';         // + email → [ OrderObject, … ]

/* ─── AUTH HELPERS ───────────────────────────────────────── */
function rzGetCurrentUser() {
  try { return JSON.parse(localStorage.getItem(RZ_USER_KEY)) || null; }
  catch { return null; }
}

function rzSetCurrentUser(user) {
  localStorage.setItem(RZ_USER_KEY, JSON.stringify(user));
}

function rzLogout() {
  localStorage.removeItem(RZ_USER_KEY);
  window.location.href = 'login.html';
}

/* ─── LISTINGS HELPERS ───────────────────────────────────── */
function rzGetListings() {
  try { return JSON.parse(localStorage.getItem(RZ_LISTINGS_KEY)) || []; }
  catch { return []; }
}

function rzSaveListing(listing) {
  const listings = rzGetListings();
  listings.unshift(listing);                   // newest first
  localStorage.setItem(RZ_LISTINGS_KEY, JSON.stringify(listings));
}

/* ─── CART HELPERS ───────────────────────────────────────── */
function rzGetCart() {
  try { return JSON.parse(localStorage.getItem(RZ_CART_KEY)) || []; }
  catch { return []; }
}

function rzSaveCart(cart) {
  localStorage.setItem(RZ_CART_KEY, JSON.stringify(cart));
}

function rzAddToCart(item) {
  const cart = rzGetCart();
  const existing = cart.find(c => c.id === item.id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  rzSaveCart(cart);
  rzUpdateCartBadge();
}

function rzClearCart() {
  localStorage.removeItem(RZ_CART_KEY);
  rzUpdateCartBadge();
}

function rzUpdateCartBadge() {
  const badge = document.querySelector('.cart-badge, #cart-count, [data-cart-count]');
  if (!badge) return;
  const total = rzGetCart().reduce((s, i) => s + (i.qty || 1), 0);
  badge.textContent = total;
}

/* ─── ORDERS HELPERS ─────────────────────────────────────── */
function rzGetOrders(email) {
  try { return JSON.parse(localStorage.getItem(RZ_ORDERS_PREFIX + email)) || []; }
  catch { return []; }
}

function rzSaveOrder(email, order) {
  const orders = rzGetOrders(email);
  orders.unshift(order);
  localStorage.setItem(RZ_ORDERS_PREFIX + email, JSON.stringify(orders));
}

/* ═══════════════════════════════════════════════════════════
   PAGE: index.html — CATALOG
   ═══════════════════════════════════════════════════════════ */
function rzInitCatalog() {
  const grid = document.querySelector('.catalog-grid, #listings-grid, [data-catalog]');
  if (!grid) return;

  const userListings = rzGetListings();
  if (userListings.length === 0) return;

  userListings.forEach(listing => {
    const card = document.createElement('div');
    card.className = 'listing-card';          // reuse your existing card class
    card.innerHTML = `
      <div class="listing-card__img-wrap">
        ${listing.imageDataUrl
          ? `<img src="${listing.imageDataUrl}" alt="${listing.title}" loading="lazy">`
          : `<div class="listing-card__no-img">📷</div>`}
        <span class="listing-card__badge">${listing.category || 'Listing'}</span>
      </div>
      <div class="listing-card__body">
        <h3 class="listing-card__title">${listing.title}</h3>
        <p class="listing-card__desc">${listing.description || ''}</p>
        <div class="listing-card__footer">
          <span class="listing-card__price">$${Number(listing.price).toLocaleString()}</span>
          <button class="btn btn--gold btn--sm" onclick="rzAddToCart(${JSON.stringify(listing).replace(/"/g, '&quot;')})">
            Add to Cart
          </button>
        </div>
      </div>`;
    grid.prepend(card);                       // user listings appear first
  });

  rzUpdateCartBadge();
}

/* ═══════════════════════════════════════════════════════════
   PAGE: post.html — POST AN AD
   ═══════════════════════════════════════════════════════════ */
function rzInitPostForm() {
  const form = document.querySelector('#post-form, .post-form, [data-post-form]');
  if (!form) return;

  // Guard: redirect to login if not authenticated
  const user = rzGetCurrentUser();
  if (!user) {
    alert('Please log in to post a listing.');
    window.location.href = 'login.html';
    return;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const fd = new FormData(form);

    // Read image if provided
    const imageFile = form.querySelector('[name="image"], #listing-image')?.files?.[0];

    function finalize(imageDataUrl) {
      const listing = {
        id:           'rz_' + Date.now(),
        title:        fd.get('title')       || form.querySelector('[name="title"], #title')?.value || '',
        description:  fd.get('description') || form.querySelector('[name="description"], #description, textarea')?.value || '',
        price:        fd.get('price')       || form.querySelector('[name="price"], #price')?.value || 0,
        category:     fd.get('category')    || form.querySelector('[name="category"], #category, select')?.value || 'Other',
        condition:    fd.get('condition')   || form.querySelector('[name="condition"], #condition')?.value || '',
        sellerEmail:  user.email,
        sellerName:   user.username,
        postedAt:     new Date().toISOString(),
        imageDataUrl: imageDataUrl || null,
      };

      rzSaveListing(listing);

      // Update profile listing counter
      const storedUser = rzGetCurrentUser();
      if (storedUser) {
        storedUser.listingCount = (storedUser.listingCount || 0) + 1;
        rzSetCurrentUser(storedUser);
      }

      // Visual feedback then redirect
      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.textContent = '✓ Posted!'; btn.disabled = true; }
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    }

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = ev => finalize(ev.target.result);
      reader.readAsDataURL(imageFile);
    } else {
      finalize(null);
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   PAGE: cart.html — CART & CHECKOUT
   ═══════════════════════════════════════════════════════════ */
function rzInitCart() {
  const cartContainer = document.querySelector('#cart-items, .cart-items, [data-cart-items]');
  if (!cartContainer) return;

  function renderCart() {
    const cart = rzGetCart();
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
      cartContainer.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      return;
    }

    let subtotal = 0;
    cart.forEach((item, idx) => {
      const lineTotal = Number(item.price) * (item.qty || 1);
      subtotal += lineTotal;
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <div class="cart-row__info">
          <span class="cart-row__title">${item.title}</span>
          <span class="cart-row__meta">Qty: ${item.qty || 1} × $${Number(item.price).toLocaleString()}</span>
        </div>
        <div class="cart-row__actions">
          <span class="cart-row__total">$${lineTotal.toLocaleString()}</span>
          <button class="btn btn--ghost btn--sm" data-remove="${idx}">✕</button>
        </div>`;
      cartContainer.appendChild(row);
    });

    // Subtotal line
    const totalEl = document.querySelector('#cart-subtotal, .cart-subtotal, [data-cart-subtotal]');
    if (totalEl) totalEl.textContent = `$${subtotal.toLocaleString()}`;

    // Remove buttons
    cartContainer.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = rzGetCart();
        c.splice(Number(btn.dataset.remove), 1);
        rzSaveCart(c);
        rzUpdateCartBadge();
        renderCart();
      });
    });
  }

  renderCart();

  // ── CHECKOUT BUTTON ────────────────────────────────────
  const checkoutBtn = document.querySelector(
    '#checkout-btn, .checkout-btn, [data-checkout], button[type="submit"].checkout, .btn--checkout'
  );
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const user = rzGetCurrentUser();
      if (!user) {
        alert('Please log in to complete your purchase.');
        window.location.href = 'login.html';
        return;
      }

      const cart = rzGetCart();
      if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
      }

      const order = {
        orderId:   'ORD-' + Date.now(),
        items:     cart,
        total:     cart.reduce((s, i) => s + Number(i.price) * (i.qty || 1), 0),
        placedAt:  new Date().toISOString(),
        status:    'Pending',
      };

      rzSaveOrder(user.email, order);
      rzClearCart();
      renderCart();

      // Brief confirmation then redirect
      checkoutBtn.textContent = '✓ Order Placed!';
      checkoutBtn.disabled = true;
      setTimeout(() => { window.location.href = 'profile.html'; }, 1200);
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   PAGE: profile.html — PROFILE DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function rzInitProfile() {
  const user = rzGetCurrentUser();

  // ── Logout button ──────────────────────────────────────
  const logoutBtn = document.querySelector('#logout-btn, .logout-btn, [data-logout]');
  if (logoutBtn) logoutBtn.addEventListener('click', rzLogout);

  if (!user) return;

  // ── Stats counters ─────────────────────────────────────
  const allListings = rzGetListings().filter(l => l.sellerEmail === user.email);
  const allOrders   = rzGetOrders(user.email);

  const elListings    = document.querySelector('[data-stat="listings"], .stat-listings, #stat-listings');
  const elCartItems   = document.querySelector('[data-stat="cart-items"], .stat-cart, #stat-cart');
  const elMemberYear  = document.querySelector('[data-stat="member-year"], .stat-year, #stat-year');

  if (elListings)   elListings.textContent   = allListings.length;
  if (elCartItems)  elCartItems.textContent  = allOrders.reduce((s, o) => s + o.items.length, 0);
  if (elMemberYear) elMemberYear.textContent = user.memberYear || new Date().getFullYear();

  // ── My Listings section ────────────────────────────────
  const listingsSection = document.querySelector('#my-listings-grid, .my-listings-grid, [data-my-listings]');
  if (listingsSection) {
    if (allListings.length === 0) {
      listingsSection.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">📋</span>
          <p>You haven't posted any listings yet.</p>
          <a href="post.html" class="btn btn--gold">Post your first listing →</a>
        </div>`;
    } else {
      listingsSection.innerHTML = allListings.map(l => `
        <div class="listing-card listing-card--compact">
          ${l.imageDataUrl ? `<img src="${l.imageDataUrl}" alt="${l.title}" class="listing-card__thumb">` : ''}
          <div class="listing-card__body">
            <span class="listing-card__title">${l.title}</span>
            <span class="listing-card__price">$${Number(l.price).toLocaleString()}</span>
            <span class="listing-card__cat">${l.category}</span>
          </div>
        </div>`).join('');
    }
  }

  // ── My Orders section ──────────────────────────────────
  const ordersSection = document.querySelector('#my-orders, .my-orders, [data-my-orders]');
  if (!ordersSection) {
    // Auto-inject orders section below the listings block if none exists in HTML
    const anchor = document.querySelector('.profile-content, .dashboard, main') || document.body;
    const section = document.createElement('section');
    section.className = 'my-orders-section';
    section.innerHTML = `<h2 class="section-title">My Orders</h2><div id="my-orders-list"></div>`;
    anchor.appendChild(section);
  }

  const ordersList = document.querySelector('#my-orders-list, .my-orders-list, [data-orders-list]')
                  || document.querySelector('#my-orders, .my-orders, [data-my-orders]');

  if (ordersList) {
    if (allOrders.length === 0) {
      ordersList.innerHTML = '<p class="orders-empty">No orders yet. <a href="index.html" class="link--gold">Browse the catalog →</a></p>';
    } else {
      ordersList.innerHTML = allOrders.map(order => `
        <div class="order-card">
          <div class="order-card__header">
            <span class="order-card__id">${order.orderId}</span>
            <span class="order-card__status order-card__status--${order.status.toLowerCase()}">${order.status}</span>
            <span class="order-card__date">${new Date(order.placedAt).toLocaleDateString()}</span>
          </div>
          <ul class="order-card__items">
            ${order.items.map(i => `
              <li class="order-card__item">
                <span>${i.title}</span>
                <span>×${i.qty || 1}</span>
                <span>$${(Number(i.price) * (i.qty || 1)).toLocaleString()}</span>
              </li>`).join('')}
          </ul>
          <div class="order-card__total">Total: <strong>$${order.total.toLocaleString()}</strong></div>
        </div>`).join('');
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   ROUTER — auto-detect current page and initialise
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  rzUpdateCartBadge();

  const path = window.location.pathname.toLowerCase();
  const page = path.split('/').pop().replace('.html', '') || 'index';

  switch (page) {
    case 'index':
    case '':
      rzInitCatalog();
      break;
    case 'post':
      rzInitPostForm();
      break;
    case 'cart':
      rzInitCart();
      break;
    case 'profile':
      rzInitProfile();
      break;
  }
});
