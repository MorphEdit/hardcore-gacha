(function () {
    const reelEl = document.getElementById("reel");
    const coinsEl = document.getElementById("coins");
    const pullStatusEl = document.getElementById("pullStatus");
    const resultsListEl = document.getElementById("resultsList");

    const pull1Btn = document.getElementById("pull1");
    const pull3Btn = document.getElementById("pull3");
    const FILLER_LIBRARY = [
        { displayName: "Swordsman", tier: "COMMON", level: 1, class: "SWORDSMAN" },
        { displayName: "Archer", tier: "COMMON", level: 1, class: "ARCHER" },
        { displayName: "Healer", tier: "UNCOMMON", level: 1, class: "HEALER" },
        { displayName: "Mage", tier: "RARE", level: 1, class: "MAGE" },
        { displayName: "Paladin", tier: "UNCOMMON", level: 1, class: "PALADIN" },
        { displayName: "Rogue", tier: "RARE", level: 1, class: "ROGUE" },
        { displayName: "Monk", tier: "UNCOMMON", level: 1, class: "MONK" },
        { displayName: "Warlock", tier: "SUPERRARE", level: 1, class: "WARLOCK" },
        { displayName: "Berserker", tier: "RARE", level: 1, class: "BERSERKER" },
        { displayName: "Guardian", tier: "COMMON", level: 1, class: "GUARDIAN" },
    ];

    function makeFiller() {
        const base = FILLER_LIBRARY[Math.floor(Math.random() * FILLER_LIBRARY.length)];
        return {
            displayName: base.displayName,
            tier: base.tier,
            level: base.level,
            class: base.class,
            id: "FAKE_" + Math.random().toString(16).slice(2, 8),
        };
    }

    function estimateStats(oc) {
        const baseMap = {
            SWORDSMAN: { hp: 120, atk: 16, spd: 10 },
            ARCHER: { hp: 90, atk: 16, spd: 14 },
            HEALER: { hp: 80, atk: 8, spd: 12 },
            MAGE: { hp: 100, atk: 20, spd: 10 },
            PALADIN: { hp: 160, atk: 19, spd: 9 },
            ROGUE: { hp: 85, atk: 18, spd: 16 },
            MONK: { hp: 110, atk: 17, spd: 13 },
            WARLOCK: { hp: 95, atk: 24, spd: 11 },
            BERSERKER: { hp: 140, atk: 22, spd: 9 },
            GUARDIAN: { hp: 170, atk: 15, spd: 8 },
        };

        const base = baseMap[oc.class] || { hp: 100, atk: 15, spd: 10 };
        const tierMulMap = {
            COMMON: 1,
            UNCOMMON: 1.08,
            RARE: 1.16,
            SUPERRARE: 1.28,
            SUPERSUPERRARE: 1.38,
            ULTRARARE: 1.46,
            LEGENDARY: 1.52,
            SUPREME: 1.58,
            UNIQUE: 1.65,
        };

        const tierMul = tierMulMap[oc.tier] || 1;
        const L = Math.max(1, oc.level | 0);
        const mul = 1 + 0.04 * (L - 1);

        return {
            hp: Math.round(base.hp * tierMul * mul),
            atk: Math.round(base.atk * tierMul * mul),
            spd: base.spd + Math.floor((L - 1) / 5),
        };
    }

    function isLegendTier(tier) {
        const rareTiers = [
            "SUPERRARE",
            "SUPERSUPERRARE",
            "ULTRARARE",
            "LEGENDARY",
            "SUPREME",
            "UNIQUE",
        ];
        return rareTiers.includes(tier);
    }

    function pushResultCard(citizen) {
        const stats = estimateStats(citizen);

        const wrap = document.createElement("div");
        wrap.className =
            "result-card" + (isLegendTier(citizen.tier) ? " legendary" : "");

        wrap.innerHTML = `
      <div class="topline">
        <div class="char">${citizen.displayName}</div>
        <div class="meta">${citizen.tier} • Lv.${citizen.level}</div>
      </div>
      <div class="stats">
        <div>HP ${stats.hp}</div>
        <div>ATK ${stats.atk}</div>
        <div>SPD ${stats.spd}</div>
        <div>ID ${citizen.id}</div>
      </div>
    `;

        resultsListEl.prepend(wrap);
    }

    function buildReelItem(citizen) {
        const div = document.createElement("div");
        div.className = "reel-item tier-" + citizen.tier;
        div.innerHTML = `
      <div class="tier-label">${citizen.tier}</div>
      <div class="char-name">${citizen.displayName}</div>
      <div class="char-lv">Lv.${citizen.level}</div>
    `;
        return div;
    }

    function buildSpinItems(winCitizen) {
        const TOTAL = 14;
        const WIN_POS = 10;
        const arr = [];

        for (let i = 0; i < TOTAL; i++) {
            if (i === WIN_POS) {
                arr.push(winCitizen);
            } else {
                arr.push(makeFiller());
            }
        }
        return { items: arr, WIN_POS };
    }

    function animateTranslateX(el, targetX, durationMs) {
        return new Promise((resolve) => {
            const start = performance.now();
            const startX = 0;

            function frame(now) {
                const t = Math.min(1, (now - start) / durationMs);
                const eased = 1 - Math.pow(1 - t, 3);

                const curX = startX + (targetX - startX) * eased;
                el.style.transform = `translateX(${curX}px)`;

                if (t >= 1) {
                    resolve();
                } else {
                    requestAnimationFrame(frame);
                }
            }

            requestAnimationFrame(frame);
        });
    }

    async function spinOnceAndShow(winCitizen, indexInBatch = null, batchSize = null) {
        if (indexInBatch != null && batchSize != null) {
            pullStatusEl.textContent = `Spinning... (${indexInBatch + 1}/${batchSize})`;
        } else {
            pullStatusEl.textContent = "Spinning...";
        }

        reelEl.style.transform = "translateX(0px)";
        Array.from(reelEl.children).forEach(child => {
            child.style.boxShadow = "";
            child.style.filter = "";
        });

        reelEl.innerHTML = "";
        const { items, WIN_POS } = buildSpinItems(winCitizen);

        items.forEach((c, idx) => {
            const node = buildReelItem(c);
            if (idx === WIN_POS) {
                node.dataset.win = "true";
            }
            reelEl.appendChild(node);
        });

        await new Promise(r => requestAnimationFrame(r));

        const winChild = reelEl.children[WIN_POS];
        const viewport = reelEl.parentElement;

        const viewportRect = viewport.getBoundingClientRect();
        const winRect = winChild.getBoundingClientRect();

        const viewportCenterPx = viewportRect.left + viewportRect.width / 2;
        const winCenterPx = winRect.left + winRect.width / 2;

        const neededShift = viewportCenterPx - winCenterPx;

        await animateTranslateX(reelEl, neededShift, 900);

        winChild.style.boxShadow = `
      0 0 12px rgba(255,255,255,0.8),
      0 0 24px rgba(175,120,255,0.8),
      0 0 60px rgba(175,120,255,0.4)
    `;
        winChild.style.filter = "brightness(1.2)";

        pullStatusEl.textContent = `YOU GOT ${winCitizen.displayName}! (${winCitizen.tier})`;

        pushResultCard(winCitizen);
    }

    async function doPull(count) {
        pull1Btn.disabled = true;
        pull3Btn.disabled = true;

        pullStatusEl.textContent = "Contacting server...";

        try {
            const res = await api.pull(count);
            if (res.coinsLeft !== undefined && coinsEl) {
                coinsEl.textContent = res.coinsLeft;
            }

            const pulled = res.newCitizens || [];
            if (!pulled.length) {
                pullStatusEl.textContent = "No result?";
            } else {
                if (count === 1 || pulled.length === 1) {
                    await spinOnceAndShow(pulled[0], 0, 1);
                } else {
                    for (let i = 0; i < pulled.length; i++) {
                        const c = pulled[i];
                        await spinOnceAndShow(c, i, pulled.length);
                    }
                    pullStatusEl.textContent = `Finished ${pulled.length} pulls.`;
                }
            }
        } catch (err) {
            pullStatusEl.textContent = "Error: " + err.message;
        }

        pull1Btn.disabled = false;
        pull3Btn.disabled = false;
    }

    pull1Btn.addEventListener("click", () => {
        doPull(1);
    });

    pull3Btn.addEventListener("click", () => {
        doPull(3);
    });

    (async () => {
        const tok = localStorage.getItem("token");
        if (!tok) {
            pullStatusEl.textContent = "Please login first.";
            return;
        }
        try {
            const p = await api.player();
            if (p.coins !== undefined && coinsEl) {
                coinsEl.textContent = p.coins;
            }
            pullStatusEl.textContent = "Ready.";
        } catch (e) {
            pullStatusEl.textContent = "Server unreachable.";
        }
    })();
})();
