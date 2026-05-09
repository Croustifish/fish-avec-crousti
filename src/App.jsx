import { useEffect, useMemo, useState } from "react";

const EMPTY_PRICES = { t4: "", t5: "", t6: "", t7: "", choppedBuy: "", choppedSell: "", seaweed: "", sauceBasic: "", sauceFancy: "", sauceSpecial: "" };
const DEFAULT_SETTINGS = { sauceReturnRate: "", premium: true, sellOrder: true };
const BUY_ORDER_TAX = 2.5;
const SELL_ORDER_TAX = 2.5;
const API_BASE = "https://europe.albion-online-data.com/api/v2/stats/prices";
const CITIES = ["Bridgewatch", "Caerleon", "Fort Sterling", "Lymhurst", "Martlock", "Thetford"];
const CITIES_NO_CAERLEON = CITIES.filter((city) => city !== "Caerleon");

const FISH_OPTIONS = {
  t4: [
    { label: { en: "Freshwater — Bluescale Pike", fr: "Eau douce — Pique azur" }, itemId: "T4_FISH_FRESHWATER_ALL_COMMON", tier: "t4" },
    { label: { en: "Saltwater — Bluescale Cod", fr: "Eau salée — Cabillaud charbonnier" }, itemId: "T4_FISH_SALTWATER_ALL_COMMON", tier: "t4" },
  ],
  t5: [
    { label: { en: "Freshwater — Spotted Trout", fr: "Eau douce — Truite mouchetée" }, itemId: "T5_FISH_FRESHWATER_ALL_COMMON", tier: "t5" },
    { label: { en: "Saltwater — Spotted Wolffish", fr: "Eau salée — Poisson-loup tacheté" }, itemId: "T5_FISH_SALTWATER_ALL_COMMON", tier: "t5" },
  ],
  t6: [
    { label: { en: "Freshwater — Brightscale Zander", fr: "Eau douce — Sandre vif-éclat" }, itemId: "T6_FISH_FRESHWATER_ALL_COMMON", tier: "t6" },
    { label: { en: "Saltwater — Strongfin Salmon", fr: "Eau salée — Saumon chien" }, itemId: "T6_FISH_SALTWATER_ALL_COMMON", tier: "t6" },
  ],
  t7: [
    { label: { en: "Freshwater — Danglemouth Catfish", fr: "Eau douce — Poisson-chat margoulin" }, itemId: "T7_FISH_FRESHWATER_ALL_COMMON", tier: "t7" },
    { label: { en: "Saltwater — Bluefin Tuna", fr: "Eau salée — Thon rouge" }, itemId: "T7_FISH_SALTWATER_ALL_COMMON", tier: "t7" },
  ],
};

const ALL_FISH_OPTIONS = Object.values(FISH_OPTIONS).flat();
const ITEM_IDS = { chopped: "T1_FISHCHOPS", seaweed: "T1_SEAWEED", sauceBasic: "T1_FISHSAUCE_LEVEL1", sauceFancy: "T1_FISHSAUCE_LEVEL2", sauceSpecial: "T1_FISHSAUCE_LEVEL3" };
const SAUCE_RECIPES = { basic: { label: "Basic", sauceKey: "sauceBasic", chopped: 15, seaweed: 1 }, fancy: { label: "Fancy", sauceKey: "sauceFancy", chopped: 45, seaweed: 3 }, special: { label: "Special", sauceKey: "sauceSpecial", chopped: 135, seaweed: 9 } };
const YIELDS = { t4: 4, t5: 6, t6: 8, t7: 10 };

const COPY = {
  en: { subtitle: "EU market fetcher + fish profit dashboard.", help: "Manual input still works. Input BUY prices use either instant buy from sell orders, or buy-order prices when the buy-order toggle is on. Output SELL prices use listed sell orders when the sell-order toggle is on, or instant-sell buy orders when it is off. Scan age and reliability are estimates.", reset: "Reset", best: "Best Opportunity", netProfitAfterTax: "Net profit after sell tax", fill: "Fill prices or fetch market", buyCity: "Buy city", sellCity: "Sell city", fetchSelected: "Fetch selected cities", magicNoCaerleon: "Magic route no Caerleon", magicWithCaerleon: "Magic route with Caerleon", fish: "Fish input prices", materials: "Inputs & outputs", sauces: "Sauce sell prices", choppedBuy: "Chopped Fish BUY price", choppedSell: "Chopped Fish SELL price", seaweed: "Seaweed BUY price", quantity: "Quantity", returnRate: "Return Rate sauces only (%)", premium: "Premium", nonPremium: "Non-premium", buyTax: "Use buy orders for inputs (+2.5%)", sellMode: "List sell orders for outputs (+2.5%)", fishResults: "Fish → Chopped", fishNote: "Buy the selected fish in the buy city, chop it, then sell Chopped Fish in the sell city. T4=4, T5=6, T6=8, T7=10 chopped.", sauceNote: "Buy Chopped Fish + Seaweed in the buy city, craft sauce, then sell sauce in the sell city. Basic: 15/1, Fancy: 45/3, Special: 135/9.", rawProfit: "Raw profit", sellTaxIncluded: "Net profit after sell tax", reliability: "reliability", ranked: "Magic route ranks by net profit × reliability to reduce stale/spread traps.", fetchingSelected: "Fetching selected EU cities…", fetchFailed: "Fetch failed", updated: "Updated", magicFetching: "Magic route fetching", noData: "No usable EU market data found.", loaded: "Best route loaded", bestRoute: "Best route", buyIn: "buy in", sellIn: "sell in", buyThis: "Buy", sellThis: "Sell", profitPerFish: "profit per fish", profitPerSauce: "profit per sauce", fishProfit: "Fish Profit", sauceProfit: "Sauce Profit", buyOrderMode: "Buy-order mode: input prices use highest buy orders when fetched.", instantMode: "Instant-buy mode: input prices use lowest sell orders when fetched." },
  fr: { subtitle: "Marché EU + calculateur de profit poisson en temps réel.", help: "La saisie manuelle reste possible. Les prix d'entrée BUY utilisent soit l'achat instantané via les sell orders, soit les buy orders si l'option est activée. Les prix de sortie SELL utilisent les sell orders listés si l'option sell order est activée, ou les buy orders si elle est désactivée pour vendre instantanément. L'âge du scan et la fiabilité sont des estimations.", reset: "Réinitialiser", best: "Meilleure opportunité", netProfitAfterTax: "Profit net après taxe de vente", fill: "Renseigne les prix ou lance un fetch", buyCity: "Ville d'achat", sellCity: "Ville de vente", fetchSelected: "Charger les villes choisies", magicNoCaerleon: "Route magique sans Caerleon", magicWithCaerleon: "Route magique avec Caerleon", fish: "Prix d'achat des poissons", materials: "Entrées & sorties", sauces: "Prix de vente des sauces", choppedBuy: "Morceaux de poisson — prix BUY", choppedSell: "Morceaux de poisson — prix SELL", seaweed: "Algues — prix BUY", quantity: "Quantité", returnRate: "Return Rate sauces only (%)", premium: "Premium", nonPremium: "Non-premium", buyTax: "Utiliser les buy orders en entrée (+2,5%)", sellMode: "Lister les ventes en sell order (+2,5%)", fishResults: "Poisson → Morceaux", fishNote: "Achète le poisson choisi dans la ville d'achat, transforme-le en morceaux, puis vends les morceaux dans la ville de vente. T4=4, T5=6, T6=8, T7=10 morceaux.", sauceNote: "Achète Morceaux de poisson + Algues dans la ville d'achat, craft la sauce, puis vends la sauce dans la ville de vente. Basic : 15/1, Fancy : 45/3, Special : 135/9.", rawProfit: "Profit brut", sellTaxIncluded: "Profit net après taxe", reliability: "fiabilité", ranked: "La route magique classe par profit net × fiabilité pour limiter les pièges de prix vieux/spread.", fetchingSelected: "Chargement des villes EU choisies…", fetchFailed: "Chargement échoué", updated: "Mis à jour", magicFetching: "Recherche de route magique", noData: "Aucune donnée marché EU exploitable.", loaded: "Meilleure route chargée", bestRoute: "Meilleure route", buyIn: "acheter à", sellIn: "vendre à", buyThis: "Acheter", sellThis: "Vendre", profitPerFish: "profit par poisson", profitPerSauce: "profit par sauce", fishProfit: "Profit poissons", sauceProfit: "Profit sauces", buyOrderMode: "Mode buy order : les entrées fetchées utilisent les meilleurs buy orders.", instantMode: "Mode achat instant : les entrées fetchées utilisent les sell orders les moins chers." },
};

function safeLoad(key, fallback) { try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : fallback; } catch { return fallback; } }
function NumberInput({ value, onChange }) { return <input type="text" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="input" />; }
function Select({ value, onChange, children }) { return <select className="input select" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>; }
function Toggle({ enabled, onChange, label }) { return <button type="button" onClick={() => onChange(!enabled)} className={`toggle ${enabled ? "toggle-on" : ""}`}><span>{label}</span><span className="toggle-track"><span className="toggle-dot" /></span></button>; }
function Field({ label, value, onChange, children, meta }) { return <div className="field"><div className="field-top"><label>{label}</label>{meta && <span className={`scan-pill ${meta.className}`}>{meta.label}</span>}</div>{children}<NumberInput value={value} onChange={onChange} /></div>; }

function ResultLine({ label, revenue, cost, scaledLabel, quantity, sellTaxRate, profitClass, formatSilver, copy }) {
  if (revenue === null || cost === null) return <div className="result-line"><div className="result-row"><span className="main-label">{label}</span><span className="empty-result">—</span></div></div>;
  const raw = revenue - cost;
  const net = revenue * (1 - sellTaxRate / 100) - cost;
  const scaledRaw = raw * quantity;
  const scaledNet = net * quantity;
  const isProfit = net > 0;
  return <div className="result-line"><div className="result-header"><span className="main-label">{label}</span><span className={`badge ${isProfit ? "badge-profit" : "badge-loss"}`}>{isProfit ? "Profitable" : "Loss"}</span></div><div className="result-row"><span className="row-label">{copy.rawProfit}</span><span className={profitClass(raw)}>{formatSilver(raw)}</span></div><div className="result-row tiny-row"><span>{copy.sellTaxIncluded}</span><span className={profitClass(net)}>{formatSilver(net)}</span></div><div className="result-row scaled-row"><span>{scaledLabel}</span><span className={profitClass(scaledRaw)}>{formatSilver(scaledRaw)}</span></div><div className="result-row tiny-row"><span>{copy.sellTaxIncluded}</span><span className={profitClass(scaledNet)}>{formatSilver(scaledNet)}</span></div></div>;
}

export default function FishCalculator() {
  const [lang, setLang] = useState(() => localStorage.getItem("fishWithCroustiLang") || "fr");
  const t = COPY[lang];
  const [prices, setPrices] = useState(() => ({ ...EMPTY_PRICES, ...safeLoad("fishWithCroustiPrices", EMPTY_PRICES) }));
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...safeLoad("fishWithCroustiSettings", DEFAULT_SETTINGS) }));
  const [quantity, setQuantity] = useState(() => localStorage.getItem("fishWithCroustiQuantity") || "100");
  const [buyTaxEnabled, setBuyTaxEnabled] = useState(() => localStorage.getItem("fishWithCroustiBuyTax") === "true");
  const [buyCity, setBuyCity] = useState(() => localStorage.getItem("fishWithCroustiBuyCity") || "Caerleon");
  const [sellCity, setSellCity] = useState(() => localStorage.getItem("fishWithCroustiSellCity") || "Caerleon");
  const [fishItems, setFishItems] = useState(() => safeLoad("fishWithCroustiFishItems", { t4: FISH_OPTIONS.t4[0].itemId, t5: FISH_OPTIONS.t5[0].itemId, t6: FISH_OPTIONS.t6[0].itemId, t7: FISH_OPTIONS.t7[0].itemId }));
  const [marketMeta, setMarketMeta] = useState(() => safeLoad("fishWithCroustiMarketMeta", {}));
  const [route, setRoute] = useState(null);
  const [fetchStatus, setFetchStatus] = useState("");

  useEffect(() => localStorage.setItem("fishWithCroustiLang", lang), [lang]);
  useEffect(() => localStorage.setItem("fishWithCroustiPrices", JSON.stringify(prices)), [prices]);
  useEffect(() => localStorage.setItem("fishWithCroustiSettings", JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem("fishWithCroustiQuantity", quantity), [quantity]);
  useEffect(() => localStorage.setItem("fishWithCroustiBuyTax", String(buyTaxEnabled)), [buyTaxEnabled]);
  useEffect(() => localStorage.setItem("fishWithCroustiBuyCity", buyCity), [buyCity]);
  useEffect(() => localStorage.setItem("fishWithCroustiSellCity", sellCity), [sellCity]);
  useEffect(() => localStorage.setItem("fishWithCroustiFishItems", JSON.stringify(fishItems)), [fishItems]);
  useEffect(() => localStorage.setItem("fishWithCroustiMarketMeta", JSON.stringify(marketMeta)), [marketMeta]);

  const hasValue = (value) => String(value).trim() !== "";
  const num = (value) => parseFloat(String(value).replace(",", ".")) || 0;
  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  const salesTax = settings.premium ? 4 : 8;
  const totalSellTax = (settings.sellOrder ? SELL_ORDER_TAX : 0) + salesTax;
  const selectedFishIds = [fishItems.t4, fishItems.t5, fishItems.t6, fishItems.t7];
  const baseMarketIds = [ITEM_IDS.chopped, ITEM_IDS.seaweed, ITEM_IDS.sauceBasic, ITEM_IDS.sauceFancy, ITEM_IDS.sauceSpecial];

  const handlePrice = (key, value) => setPrices((current) => ({ ...current, [key]: value }));
  const handleSetting = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const applyBuyTax = (value) => buyTaxEnabled ? value * (1 + BUY_ORDER_TAX / 100) : value;
  const applySauceReturn = (cost) => cost * (1 - num(settings.sauceReturnRate) / 100);
  const profitClass = (value) => value > 0 ? "profit-positive" : value < 0 ? "profit-negative" : "profit-neutral";
  const formatSilver = (value) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const scanScore = (date) => {
    if (!date) return null;
    const ms = Date.now() - new Date(date).getTime();
    if (!Number.isFinite(ms) || ms < 0) return { age: "fresh", score: 100 };
    const min = Math.floor(ms / 60000);
    const hours = min / 60;
    const age = min < 60 ? `${min}m` : hours < 48 ? `${Math.floor(hours)}h` : `${Math.floor(hours / 24)}d`;
    let score = 100;
    if (min <= 15) score = 100; else if (min <= 60) score = 95; else if (hours <= 6) score = 80; else if (hours <= 24) score = 60; else if (hours <= 72) score = 35; else score = 15;
    return { age, score };
  };
  const spreadScore = (row) => { const sell = row?.sell_price_min || 0; const buy = row?.buy_price_max || 0; if (sell <= 0 || buy <= 0) return 50; const ratio = Math.min(1, buy / sell); if (ratio >= 0.95) return 100; if (ratio >= 0.85) return 85; if (ratio >= 0.7) return 65; if (ratio >= 0.5) return 40; return 20; };
  const metaInfo = (meta) => { if (!meta?.date) return null; const scan = scanScore(meta.date); const score = Math.round((scan.score * 0.7) + ((meta.spreadScore ?? 50) * 0.3)); const className = score >= 80 ? "scan-good" : score >= 50 ? "scan-mid" : "scan-bad"; return { label: `${scan.age} • ${score}%`, score, className }; };
  const reliabilityFromRows = (rows) => { const scores = rows.filter(Boolean).map((row) => { const scan = scanScore(row.sell_price_min_date); if (!scan) return null; return Math.round((scan.score * 0.7) + (spreadScore(row) * 0.3)); }).filter((v) => v !== null); return scores.length ? Math.min(...scores) : null; };

  const getPriceRow = (rows, itemId, city) => rows.find((r) => r.item_id === itemId && r.city === city && r.quality === 1);
  const sellMin = (row) => row?.sell_price_min > 0 ? row.sell_price_min : null;
  const buyMax = (row) => row?.buy_price_max > 0 ? row.buy_price_max : null;
  const getInputMarketPrice = (row) => buyTaxEnabled ? buyMax(row) : sellMin(row);
  const getOutputMarketPrice = (row) => settings.sellOrder ? sellMin(row) : buyMax(row);
  const setMetaFromRow = (nextMeta, key, city, itemId, row) => { nextMeta[key] = { city, itemId, date: row.sell_price_min_date, sellMin: row.sell_price_min, buyMax: row.buy_price_max, spreadScore: spreadScore(row) }; };

  const applyFetchedPrices = (rows, bCity, sCity, fishSelection = fishItems) => {
    const map = [["t4", fishSelection.t4, bCity, "input"], ["t5", fishSelection.t5, bCity, "input"], ["t6", fishSelection.t6, bCity, "input"], ["t7", fishSelection.t7, bCity, "input"], ["choppedBuy", ITEM_IDS.chopped, bCity, "input"], ["seaweed", ITEM_IDS.seaweed, bCity, "input"], ["choppedSell", ITEM_IDS.chopped, sCity, "output"], ["sauceBasic", ITEM_IDS.sauceBasic, sCity, "output"], ["sauceFancy", ITEM_IDS.sauceFancy, sCity, "output"], ["sauceSpecial", ITEM_IDS.sauceSpecial, sCity, "output"]];
    const nextPrices = { ...prices }, nextMeta = { ...marketMeta };
    for (const [key, itemId, city, role] of map) { const row = getPriceRow(rows, itemId, city); const value = role === "input" ? getInputMarketPrice(row) : getOutputMarketPrice(row); if (value !== null) { nextPrices[key] = String(value); setMetaFromRow(nextMeta, key, city, itemId, row); } }
    setPrices(nextPrices); setMarketMeta(nextMeta);
  };
  const fetchRows = async (locations, itemIds = [...selectedFishIds, ...baseMarketIds]) => { const ids = [...new Set(itemIds)].join(","); const url = `${API_BASE}/${ids}.json?locations=${locations.join(",")}&qualities=1`; const response = await fetch(url); if (!response.ok) throw new Error(`API error ${response.status}`); return response.json(); };
  const fetchSelectedCities = async () => { try { setFetchStatus(t.fetchingSelected); const rows = await fetchRows([...new Set([buyCity, sellCity])]); applyFetchedPrices(rows, buyCity, sellCity); setFetchStatus(`${t.updated}: ${buyCity} → ${sellCity}`); } catch (e) { setFetchStatus(`${t.fetchFailed}: ${e.message}`); } };

  const fishEconomics = (fishPrice, choppedSellPrice, tier) => ({ revenue: YIELDS[tier] * choppedSellPrice, cost: applyBuyTax(fishPrice) });
  const sauceEconomics = (saucePrice, choppedBuyPrice, seaweedPrice, type) => { const recipe = SAUCE_RECIPES[type]; const grossCost = recipe.chopped * applyBuyTax(choppedBuyPrice) + recipe.seaweed * applyBuyTax(seaweedPrice); return { revenue: saucePrice, cost: applySauceReturn(grossCost) }; };
  const netProfit = ({ revenue, cost }) => revenue * (1 - totalSellTax / 100) - cost;

  const findMagicRoute = async (includeCaerleon) => {
    try {
      const cities = includeCaerleon ? CITIES : CITIES_NO_CAERLEON;
      setFetchStatus(`${t.magicFetching}: ${includeCaerleon ? "with Caerleon" : "no Caerleon"}…`);
      const fishIds = ALL_FISH_OPTIONS.map((fish) => fish.itemId);
      const rows = await fetchRows(cities, [...fishIds, ...baseMarketIds]);
      let bestRoute = null;

      const pushBest = (candidate) => {
        if (!bestRoute || candidate.score > bestRoute.score) bestRoute = candidate;
      };

      for (const bCity of cities) for (const sCity of cities) {
        const getRow = (itemId, city) => getPriceRow(rows, itemId, city);
        const getInput = (itemId, city) => getInputMarketPrice(getRow(itemId, city));
        const getOutput = (itemId, city) => getOutputMarketPrice(getRow(itemId, city));

        const choppedDirectPrice = getInput(ITEM_IDS.chopped, bCity);
        const choppedSellPrice = getOutput(ITEM_IDS.chopped, sCity);
        const seaweedPrice = getInput(ITEM_IDS.seaweed, bCity);

        if (choppedSellPrice) {
          for (const fish of ALL_FISH_OPTIONS) {
            const fishPrice = getInput(fish.itemId, bCity);
            if (!fishPrice) continue;
            const econ = fishEconomics(fishPrice, choppedSellPrice, fish.tier);
            const net = netProfit(econ);
            const reliability = reliabilityFromRows([getRow(fish.itemId, bCity), getRow(ITEM_IDS.chopped, sCity)]);
            pushBest({ type: `${fish.label[lang]} → Chopped`, action: `${t.buyThis}: ${fish.label[lang]} (${fish.tier.toUpperCase()}) @ ${bCity} → ${t.sellThis}: Morceaux de poisson / Chopped Fish @ ${sCity}`, net, raw: econ.revenue - econ.cost, score: net * ((reliability ?? 50) / 100), reliability, buyCity: bCity, sellCity: sCity, fishTier: fish.tier, fishItemId: fish.itemId });
          }
        }

        const choppedSources = [];
        const choppedDirectRow = getRow(ITEM_IDS.chopped, bCity);
        if (choppedDirectPrice) choppedSources.push({ label: "Chopped Fish", actionLabel: "Morceaux de poisson / Chopped Fish", unitCostAfterInputTax: applyBuyTax(choppedDirectPrice), rows: [choppedDirectRow] });

        for (const fish of ALL_FISH_OPTIONS) {
          const fishRow = getRow(fish.itemId, bCity);
          const fishPrice = getInput(fish.itemId, bCity);
          if (!fishPrice) continue;
          choppedSources.push({ label: `${fish.label[lang]} → Chopped`, actionLabel: `${fish.label[lang]} (${fish.tier.toUpperCase()}) puis vider en morceaux`, unitCostAfterInputTax: applyBuyTax(fishPrice) / YIELDS[fish.tier], rows: [fishRow], fishTier: fish.tier, fishItemId: fish.itemId });
        }

        if (!seaweedPrice || !choppedSources.length) continue;

        for (const [type, recipe] of Object.entries(SAUCE_RECIPES)) {
          const sauceRow = getRow(ITEM_IDS[recipe.sauceKey], sCity);
          const saucePrice = getOutput(ITEM_IDS[recipe.sauceKey], sCity);
          if (!saucePrice) continue;
          for (const source of choppedSources) {
            const seaweedCost = recipe.seaweed * applyBuyTax(seaweedPrice);
            const choppedCost = recipe.chopped * source.unitCostAfterInputTax;
            const econ = { revenue: saucePrice, cost: applySauceReturn(choppedCost + seaweedCost) };
            const net = netProfit(econ);
            const reliability = reliabilityFromRows([sauceRow, getRow(ITEM_IDS.seaweed, bCity), ...source.rows]);
            pushBest({ type: `${recipe.label} Sauce`, action: `${t.buyThis}: ${source.actionLabel} + Algues / Seaweed @ ${bCity} → ${t.sellThis}: ${recipe.label} Fish Sauce @ ${sCity}`, net, raw: econ.revenue - econ.cost, score: net * ((reliability ?? 50) / 100), reliability, buyCity: bCity, sellCity: sCity, fishTier: source.fishTier, fishItemId: source.fishItemId, choppedSource: source.label });
          }
        }
      }

      setRoute(bestRoute);
      if (bestRoute) {
        const nextFishItems = bestRoute.fishTier ? { ...fishItems, [bestRoute.fishTier]: bestRoute.fishItemId } : fishItems;
        setFishItems(nextFishItems); setBuyCity(bestRoute.buyCity); setSellCity(bestRoute.sellCity);
        applyFetchedPrices(rows, bestRoute.buyCity, bestRoute.sellCity, nextFishItems);
        setFetchStatus(`${t.loaded}: ${bestRoute.buyCity} → ${bestRoute.sellCity}. ${t.ranked}`);
      } else setFetchStatus(t.noData);
    } catch (e) { setFetchStatus(`${t.fetchFailed}: ${e.message}`); }
  };

  const calcFishToChopped = (tier) => !hasValue(prices[tier]) || !hasValue(prices.choppedSell) ? { revenue: null, cost: null } : fishEconomics(num(prices[tier]), num(prices.choppedSell), tier);
  const calcSauce = (type) => { const key = SAUCE_RECIPES[type].sauceKey; return !hasValue(prices[key]) || !hasValue(prices.choppedBuy) || !hasValue(prices.seaweed) ? { revenue: null, cost: null } : sauceEconomics(num(prices[key]), num(prices.choppedBuy), num(prices.seaweed), type); };
  const opportunities = useMemo(() => [{ name: "T4 → Chopped", econ: calcFishToChopped("t4") }, { name: "T5 → Chopped", econ: calcFishToChopped("t5") }, { name: "T6 → Chopped", econ: calcFishToChopped("t6") }, { name: "T7 → Chopped", econ: calcFishToChopped("t7") }, { name: "Basic Sauce", econ: calcSauce("basic") }, { name: "Fancy Sauce", econ: calcSauce("fancy") }, { name: "Special Sauce", econ: calcSauce("special") }].filter((i) => i.econ.revenue !== null && i.econ.cost !== null).map((i) => ({ ...i, net: netProfit(i.econ) })).sort((a, b) => b.net - a.net), [prices, settings, buyTaxEnabled, totalSellTax]);
  const best = opportunities[0];
  const resetInputs = () => { setPrices(EMPTY_PRICES); setSettings(DEFAULT_SETTINGS); setQuantity("100"); setBuyTaxEnabled(false); setRoute(null); setMarketMeta({}); setFetchStatus(""); };
  const fishSelect = (tier) => <Select value={fishItems[tier]} onChange={(v) => setFishItems((c) => ({ ...c, [tier]: v }))}>{FISH_OPTIONS[tier].map((fish) => <option key={fish.itemId} value={fish.itemId}>{fish.label[lang]}</option>)}</Select>;
  const citySelect = (value, setter) => <Select value={value} onChange={setter}>{CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</Select>;
  const result = (label, econ, scaledLabel) => <ResultLine label={label} revenue={econ.revenue} cost={econ.cost} scaledLabel={scaledLabel} quantity={qty} sellTaxRate={totalSellTax} profitClass={profitClass} formatSilver={formatSilver} copy={t} />;

  return <main className="app dark"><style>{styles}</style><div className="container">
    <header className="hero"><div><h1>Fish with Crousti</h1><p className="subtitle">{t.subtitle}</p><p className="help-text">{t.help}</p></div><div className="hero-actions"><button className="secondary-button" onClick={() => setLang(lang === "fr" ? "en" : "fr")}>{lang === "fr" ? "EN" : "FR"}</button><button className="secondary-button" onClick={resetInputs}>{t.reset}</button></div></header>
    <section className="best-card"><div><p>{t.best}</p><h2>{best ? best.name : t.fill}</h2></div><div className="best-value"><span>{t.netProfitAfterTax}</span><strong>{best ? formatSilver(best.net) : "—"}</strong></div></section>
    <section className="card fetch-panel"><div className="fetch-grid"><div className="setting-field"><label>{t.buyCity}</label>{citySelect(buyCity, setBuyCity)}</div><div className="setting-field"><label>{t.sellCity}</label>{citySelect(sellCity, setSellCity)}</div><button className="primary-button" onClick={fetchSelectedCities}>{t.fetchSelected}</button></div><div className="magic-row"><button className="primary-button magic-main" onClick={() => findMagicRoute(false)}>{t.magicNoCaerleon}</button><button className="primary-button magic-alt" onClick={() => findMagicRoute(true)}>{t.magicWithCaerleon}</button></div>{fetchStatus && <p className="fetch-status">{fetchStatus}</p>}{route && <div className="route-card"><p className="route-title">{t.bestRoute}</p><p>{route.action || `${t.buyIn} ${route.buyCity}, ${t.sellIn} ${route.sellCity}`}</p><p className="route-meta">{route.type} · net {formatSilver(route.net)}{route.reliability !== null && route.reliability !== undefined ? ` · ${t.reliability} ${route.reliability}%` : ""}</p></div>}</section>
    <section className="card input-grid"><div className="group fish-group"><h2>{t.fish}</h2><div className="fish-card-grid"><Field label="T4 BUY price" value={prices.t4} onChange={(v) => handlePrice("t4", v)} meta={metaInfo(marketMeta.t4)}>{fishSelect("t4")}</Field><Field label="T5 BUY price" value={prices.t5} onChange={(v) => handlePrice("t5", v)} meta={metaInfo(marketMeta.t5)}>{fishSelect("t5")}</Field><Field label="T6 BUY price" value={prices.t6} onChange={(v) => handlePrice("t6", v)} meta={metaInfo(marketMeta.t6)}>{fishSelect("t6")}</Field><Field label="T7 BUY price" value={prices.t7} onChange={(v) => handlePrice("t7", v)} meta={metaInfo(marketMeta.t7)}>{fishSelect("t7")}</Field></div></div><div className="group content-start"><h2>{t.materials}</h2><Field label={t.choppedBuy} value={prices.choppedBuy} onChange={(v) => handlePrice("choppedBuy", v)} meta={metaInfo(marketMeta.choppedBuy)} /><Field label={t.choppedSell} value={prices.choppedSell} onChange={(v) => handlePrice("choppedSell", v)} meta={metaInfo(marketMeta.choppedSell)} /><Field label={t.seaweed} value={prices.seaweed} onChange={(v) => handlePrice("seaweed", v)} meta={metaInfo(marketMeta.seaweed)} /></div><div className="group"><h2>{t.sauces}</h2><Field label="Basic Fish Sauce SELL price" value={prices.sauceBasic} onChange={(v) => handlePrice("sauceBasic", v)} meta={metaInfo(marketMeta.sauceBasic)} /><Field label="Fancy Fish Sauce SELL price" value={prices.sauceFancy} onChange={(v) => handlePrice("sauceFancy", v)} meta={metaInfo(marketMeta.sauceFancy)} /><Field label="Special Fish Sauce SELL price" value={prices.sauceSpecial} onChange={(v) => handlePrice("sauceSpecial", v)} meta={metaInfo(marketMeta.sauceSpecial)} /></div></section>
    <section className="card settings-grid"><div className="setting-field"><label>{t.quantity}</label><NumberInput value={quantity} onChange={setQuantity} /></div><div className="setting-field"><label>{t.returnRate}</label><NumberInput value={settings.sauceReturnRate} onChange={(v) => handleSetting("sauceReturnRate", v)} /></div><div className="toggle-area"><Toggle enabled={settings.premium} onChange={(v) => handleSetting("premium", v)} label={settings.premium ? t.premium : t.nonPremium} /><Toggle enabled={buyTaxEnabled} onChange={setBuyTaxEnabled} label={t.buyTax} /><Toggle enabled={settings.sellOrder} onChange={(v) => handleSetting("sellOrder", v)} label={t.sellMode} /></div></section>
    <section className="card results-grid"><div className="group"><div><h2>{t.fishResults}</h2><p className="note">{t.fishNote}</p></div><div className="result-card-grid">{result(`T4 ${t.profitPerFish}`, calcFishToChopped("t4"), `${qty} ${t.fishProfit}`)}{result(`T5 ${t.profitPerFish}`, calcFishToChopped("t5"), `${qty} ${t.fishProfit}`)}{result(`T6 ${t.profitPerFish}`, calcFishToChopped("t6"), `${qty} ${t.fishProfit}`)}{result(`T7 ${t.profitPerFish}`, calcFishToChopped("t7"), `${qty} ${t.fishProfit}`)}</div></div><div className="group"><div><h2>{t.sauces}</h2><p className="note">{t.sauceNote}</p></div><div className="result-card-grid">{result(`Basic ${t.profitPerSauce}`, calcSauce("basic"), `${qty} ${t.sauceProfit}`)}{result(`Fancy ${t.profitPerSauce}`, calcSauce("fancy"), `${qty} ${t.sauceProfit}`)}{result(`Special ${t.profitPerSauce}`, calcSauce("special"), `${qty} ${t.sauceProfit}`)}</div></div></section>
  </div></main>;
}

const styles = `*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input,select{font:inherit}.app{min-height:100vh;padding:16px}.container{width:min(1200px,100%);margin:0 auto;display:grid;gap:14px}.dark{color:#e2e8f0;background:linear-gradient(135deg,#020617 0%,#0f172a 55%,#052e2b 100%)}.hero,.card,.field,.result-line,.input,.toggle,.secondary-button{background:rgba(15,23,42,.82);border:1px solid #334155;color:#e2e8f0}.hero{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px;border-radius:24px;box-shadow:0 10px 30px rgba(0,0,0,.2);backdrop-filter:blur(12px)}.hero h1{margin:0;font-size:30px;line-height:1.1;letter-spacing:-.04em;font-weight:900}.subtitle{margin:6px 0 0;color:#cbd5e1;font-size:14px}.help-text,.note,.tiny-row,.age,.fetch-status{color:#94a3b8}.help-text{margin:3px 0 0;font-size:12px}.hero-actions{display:flex;gap:8px}.secondary-button,.primary-button{cursor:pointer;border-radius:999px;padding:8px 13px;font-size:13px;font-weight:800;transition:150ms ease;white-space:nowrap}.secondary-button:hover,.primary-button:hover{border-color:#34d399;color:#86efac}.primary-button{border:0;background:#10b981;color:white}.primary-button.magic-main{background:linear-gradient(135deg,#22c55e,#0d9488);box-shadow:0 0 0 2px rgba(34,197,94,.15)}.primary-button.magic-alt{background:#334155}.card{border-radius:18px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:14px;backdrop-filter:blur(10px)}.best-card{display:flex;align-items:center;justify-content:space-between;gap:16px;border-radius:18px;padding:14px;color:#fff;background:linear-gradient(135deg,#10b981,#0d9488);box-shadow:0 12px 30px rgba(16,185,129,.25)}.best-card p{margin:0;color:#d1fae5;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.best-card h2{margin:4px 0 0;font-size:24px;letter-spacing:-.03em}.best-value{text-align:right}.best-value span{display:block;color:#d1fae5;font-size:11px}.best-value strong{display:block;margin-top:3px;font-size:28px;line-height:1}.input-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px}.settings-grid{display:grid;grid-template-columns:1fr 1fr 2fr;gap:14px;align-items:end}.results-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.fetch-panel{display:grid;gap:10px}.fetch-grid{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end}.magic-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fetch-status{margin:0;font-size:11px}.fetch-status.strong{color:#86efac;font-weight:800}.route-card{border:1px solid #166534;background:rgba(5,46,22,.45);border-radius:14px;padding:10px;display:grid;gap:3px}.route-card p{margin:0}.route-title{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#86efac;font-weight:900}.route-meta{font-size:12px;color:#cbd5e1;font-weight:800}.group{display:grid;gap:8px;align-content:start}.group h2{margin:0;font-size:16px;line-height:1.1}.fish-card-grid,.result-card-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.field{display:grid;gap:6px;padding:10px;border-radius:14px}.field-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.field label,.setting-field label{font-size:12px;font-weight:800;color:#e2e8f0}.input{width:100%;height:34px;border-radius:10px;padding:6px 9px;outline:none}.select{appearance:auto;font-size:12px}.input:focus{border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.16)}.setting-field{display:grid;gap:5px}.toggle-area{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.toggle{cursor:pointer;min-height:36px;border-radius:13px;padding:7px 10px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;font-weight:800;transition:150ms ease}.toggle-on{border-color:#34d399;background:#052e16;color:#86efac}.toggle-track{width:36px;height:20px;border-radius:999px;background:#475569;padding:2px;flex:0 0 auto;transition:150ms ease}.toggle-on .toggle-track{background:#10b981}.toggle-dot{display:block;width:16px;height:16px;border-radius:999px;background:white;transition:150ms ease}.toggle-on .toggle-dot{transform:translateX(16px)}.note{margin:3px 0 0;font-size:10px}.result-line{display:grid;gap:5px;padding:10px;border-radius:14px;box-shadow:0 3px 10px rgba(0,0,0,.1)}.result-header,.result-row{display:flex;align-items:center;justify-content:space-between;gap:8px}.main-label{font-size:13px;font-weight:900;color:#e2e8f0}.row-label{font-size:13px;font-weight:600}.badge{border-radius:999px;padding:2px 7px;font-size:10px;font-weight:900}.badge-profit{background:#052e16;color:#86efac}.badge-loss{background:#450a0a;color:#fca5a5}.tiny-row{font-size:10px}.scaled-row{margin-top:3px;font-size:13px;font-weight:900;color:#e2e8f0}.empty-result{color:#94a3b8;font-weight:900}.profit-positive{color:#4ade80;font-weight:900}.profit-negative{color:#f87171;font-weight:900}.profit-neutral{color:#e2e8f0;font-weight:900}.scan-pill{font-size:10px;font-weight:900;border-radius:999px;padding:2px 6px;white-space:nowrap}.scan-good{color:#86efac;background:#052e16}.scan-mid{color:#fde68a;background:#422006}.scan-bad{color:#fca5a5;background:#450a0a}@media(max-width:1050px){.input-grid,.settings-grid,.results-grid,.fetch-grid,.magic-row{grid-template-columns:1fr}.toggle-area{grid-template-columns:1fr}.fish-card-grid,.result-card-grid{grid-template-columns:1fr 1fr}}@media(max-width:650px){.hero,.best-card{align-items:flex-start;flex-direction:column}.best-value{text-align:left}.fish-card-grid,.result-card-grid{grid-template-columns:1fr}}`;
