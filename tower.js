(function () {
    let currentFloor = "f1";
    let highestCleared = 0;
    let unlockedFloors = ["f1"];
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

    const floorSelectEl = document.getElementById("floorSelect");

    const replayBoxEl = document.getElementById("replayBox");
    const replayAlliesEl = document.getElementById("replayAllies");
    const replayEnemiesEl = document.getElementById("replayEnemies");
    const replayLogEl = document.getElementById("replayLog");

    const chooseBtns = [
        document.querySelector('[data-slotpick="0"]'),
        document.querySelector('[data-slotpick="1"]'),
        document.querySelector('[data-slotpick="2"]'),
    ];

    // --------- ESTIMATE STATS ----------
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
        const base = baseMap[oc.clazz || oc.class] || { hp: 100, atk: 15, spd: 10 };
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
        const tierName = oc.tier || oc.TIER || oc.rarity || "COMMON";
        const tierMul = tierMulMap[tierName] || 1;
        const Lraw = oc.level != null ? oc.level : oc.levelAfter != null ? oc.levelAfter : 1;
        const L = Math.max(1, Lraw | 0);
        const mul = 1 + 0.04 * (L - 1);
        return {
            hp: Math.round((oc.hp != null ? oc.hp : base.hp) * tierMul * mul),
            atk: Math.round((oc.atk != null ? oc.atk : base.atk) * tierMul * mul),
            spd: oc.spd != null ? oc.spd : (base.spd + Math.floor((L - 1) / 5)),
            level: L,
            tier: tierName
        };
    }

    // --------- PARTY RENDER ----------
    function renderPartyUI() {
        const slotEls = [
            {
                n: slotName0,
                m: slotMeta0,
                c: party[0],
                wrap: document.querySelector('[data-slot="0"]')
            },
            {
                n: slotName1,
                m: slotMeta1,
                c: party[1],
                wrap: document.querySelector('[data-slot="1"]')
            },
            {
                n: slotName2,
                m: slotMeta2,
                c: party[2],
                wrap: document.querySelector('[data-slot="2"]')
            },
        ];

        slotEls.forEach((s) => {
            const wrap = s.wrap;
            if (!s.c) {
                if (wrap) wrap.classList.remove("filled");

                s.n.innerHTML = "EMPTY";
                s.m.innerHTML = "—";

                // remove old hp bar if exists
                const oldBar = wrap && wrap.querySelector(".hp-bar");
                if (oldBar) oldBar.remove();
                return;
            }

            const stats = estimateStats(s.c);
            const dispName = s.c.displayName || s.c.name || ("Unit " + (s.c.id || "?"));
            const curHpNow = s.c.curHp != null ? s.c.curHp : stats.hp;
            const curHpShow = curHpNow + "/" + stats.hp;
            const tierName = stats.tier || "COMMON";

            if (wrap) wrap.classList.add("filled");

            s.n.innerHTML = `
                ${dispName}
                <span class="tier-badge">${tierName}</span>
            `;

            s.m.innerHTML =
                `Lv.${stats.level} • HP ${curHpShow} • ATK ${stats.atk} • SPD ${stats.spd}`;

            // hp bar %
            const hpPct = stats.hp > 0 ? (curHpNow / stats.hp) * 100 : 0;

            let hpBar = wrap.querySelector(".hp-bar");
            if (!hpBar) {
                hpBar = document.createElement("div");
                hpBar.className = "hp-bar";
                hpBar.innerHTML = `<div class="hp-bar-fill"></div>`;
                // append under meta
                s.m.parentElement.appendChild(hpBar);
            }

            const fillEl = hpBar.querySelector(".hp-bar-fill");
            if (fillEl) {
                fillEl.style.setProperty("--hpFill", hpPct + "%");
            }
        });
    }

    // --------- ENEMY PREVIEW ----------
    function renderEnemyPreviewFromReplay(replay) {
        if (!replay || !replay.enemies || !replay.enemies.length) {
            enemyNameEl.textContent = "???";
            enemyPowerEl.textContent = "Power: -";
            return;
        }
        const totalPow = replay.enemies
            .map(e => e.atk || 0)
            .reduce((a, b) => a + b, 0);
        const names = replay.enemies.map(e => e.name || "???").join(", ");
        enemyNameEl.textContent = names;
        enemyPowerEl.textContent = "ATK " + totalPow + " • " + replay.enemies.length + " enemy";
    }

    // --------- LOG LIST ----------
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

    // --------- ROSTER PICKER ----------
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
                  <div class="roster-name">
                    ${c.displayName || c.name || ("Unit " + (c.id || "?"))}
                  </div>
                  <div class="roster-meta">
                    ${(stats.tier || "COMMON")} • Lv.${stats.level}
                  </div>
                </div>
                <div class="roster-stats">
                  <div>HP ${c.hp != null ? c.hp : stats.hp}</div>
                  <div>ATK ${c.atk != null ? c.atk : stats.atk}</div>
                  <div>SPD ${c.spd != null ? c.spd : stats.spd}</div>
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

    // --------- FLOORS ----------
    function recomputeUnlockedFloorsFromHighest() {
        const hc = highestCleared | 0;
        const maxPlayable = hc + 1;
        const newList = [];
        for (let f = 1; f <= Math.max(1, maxPlayable); f++) {
            newList.push("f" + f);
        }
        unlockedFloors = newList;
    }

    function syncFloorSelect() {
        floorSelectEl.innerHTML = "";
        unlockedFloors.forEach(fid => {
            const opt = document.createElement("option");
            opt.value = fid;
            opt.textContent = fid.toUpperCase();
            if (fid === currentFloor) {
                opt.selected = true;
            }
            floorSelectEl.appendChild(opt);
        });
    }

    function setFloorLabelFromId(fid) {
        const label = fid.startsWith("f") ? fid.slice(1) : fid;
        floorNumEl.textContent = label;
    }

    // --------- REPLAY UI ----------
    function setReplayUIHidden(hidden) {
        if (!replayBoxEl) return;
        replayBoxEl.style.display = hidden ? "none" : "block";
    }

    function clearReplayUI() {
        if (!replayBoxEl) return;
        replayAlliesEl.innerHTML = "";
        replayEnemiesEl.innerHTML = "";
        replayLogEl.innerHTML = "";
    }

    function createReplayUnitCard(u) {
        const card = document.createElement("div");
        card.className = "replay-unit";
        card.setAttribute("data-id", u.id);

        const maxHp = u.hp != null ? u.hp : u.curHp != null ? u.curHp : 0;
        const curHp = u.curHp != null ? u.curHp : maxHp;
        const lvl = u.level ?? "?";
        const hpPct = maxHp > 0 ? (curHp / maxHp) * 100 : 0;

        card.innerHTML = `
            <div class="replay-unit-name">
              <span>${u.name || "?"}</span>
              <span>Lv.${lvl}</span>
            </div>
            <div class="replay-unit-hp">
              <div>
                HP <span class="hp-now">${curHp}</span>/<span class="hp-max">${maxHp}</span>
              </div>
              <div class="replay-hpbar">
                <div class="replay-hpbar-fill" style="--hpFill:${hpPct}%;"></div>
              </div>
            </div>
        `;
        return card;
    }

    function updateReplayUnitHp(id, newHp) {
        const card = replayBoxEl.querySelector('.replay-unit[data-id="' + id + '"]');
        if (!card) return;

        const hpNowEl = card.querySelector(".hp-now");
        const hpMaxEl = card.querySelector(".hp-max");
        const barFill = card.querySelector(".replay-hpbar-fill");

        if (hpNowEl) hpNowEl.textContent = newHp;

        const maxVal = hpMaxEl ? parseInt(hpMaxEl.textContent, 10) : null;
        if (maxVal && barFill) {
            const pct = Math.max(0, (newHp / maxVal) * 100);
            barFill.style.setProperty("--hpFill", pct + "%");
        }
    }

    function appendReplayLogLine(txt) {
        const p = document.createElement("div");
        p.textContent = txt;
        replayLogEl.appendChild(p);
        replayLogEl.scrollTop = replayLogEl.scrollHeight;
    }

    function buildInitialHpState(replayData) {
        const hpState = {};
        (replayData.allies || []).forEach(u => {
            const maxHp = u.hp != null ? u.hp : u.curHp != null ? u.curHp : 0;
            const curHp = u.curHp != null ? u.curHp : maxHp;
            hpState[u.id] = { cur: curHp, max: maxHp, side: "ally" };
        });
        (replayData.enemies || []).forEach(u => {
            const maxHp = u.hp != null ? u.hp : u.curHp != null ? u.curHp : 0;
            const curHp = u.curHp != null ? u.curHp : maxHp;
            hpState[u.id] = { cur: curHp, max: maxHp, side: "enemy" };
        });
        return hpState;
    }

    function playReplaySequence(replayData, doneCb) {
        if (!replayData) {
            setReplayUIHidden(true);
            doneCb();
            return;
        }

        setReplayUIHidden(false);
        clearReplayUI();

        (replayData.allies || []).forEach(u => {
            const c = createReplayUnitCard(u);
            replayAlliesEl.appendChild(c);
        });
        (replayData.enemies || []).forEach(u => {
            const c = createReplayUnitCard(u);
            replayEnemiesEl.appendChild(c);
        });

        const hpState = buildInitialHpState(replayData);
        const nameMap = replayData.names || {};
        const events = replayData.events || [];
        let idx = 0;

        function stepOne() {
            if (idx >= events.length) {
                doneCb();
                return;
            }

            const ev = events[idx++];
            if (ev.type === "ATK") {
                const actorName = nameMap[ev.actor] || ev.actor || "?";
                const targetName = nameMap[ev.target] || ev.target || "?";
                const dmg = ev.amount != null ? ev.amount : 0;

                if (hpState[ev.target]) {
                    hpState[ev.target].cur = Math.max(0, hpState[ev.target].cur - dmg);
                    updateReplayUnitHp(ev.target, hpState[ev.target].cur);
                }

                const critTxt = ev.crit ? " CRIT!" : "";
                appendReplayLogLine(actorName + " hits " + targetName + " for " + dmg + critTxt);
            } else if (ev.type === "DIE") {
                const deadName = nameMap[ev.actor] || ev.actor || "?";
                if (hpState[ev.actor]) {
                    hpState[ev.actor].cur = 0;
                    updateReplayUnitHp(ev.actor, 0);
                }
                appendReplayLogLine(deadName + " is defeated");
            } else if (ev.type === "XP") {
                const who = nameMap[ev.actor] || ev.actor || "?";
                const gain = ev.amount != null ? ev.amount : 0;
                appendReplayLogLine(who + " gains " + gain + " XP");
            }

            setTimeout(stepOne, 300);
        }

        stepOne();
    }

    // --------- FIGHT FLOW ----------
    async function doFight() {
        btnFight.disabled = true;
        fightResultEl.textContent = "Resolving battle...";
        fightResultEl.classList.remove("win", "lose");
        floorNoteEl.textContent = "Fighting...";
        floorNoteEl.classList.remove("ready", "danger");

        const used = party.filter((p) => p).map((p) => p.id);
        if (!used.length) {
            fightResultEl.textContent = "Pick at least 1 unit first.";
            btnFight.disabled = false;
            floorNoteEl.textContent = "Need party";
            return;
        }

        try {
            const floorNumForServer = currentFloor.startsWith("f")
                ? currentFloor
                : "f" + currentFloor;

            const result = await api.resolve(floorNumForServer, used);

            playReplaySequence(result.replay, () => {
                afterReplayFinish(result);
            });
        } catch (e) {
            fightResultEl.textContent = "Error: " + e.message;
            floorNoteEl.textContent = "Error";
            floorNoteEl.classList.add("danger");
            btnFight.disabled = false;
        }
    }

    function afterReplayFinish(result) {
        const win = (result.outcome === "WIN");
        const battleLines = [];

        if (win) {
            battleLines.push("WIN on " + currentFloor + "!");
        } else {
            battleLines.push("DEFEAT on " + currentFloor + "...");
        }

        if (result.loot && Array.isArray(result.loot) && result.loot.length) {
            const lootText = result.loot
                .map(l => (l.currency || "") + " +" + l.amt)
                .join(", ");
            battleLines.push("Loot: " + lootText);
        }

        // fight result box style
        fightResultEl.classList.remove("win", "lose");
        fightResultEl.classList.add(win ? "win" : "lose");
        fightResultEl.textContent = battleLines.join(" | ");

        appendLog([
            currentFloor.toUpperCase(),
            ...battleLines,
        ]);

        if (typeof result.coins === "number") {
            playerCoinsEl.textContent = result.coins;
        }

        if (result.replay) {
            // preview enemy side for next info
            renderEnemyPreviewFromReplay(result.replay);

            // sync HP back into party
            if (Array.isArray(result.replay.allies)) {
                const alliesById = {};
                result.replay.allies.forEach(u => {
                    alliesById[u.id] = u;
                });
                for (let i = 0; i < party.length; i++) {
                    if (!party[i]) continue;
                    if (alliesById[party[i].id]) {
                        party[i] = Object.assign({}, party[i], alliesById[party[i].id]);
                    }
                }
                renderPartyUI();
            }
        }

        if (typeof result.highestCleared === "number") {
            highestCleared = result.highestCleared;
            recomputeUnlockedFloorsFromHighest();
            if (!unlockedFloors.includes(currentFloor)) {
                currentFloor = "f" + (highestCleared + 1);
            }
            syncFloorSelect();
            setFloorLabelFromId(currentFloor);
        }

        floorNoteEl.classList.remove("ready", "danger");
        floorNoteEl.textContent = win ? "Ready for next." : "Try again.";
        floorNoteEl.classList.add(win ? "ready" : "danger");

        btnFight.disabled = false;
    }

    // --------- RESTART RUN ----------
    async function doRestart() {
        btnRestart.disabled = true;
        fightResultEl.textContent = "Restarting run...";
        fightResultEl.classList.remove("win", "lose");
        floorNoteEl.textContent = "Restarting...";
        floorNoteEl.classList.remove("ready", "danger");

        try {
            await api.restart();

            highestCleared = 0;
            recomputeUnlockedFloorsFromHighest();
            currentFloor = "f1";

            syncFloorSelect();
            setFloorLabelFromId(currentFloor);
            floorNoteEl.textContent = "Ready";
            floorNoteEl.classList.add("ready");

            fightResultEl.textContent = "Run restarted.";
            enemyNameEl.textContent = "???";
            enemyPowerEl.textContent = "Power: -";
            appendLog("Restart run -> back to F1");

            party = [null, null, null];
            renderPartyUI();

            setReplayUIHidden(true);
            clearReplayUI();
        } catch (e) {
            fightResultEl.textContent = "Error: " + e.message;
            floorNoteEl.textContent = "Error";
            floorNoteEl.classList.add("danger");
        }

        btnRestart.disabled = false;
    }

    // --------- BIND EVENTS ----------
    function bindSlotButtons() {
        chooseBtns.forEach((btn, idx) => {
            btn.addEventListener("click", () => {
                pickingSlot = idx;
                openRosterPicker(idx);
            });
        });
    }

    function bindFloorSelect() {
        floorSelectEl.addEventListener("change", () => {
            const fid = floorSelectEl.value;
            currentFloor = fid;
            setFloorLabelFromId(currentFloor);

            floorNoteEl.classList.remove("ready", "danger");
            floorNoteEl.textContent = "Ready";
            floorNoteEl.classList.add("ready");

            fightResultEl.classList.remove("win", "lose");
            fightResultEl.textContent = "No battle yet.";

            enemyNameEl.textContent = "???";
            enemyPowerEl.textContent = "Power: -";

            setReplayUIHidden(true);
            clearReplayUI();
        });
    }

    // --------- INIT ----------
    async function init() {
        const tok = localStorage.getItem("token");
        if (!tok) {
            fightResultEl.textContent = "Please login first.";
            fightResultEl.classList.remove("win", "lose");

            floorNoteEl.textContent = "No auth";
            floorNoteEl.classList.remove("ready", "danger");
            floorNoteEl.classList.add("danger");

            btnFight.disabled = true;
            btnRestart.disabled = true;
            return;
        }

        let pData = null;
        try {
            pData = await api.player();
        } catch (e) {
            pData = null;
        }

        if (pData && pData.username) {
            playerNameEl.textContent = pData.username;
        }
        if (pData && typeof pData.coins === "number") {
            playerCoinsEl.textContent = pData.coins;
        }
        if (pData && typeof pData.highestCleared === "number") {
            highestCleared = pData.highestCleared;
        } else {
            highestCleared = 0;
        }

        try {
            roster = await api.roster();
        } catch (e) {
            roster = [];
        }

        recomputeUnlockedFloorsFromHighest();
        currentFloor = "f" + (highestCleared + 1);
        if (!unlockedFloors.includes(currentFloor)) {
            currentFloor = unlockedFloors[unlockedFloors.length - 1] || "f1";
        }

        renderPartyUI();

        syncFloorSelect();
        setFloorLabelFromId(currentFloor);

        floorNoteEl.textContent = "Ready";
        floorNoteEl.classList.remove("ready", "danger");
        floorNoteEl.classList.add("ready");

        enemyNameEl.textContent = "???";
        enemyPowerEl.textContent = "Power: -";

        fightResultEl.textContent = "No battle yet.";
        fightResultEl.classList.remove("win", "lose");

        setReplayUIHidden(true);
        clearReplayUI();
    }

    // --------- HOOK UP ---------
    btnFight.addEventListener("click", doFight);
    btnRestart.addEventListener("click", doRestart);
    bindSlotButtons();
    bindFloorSelect();
    closeRosterBtn.addEventListener("click", () => {
        closeRosterPicker();
    });

    init();
})();
