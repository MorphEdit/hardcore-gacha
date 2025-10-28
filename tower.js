(function () {
    let currentFloor = 1;
    let roster = [];
    let party = [null, null, null];
    let pickingSlot = null;

    const floorNumEl = document.getElementById("floorNum");
    const floorNoteEl = document.getElementById("floorNote");
    const enemyNameEl = document.getElementById("enemyName");
    const enemyPowerEl = document.getElementById("enemyPower");
    const fightResultEl = document.getElementById("fightResult");

    const logListEl = document.getElementById("logList");

    const playerNameEl = document.getElementById("playerName");
    const playerCoinsEl = document.getElementById("playerCoins");

    const slotName0 = document.getElementById("slotName0");
    const slotName1 = document.getElementById("slotName1");
    const slotName2 = document.getElementById("slotName2");
    const slotMeta0 = document.getElementById("slotMeta0");
    const slotMeta1 = document.getElementById("slotMeta1");
    const slotMeta2 = document.getElementById("slotMeta2");

    const btnFight = document.getElementById("btnFight");
    const btnRestart = document.getElementById("btnRestart");

    const rosterModal = document.getElementById("rosterModal");
    const rosterListEl = document.getElementById("rosterList");
    const closeRosterBtn = document.getElementById("closeRoster");

    const chooseBtns = [
        document.querySelector('[data-slotpick="0"]'),
        document.querySelector('[data-slotpick="1"]'),
        document.querySelector('[data-slotpick="2"]'),
    ];

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

    function renderPartyUI() {
        const slots = [
            { n: slotName0, m: slotMeta0, c: party[0], btn: chooseBtns[0] },
            { n: slotName1, m: slotMeta1, c: party[1], btn: chooseBtns[1] },
            { n: slotName2, m: slotMeta2, c: party[2], btn: chooseBtns[2] },
        ];

        slots.forEach((s) => {
            if (!s.c) {
                s.n.textContent = "EMPTY";
                s.m.textContent = "—";
            } else {
                s.n.textContent = s.c.displayName;
                s.m.textContent = s.c.tier + " • Lv." + s.c.level;
            }

            s.btn.style.display = "block";
        });
    }

    function appendLog(lines) {
        if (!lines) return;
        const box = document.createElement("div");
        box.className = "log-item";
        if (Array.isArray(lines)) {
            box.innerHTML = lines.map(l => `<div>${l}</div>`).join("");
        } else {
            box.innerHTML = `<div>${lines}</div>`;
        }
        logListEl.prepend(box);
    }

    function openRosterPicker(slotIndex) {
        pickingSlot = slotIndex;
        renderRosterList();
        rosterModal.classList.remove("hidden");
    }

    function closeRosterPicker() {
        pickingSlot = null;
        rosterModal.classList.add("hidden");
    }

    function renderRosterList() {
        rosterListEl.innerHTML = "";

        const usedInOtherSlots = new Set();
        party.forEach((unit, idx) => {
            if (!unit) return;
            if (idx === pickingSlot) return;
            usedInOtherSlots.add(unit.id);
        });

        const availableRoster = roster.filter(c => !usedInOtherSlots.has(c.id));

        availableRoster.forEach((c) => {
            const stats = estimateStats(c);

            const div = document.createElement("div");
            div.className = "roster-card";
            div.innerHTML = `
                <div class="roster-line1">
                  <div class="roster-name">${c.displayName}</div>
                  <div class="roster-meta">${c.tier} • Lv.${c.level}</div>
                </div>
                <div class="roster-stats">
                  <div>HP ${stats.hp}</div>
                  <div>ATK ${stats.atk}</div>
                  <div>SPD ${stats.spd}</div>
                  <div>ID ${c.id}</div>
                </div>
            `;

            div.addEventListener("click", () => {
                party[pickingSlot] = c;
                renderPartyUI();
                closeRosterPicker();
            });

            rosterListEl.appendChild(div);
        });

        if (availableRoster.length === 0) {
            const emptyMsg = document.createElement("div");
            emptyMsg.className = "roster-card";
            emptyMsg.textContent = "No available unit.";
            rosterListEl.appendChild(emptyMsg);
        }
    }

    async function doFight() {
        btnFight.disabled = true;
        fightResultEl.textContent = "Resolving battle...";
        floorNoteEl.textContent = "Fighting...";

        const used = party.filter((p) => p).map((p) => p.id);
        if (!used.length) {
            fightResultEl.textContent = "Pick at least 1 unit first.";
            btnFight.disabled = false;
            floorNoteEl.textContent = "Need party";
            return;
        }

        try {
            const result = await api.resolve("f" + currentFloor, used);

            const battleLines = [];
            if (result.win === true) {
                battleLines.push("WIN on Floor " + currentFloor + "!");
            } else {
                battleLines.push("DEFEAT on Floor " + currentFloor + "...");
            }

            if (result.reward) {
                battleLines.push("Reward: " + JSON.stringify(result.reward));
            }

            fightResultEl.textContent = battleLines.join(" | ");

            appendLog([
                "Floor " + currentFloor,
                ...battleLines,
            ]);

            if (result.nextFloor) {
                currentFloor = result.nextFloor;
                const floorLabel = typeof currentFloor === "string" && currentFloor.startsWith("f")
                    ? currentFloor.slice(1)
                    : currentFloor;
                floorNumEl.textContent = floorLabel;
            }

            if (result.enemy) {
                enemyNameEl.textContent = result.enemy.name || "???";
                enemyPowerEl.textContent =
                    "Power: " + (result.enemy.power != null ? result.enemy.power : "-");
            }

            floorNoteEl.textContent = result.win ? "Ready for next." : "Try again.";

            if (result.partyAfter && Array.isArray(result.partyAfter)) {
                result.partyAfter.forEach((updatedUnit) => {
                    for (let i = 0; i < party.length; i++) {
                        if (party[i] && party[i].id === updatedUnit.id) {
                            party[i] = Object.assign({}, party[i], updatedUnit);
                        }
                    }
                });
                renderPartyUI();
            }
        } catch (e) {
            fightResultEl.textContent = "Error: " + e.message;
            floorNoteEl.textContent = "Error";
        }

        btnFight.disabled = false;
    }

    async function doRestart() {
        btnRestart.disabled = true;
        fightResultEl.textContent = "Restarting run...";
        floorNoteEl.textContent = "Restarting...";

        try {
            await api.restart();

            currentFloor = 1;
            floorNumEl.textContent = currentFloor;
            floorNoteEl.textContent = "Ready";
            fightResultEl.textContent = "Run restarted.";
            enemyNameEl.textContent = "???";
            enemyPowerEl.textContent = "Power: -";
            appendLog("Restart run -> back to Floor 1");

            party = [null, null, null];
            renderPartyUI();
        } catch (e) {
            fightResultEl.textContent = "Error: " + e.message;
            floorNoteEl.textContent = "Error";
        }

        btnRestart.disabled = false;
    }

    function bindSlotButtons() {
        chooseBtns.forEach((btn, idx) => {
            btn.addEventListener("click", () => {
                openRosterPicker(idx);
            });
        });
    }

    async function init() {
        const tok = localStorage.getItem("token");
        if (!tok) {
            fightResultEl.textContent = "Please login first.";
            floorNoteEl.textContent = "No auth";
            btnFight.disabled = true;
            btnRestart.disabled = true;
            return;
        }

        try {
            const p = await api.player();
            if (p && p.username) {
                playerNameEl.textContent = p.username;
            }
            if (p && p.coins != null) {
                playerCoinsEl.textContent = p.coins;
            }
        } catch (e) {
            playerNameEl.textContent = "???";
        }

        try {
            roster = await api.roster();
        } catch (e) {
            roster = [];
        }

        renderPartyUI();

        floorNumEl.textContent = currentFloor;
        floorNoteEl.textContent = "Ready";
        enemyNameEl.textContent = "???";
        enemyPowerEl.textContent = "Power: -";
        fightResultEl.textContent = "No battle yet.";
    }

    btnFight.addEventListener("click", doFight);
    btnRestart.addEventListener("click", doRestart);
    bindSlotButtons();
    closeRosterBtn.addEventListener("click", closeRosterPicker);

    init();
})();
