// script.js - robust fetch + cache fallback + formatted output
const API_BASE = "https://api.coingecko.com/api/v3/simple/price?ids=celo&vs_currencies=";
const priceEl = document.getElementById("price");
const lastEl = document.getElementById("last-update");
const currencySel = document.getElementById("currency");
const intervalInput = document.getElementById("interval");
const refreshBtn = document.getElementById("refresh");
let timer = null;
let lastPrice = null; // ⭐ AJOUTÉ

function formatNumber(num, digits = 6){
  return Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: digits });
}

async function fetchCeloPrice(){
  const currency = currencySel.value;
  priceEl.textContent = "Loading price…";
  lastEl.textContent = "";
  try{
    const res = await fetch(API_BASE + encodeURIComponent(currency));
    if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    if(!data || !data.celo || data.celo[currency] == null) throw new Error("Unexpected API response");
    const raw = Number(data.celo[currency]);
    if (window.checkPriceAlert) window.checkPriceAlert(raw, currency);
    
    // ⭐ ANIMATION DE PRIX - DÉBUT ⭐
    priceEl.classList.remove('price-up', 'price-down');
    if (lastPrice !== null && lastPrice !== raw) {
      if (raw > lastPrice) {
        priceEl.classList.add('price-up');
      } else if (raw < lastPrice) {
        priceEl.classList.add('price-down');
      }
      setTimeout(() => {
        priceEl.classList.remove('price-up', 'price-down');
      }, 500);
    }
    lastPrice = raw;
    // ⭐ ANIMATION DE PRIX - FIN ⭐
    
    priceEl.textContent = `1 CELO = ${formatNumber(raw)} ${currency.toUpperCase()}`;
    lastEl.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
    // store for fallback
    try { localStorage.setItem("celo_last_price", JSON.stringify({ ts: Date.now(), price: raw, currency })); } catch(e){}
  }catch(err){
    console.error("Fetch error:", err);
    // try cache fallback
    try {
      const cached = JSON.parse(localStorage.getItem("celo_last_price"));
      if(cached && cached.price && cached.currency === currency){
        priceEl.textContent = `1 CELO ≈ ${formatNumber(cached.price)} ${currency.toUpperCase()} (cache)`;
        lastEl.textContent = `Cached: ${new Date(cached.ts).toLocaleTimeString()}`;
      } else {
        priceEl.textContent = "Error fetching price.";
        lastEl.textContent = `Error: ${err.message}`;
      }
    } catch(e){
      priceEl.textContent = "Error fetching price.";
      lastEl.textContent = `Error: ${err.message}`;
    }
  }
}

function startAutoRefresh(){
  if(timer) clearInterval(timer);
  const sec = Math.max(5, parseInt(intervalInput.value, 10) || 15);
  fetchCeloPrice(); // immediate
  timer = setInterval(fetchCeloPrice, sec * 1000);
}

/* events */
refreshBtn.addEventListener("click", fetchCeloPrice);
currencySel.addEventListener("change", fetchCeloPrice);
intervalInput.addEventListener("change", startAutoRefresh);

/* init */
fetchCeloPrice();
startAutoRefresh();
