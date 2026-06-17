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
