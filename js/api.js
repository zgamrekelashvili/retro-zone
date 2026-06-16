/* ============================================================
   api.js — Mock Data API Module
   Simulates async data fetching with Promise-based delays
   ============================================================ */

// ---------------------------------------------------------------
// MOCK DATA — Cars
// ---------------------------------------------------------------
const CARS = [
  {
    id: "car-101",
    type: "cars",
    title: "1970 Dodge Challenger R/T",
    year: 1970,
    era: "1970s",
    country: "USA",
    engine: "7.2L V8",
    engineType: "V8",
    displacement: "7.2L",
    trim: "Sport",
    price: 68500,
    condition: "Restored",
    color: "Plum Crazy Purple",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    specs: {
      "Year": "1970",
      "Country": "USA",
      "Engine": "7.2L 440 Six Pack V8",
      "Transmission": "4-Speed Manual",
      "Horsepower": "390 hp",
      "0–60 mph": "5.7 sec",
      "Top Speed": "140 mph",
      "Color": "Plum Crazy Purple",
      "VIN Verified": "Yes",
      "Trim": "R/T Sport"
    },
    history: "The 1970 Dodge Challenger R/T represents the apex of Detroit's muscle car era. This particular example was restored to factory spec using documented OEM components. Its 440 cubic inch Six Pack engine remains unmolested, matching the original build sheet. Featured in a 2019 collector's magazine."
  },
  {
    id: "car-102",
    type: "cars",
    title: "1985 Ferrari Testarossa",
    year: 1985,
    era: "1980s",
    country: "Italy",
    engine: "4.9L Flat-12",
    engineType: "Flat-6",
    displacement: "4.9L",
    trim: "Luxury",
    price: 210000,
    condition: "Original",
    color: "Rosso Corsa",
    image: "https://images.unsplash.com/photo-1621135802920-133df287f89c?w=600&q=80",
    specs: {
      "Year": "1985",
      "Country": "Italy",
      "Engine": "4.9L Flat-12",
      "Transmission": "5-Speed Manual",
      "Horsepower": "390 hp",
      "0–60 mph": "5.2 sec",
      "Top Speed": "180 mph",
      "Color": "Rosso Corsa",
      "VIN Verified": "Yes",
      "Trim": "Luxury"
    },
    history: "Arguably the most iconic Ferrari of the 1980s, the Testarossa debuted at the 1984 Paris Motor Show and became a symbol of the decade's excess. Its distinctive side strakes were designed by Pininfarina to channel air to the mid-mounted boxer twelve engine. This example carries matching numbers and documented service history from new."
  },
  {
    id: "car-103",
    type: "cars",
    title: "1993 Toyota Supra Turbo",
    year: 1993,
    era: "1990s",
    country: "Japan",
    engine: "3.0L Twin-Turbo Inline-6",
    engineType: "Twin-Turbo",
    displacement: "3.0L",
    trim: "Sport",
    price: 95000,
    condition: "Original",
    color: "Targa Silver",
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&q=80",
    specs: {
      "Year": "1993",
      "Country": "Japan",
      "Engine": "3.0L 2JZ-GTE Twin-Turbo I6",
      "Transmission": "6-Speed Manual (Getrag)",
      "Horsepower": "320 hp",
      "0–60 mph": "4.6 sec",
      "Top Speed": "155 mph (limited)",
      "Mileage": "41,000 km",
      "Trim": "Sport"
    },
    history: "The MKIV Supra's 2JZ-GTE engine became legendary for its ability to handle enormous power with minimal modification. This 1993 example retains its original drivetrain and was imported directly from Japan with full service records. Its six-speed Getrag transmission remains rare in the US market."
  },
  {
    id: "car-104",
    type: "cars",
    title: "1972 BMW 3.0 CSL",
    year: 1972,
    era: "1970s",
    country: "Germany",
    engine: "3.0L Inline-6",
    engineType: "Inline-4",
    displacement: "3.0L",
    trim: "Sport",
    price: 185000,
    condition: "Restored",
    color: "Chamonix White",
    image: "https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?w=600&q=80",
    specs: {
      "Year": "1972",
      "Country": "Germany",
      "Engine": "3.0L DOHC Inline-6",
      "Transmission": "4-Speed Manual",
      "Horsepower": "200 hp",
      "Weight": "1,270 kg",
      "Body": "Coupe (Lightweight)",
      "Trim": "Sport"
    },
    history: "BMW's Coupé Sport Leichtbau — the Batmobile — was built for homologation in European Touring Car racing. Thin steel panels, Plexiglas windows, and the deletion of sound insulation saved crucial kilograms. Only 1,039 were built with the full aerodynamic package. This example was restored by a BMW Classic–certified workshop."
  },
  {
    id: "car-105",
    type: "cars",
    title: "1969 Ford Mustang Boss 429",
    year: 1969,
    era: "1970s",
    country: "USA",
    engine: "7.0L V8",
    engineType: "V8",
    displacement: "7.0L",
    trim: "Sport",
    price: 145000,
    condition: "Restored",
    color: "Raven Black",
    image: "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&q=80",
    specs: {
      "Year": "1969",
      "Country": "USA",
      "Engine": "7.0L Boss 429 V8",
      "Transmission": "4-Speed Top Loader",
      "Horsepower": "375 hp",
      "0–60 mph": "5.3 sec",
      "Color": "Raven Black",
      "Trim": "Sport"
    },
    history: "Ford needed to homologate the 429ci engine for NASCAR, so they installed it in the Mustang at Kar Kraft's facility in Brighton, Michigan. The process required widening the front shock towers. Just 859 were built in 1969. Marti Report documented; numbers matching."
  },
  {
    id: "car-106",
    type: "cars",
    title: "1988 BMW M3 E30",
    year: 1988,
    era: "1980s",
    country: "Germany",
    engine: "2.3L Inline-4",
    engineType: "Inline-4",
    displacement: "2.3L",
    trim: "Sport",
    price: 78000,
    condition: "Original",
    color: "Jet Black",
    image: "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=600&q=80",
    specs: {
      "Year": "1988",
      "Country": "Germany",
      "Engine": "2.3L S14B23 Inline-4",
      "Transmission": "5-Speed Manual",
      "Horsepower": "200 hp",
      "0–60 mph": "6.5 sec",
      "Mileage": "87,000 km",
      "Trim": "Sport"
    },
    history: "Built to homologate the E30 for the DTM and World Touring Car Championship, the M3 was developed by BMW Motorsport GmbH with a bespoke high-revving four-cylinder engine. Its widened arches, boot spoiler, and revised nose remain design icons. A driver's car in the truest sense."
  },
  {
    id: "car-107",
    type: "cars",
    title: "1991 Lamborghini Diablo",
    year: 1991,
    era: "1990s",
    country: "Italy",
    engine: "5.7L V12",
    engineType: "V12",
    displacement: "5.7L",
    trim: "Luxury",
    price: 340000,
    condition: "Original",
    color: "Giallo Fly",
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80",
    specs: {
      "Year": "1991",
      "Country": "Italy",
      "Engine": "5.7L V12",
      "Transmission": "5-Speed Manual",
      "Horsepower": "485 hp",
      "0–60 mph": "4.0 sec",
      "Top Speed": "202 mph",
      "Trim": "Luxury"
    },
    history: "Designed by Marcello Gandini and launched in 1990, the Diablo succeeded the Countach as Lamborghini's range-topper. At its introduction it was the fastest production car in the world, capable of 202 mph. This early example retains its original Giallo Fly paint and factory specification engine."
  },
  {
    id: "car-108",
    type: "cars",
    title: "1979 Porsche 911 SC Targa",
    year: 1979,
    era: "1970s",
    country: "Germany",
    engine: "3.0L Flat-6",
    engineType: "Flat-6",
    displacement: "3.0L",
    trim: "Base",
    price: 62000,
    condition: "Restored",
    color: "Guards Red",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
    specs: {
      "Year": "1979",
      "Country": "Germany",
      "Engine": "3.0L Air-Cooled Flat-6",
      "Transmission": "4-Speed Manual",
      "Horsepower": "180 hp",
      "Body": "Targa",
      "Mileage": "112,000 km",
      "Trim": "Base"
    },
    history: "The 911 SC represented Porsche's engineering refinement after the controversial 912 years. With the Targa body style — Porsche's innovative safety roll bar — this example combines open-air motoring with the legendary 911 experience. Restored to Concours-adjacent quality with all rubber, gaskets, and bushings renewed."
  }
];

// ---------------------------------------------------------------
// MOCK DATA — Parts
// ---------------------------------------------------------------
const PARTS = [
  {
    id: "part-201",
    type: "parts",
    title: "Ford 302 V8 Short Block — Rebuilt",
    year: 1972,
    era: "1970s",
    country: "USA",
    engine: "5.0L V8",
    engineType: "V8",
    displacement: "5.0L",
    trim: "Sport",
    price: 3800,
    condition: "Rebuilt",
    color: "N/A",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80",
    specs: {
      "Type": "Short Block",
      "Displacement": "302 ci / 5.0L",
      "Configuration": "V8",
      "Condition": "Professionally Rebuilt",
      "Bore": "+0.030 over",
      "Crankshaft": "Balanced",
      "Compatibility": "1969–1995 Ford",
      "Warranty": "90 Days"
    },
    history: "This Ford 302 short block has been professionally rebuilt by an ASE-certified machine shop. The block has been magnafluxed, bored 0.030 over, and fitted with premium pistons. Crank and rods are balanced to within 1 gram. Ready for your street or mild performance application."
  },
  {
    id: "part-202",
    type: "parts",
    title: "BMW E30 LSD Differential — 3.73 Ratio",
    year: 1988,
    era: "1980s",
    country: "Germany",
    engine: "N/A",
    engineType: "Inline-4",
    displacement: "N/A",
    trim: "Sport",
    price: 1200,
    condition: "Used",
    color: "N/A",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    specs: {
      "Type": "Limited Slip Differential",
      "Ratio": "3.73:1",
      "Clutch Packs": "Refreshed",
      "Compatibility": "E30 M3 / E30 325i",
      "Condition": "Rebuilt",
      "Locking Rate": "25%"
    },
    history: "Sourced from a 1988 E30 M3 track car being parted out. The differential has been rebuilt with new clutch packs and fresh gear oil. Ideal for canyon carving or autox duty where the stock open diff leaves you spinning a single wheel."
  },
  {
    id: "part-203",
    type: "parts",
    title: "Toyota 2JZ-GTE Head Assembly — Complete",
    year: 1993,
    era: "1990s",
    country: "Japan",
    engine: "3.0L Twin-Turbo",
    engineType: "Twin-Turbo",
    displacement: "3.0L",
    trim: "Sport",
    price: 4500,
    condition: "Used",
    color: "N/A",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80",
    specs: {
      "Engine": "2JZ-GTE",
      "Type": "Cylinder Head (Complete)",
      "Camshafts": "Included",
      "Valves": "Inspected/Good",
      "Combustion Chambers": "Cleaned",
      "Compatibility": "1993–1998 Supra TT",
      "Condition": "Used — Excellent"
    },
    history: "Complete 2JZ-GTE head assembly removed from a low-mileage 1993 Supra during a built-motor project. All valves were measured and found within spec. Combustion chambers cleaned and inspected. Camshafts and cam covers included. Pressure-tested: no cracks."
  },
  {
    id: "part-204",
    type: "parts",
    title: "Ferrari Testarossa Door Mirror — Left",
    year: 1986,
    era: "1980s",
    country: "Italy",
    engine: "N/A",
    engineType: "Flat-6",
    displacement: "N/A",
    trim: "Luxury",
    price: 890,
    condition: "Used",
    color: "Nero",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c16f4d68?w=600&q=80",
    specs: {
      "Fitment": "1985–1991 Ferrari Testarossa",
      "Side": "Driver (Left)",
      "Color": "Nero (Black)",
      "Adjustment": "Manual",
      "Condition": "Good — Minor Scratch",
      "OEM Part": "Yes"
    },
    history: "Genuine OEM Ferrari door mirror sourced from a Testarossa undergoing full respray. The glass is intact and the adjusting mechanism works correctly. A minor scratch exists on the housing and is visible in photos. Rare to find in original black trim."
  },
  {
    id: "part-205",
    type: "parts",
    title: "Lamborghini Countach Carburettor Set — Weber 45 DCOE",
    year: 1978,
    era: "1970s",
    country: "Italy",
    engine: "3.9L V12",
    engineType: "V12",
    displacement: "3.9L",
    trim: "Base",
    price: 3200,
    condition: "Rebuilt",
    color: "N/A",
    image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=600&q=80",
    specs: {
      "Type": "Carburettor Set (6 units)",
      "Model": "Weber 45 DCOE",
      "Condition": "Professionally Rebuilt",
      "Compatibility": "Lamborghini Countach LP400/LP400S",
      "Jets": "Matched Set",
      "Floats": "Replaced"
    },
    history: "Six Weber 45 DCOE carburettors rebuilt by a specialist carburettor shop. All needles, jets, floats, and gaskets have been replaced. Bodies are in excellent condition with no cracks or stripped threads. Bench-tested and flow-matched as a set."
  },
  {
    id: "part-206",
    type: "parts",
    title: "Porsche 911 SC Targa Bar — Brushed Aluminum",
    year: 1979,
    era: "1970s",
    country: "Germany",
    engine: "N/A",
    engineType: "Flat-6",
    displacement: "N/A",
    trim: "Base",
    price: 680,
    condition: "Used",
    color: "Brushed Aluminum",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
    specs: {
      "Fitment": "1977–1989 Porsche 911 Targa",
      "Finish": "Brushed Aluminum",
      "Condition": "Good — Surface Oxidation",
      "Mounting": "Original hardware included",
      "Seals": "Not included"
    },
    history: "Genuine Porsche Targa bar removed from a 1979 911 SC during conversion to a full coupe configuration. The bar is structurally sound with normal surface oxidation consistent with age. Surface can be re-polished to original shine. Original mounting hardware and trim clips included."
  }
];

// ---------------------------------------------------------------
// INTERNAL STATE
// ---------------------------------------------------------------
export const state = {
  allItems: [],
  filteredItems: [],
  cart: [],
  filters: {
    catalog: "all",
    eras: [],
    countries: [],
    engines: [],
    trims: [],
    search: ""
  }
};

// ---------------------------------------------------------------
// HELPER — Simulate network delay
// ---------------------------------------------------------------
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------
// API: fetchAllItems — returns combined cars + parts
// ---------------------------------------------------------------
export async function fetchAllItems() {
  await delay(600); // Simulate network latency
  const combined = [...CARS, ...PARTS];
  state.allItems = combined;
  state.filteredItems = combined;
  return combined;
}

// ---------------------------------------------------------------
// API: fetchItemById — finds a single item by ID
// ---------------------------------------------------------------
export async function fetchItemById(id) {
  await delay(400);
  const item = [...CARS, ...PARTS].find(item => item.id === id);
  if (!item) throw new Error(`No listing found with ID "${id}".`);
  return item;
}

// ---------------------------------------------------------------
// API: applyFilters — filters state.allItems based on state.filters
// Returns filtered array after a brief simulated delay
// ---------------------------------------------------------------
export async function applyFilters() {
  await delay(200);
  const { catalog, eras, countries, engines, trims, search } = state.filters;

  let results = state.allItems.filter(item => {
    // Catalog type
    if (catalog === "cars" && item.type !== "cars") return false;
    if (catalog === "parts" && item.type !== "parts") return false;

    // Era
    if (eras.length > 0 && !eras.includes(item.era)) return false;

    // Country
    if (countries.length > 0 && !countries.includes(item.country)) return false;

    // Engine type
    if (engines.length > 0 && !engines.some(e => item.engineType === e || item.engine.includes(e))) return false;

    // Trim
    if (trims.length > 0 && !trims.includes(item.trim)) return false;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${item.title} ${item.country} ${item.engine} ${item.era} ${item.trim}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  state.filteredItems = results;
  return results;
}

// ---------------------------------------------------------------
// CART helpers — persist via localStorage
// ---------------------------------------------------------------
export function loadCart() {
  try {
    const raw = localStorage.getItem("rz_cart");
    state.cart = raw ? JSON.parse(raw) : [];
  } catch {
    state.cart = [];
  }
  return state.cart;
}

export function saveCart() {
  localStorage.setItem("rz_cart", JSON.stringify(state.cart));
}

export function addToCart(item) {
  const exists = state.cart.find(c => c.id === item.id);
  if (!exists) {
    state.cart.push({ id: item.id, title: item.title, price: item.price, image: item.image, type: item.type });
    saveCart();
    return true;  // added
  }
  return false; // already in cart
}

export function removeFromCart(id) {
  state.cart = state.cart.filter(c => c.id !== id);
  saveCart();
}

export function clearCart() {
  state.cart = [];
  saveCart();
}

export function getCart() {
  return state.cart;
}

// ---------------------------------------------------------------
// USER LISTINGS — localStorage
// ---------------------------------------------------------------
export function loadUserListings() {
  try {
    const raw = localStorage.getItem("rz_listings");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserListing(listing) {
  const listings = loadUserListings();
  listings.unshift(listing);
  localStorage.setItem("rz_listings", JSON.stringify(listings));
}

export function deleteUserListing(id) {
  const listings = loadUserListings().filter(l => l.id !== id);
  localStorage.setItem("rz_listings", JSON.stringify(listings));
}
