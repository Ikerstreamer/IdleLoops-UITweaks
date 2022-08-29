// ==UserScript==
// @name         IdleLoops UI Tweaks
// @namespace    https://github.com/Quiaaaa/
// @version      0.6.2
// @description  Add some QoL UI elements for observing progress, and planning
// @downloadURL  https://raw.githubusercontent.com/Quiaaaa/IdleLoops-UITweaks/main/IdleLoopsUITweaks.user.js
// @author       Trimpscord
// @match        https://lloyd-delacroix.github.io/omsi-loops/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.io
// @grant        none
// @inject-into  page
// ==/UserScript==

// Quia's Growth Tracking and Remaining Actions
function startTracking() {
	statsAtStart = structuredClone(stats);
}

function resetTracking() {
	startTracking();
	statList.forEach((stat) => ["Talent", "ss"].forEach((suffix) => {
		document.querySelector(`#stat${stat}${suffix}Inc`).innerHTML = ''
	}))
	resetTotalSS()
	resetTotalTalent()
}

function addUIElements() {
	let shortNames = {Dexterity: "Dex", Strength: "Str", Constitution: "Con", Speed: "Spd", Perception: "Per", Charisma: "Cha", Intelligence: "Int", Luck: "Luck", Soul: "Soul", Total: "Total"};
	
	//Talent and SS increases
	statList.forEach((stat) => ["Talent", "ss"].forEach((suffix) => {
		let statEl =  document.querySelector(`#stat${stat}${suffix}`)
		statEl.insertAdjacentHTML("afterend", `<div class="medium" id="stat${stat}${suffix}Inc"></div>`);
		// Observer for the given stat
		let observer = new MutationObserver(function() {updateIncreases(stat,suffix)});
		observer.observe(statEl, {attributes: true, childList: true, characterData: true});
	}))

	createTotalStat();

	document.querySelector('#statContainer').childNodes.forEach((stat) => {
		let statElem = stat.children[0];
		let nameElem = statElem.children[0];
		nameElem.innerText = shortNames[nameElem.innerText];
		
		statElem.children[0].style = 'width: 10%; font-weight: bold; margin-left: 18px; margin-top: 5px' // Name
		statElem.children[1].style = 'width: 30%; color: #737373; '; // SS
		statElem.children[2].style = 'width: 30%;' // Talent
		statElem.children[3].style = 'width: 12%; font-weight: bold'; // Level
	}); 

	//Progress requirements for Explore Actions
	towns.forEach((town) => town.progressVars.forEach((action) => {
		let observer = new MutationObserver(function() {updateRepeats(town,action)});
		let townEl = document.querySelector(`#expBar${action}`);
		//Observer for the town progress
		observer.observe(townEl, {attributes: true, childList: true, characterData: true});
		document.querySelector(`#prc${action}`).nextElementSibling.insertAdjacentHTML("afterbegin",
		`<div class="reqActions" id="reqActions${action}">
		Next: <span class="nextReq"></span>
		<input class="goal" value="100" style="width: 1.5rem; top: -0.5px; margin-left: 10px; text-align: center; margin-bottom: 1px; border-width: 0.5px;"> :
		<span class="goalReq"></span>
		</div>`)
		document.querySelector(`#reqActions${action}`).childNodes[3].addEventListener('input', function() {updateRepeats(town,action)})
		// Call update once to create the text
		updateRepeats(town, action);
	}));
	
	//Goal Tracking for Skills
	document.querySelector("#skillTCombatContainer").insertAdjacentHTML("afterend", "<br><br>") // fuck this (alternative is to line up the combat stats with the other stats and I don't want to)
	skillList.forEach((skill) => {
		let observer = new MutationObserver(function() { updateSkillRepeats(skill) });
		let skillEl = document.querySelector(`#skill${skill}LevelBar`); 
		//Observer for the skill progress
		observer.observe(skillEl, {attributes: true, childList: true, characterData: true});
		
		let container = document.createElement("div");
		container.style = "float: right";
		
		let currentSkill = document.querySelector(`#skill${skill}Container .statNum`);
		let newSkill = currentSkill.cloneNode(true);
		newSkill.style = "float: left";
		container.appendChild(newSkill);
		
		let goalContainer = document.createElement("div");
		goalContainer.id = `skillReqActions${skill}`;
		goalContainer.style = "font-size: 13px; margin-left: .5rem; float: right;";
		container.appendChild(goalContainer);
		
		let goalInput = document.createElement("input");
		goalInput.className = "goal";
		goalInput.value = `${getSkillLevelFromExp(skills[skill].exp)+1}`;
		goalInput.style = "width: 1.5rem; top: -0.5px; margin-left: 10px; text-align: center; margin-bottom: 1px; border-width: 0.5px;" // what even is this nightmare?
		goalInput.addEventListener('input', function() { updateSkillRepeats(skill) })
		goalContainer.appendChild(goalInput);
		
		let goalOut = document.createElement("span");
		goalOut.className = "goalReq";
		goalOut.style = "display: inline-block; width: 3rem";
		goalContainer.appendChild(goalOut);
		
		// replace the old skill display with the enhanced one
		currentSkill.replaceWith(container);
		
		// Call update once to create the text
		updateSkillRepeats(skill);
	});

	//Create reset button
	let btn = document.createElement("button");
	btn.id = "trackingReset";
	btn.innerHTML = "Reset Tracking";
	btn.className = "button";
	btn.onclick = function() { resetTracking() }
	document.querySelectorAll("div#statsWindow label.localized")[1].insertAdjacentElement("afterend", btn)
	
	//Replace Max Training function
	document.querySelector("#maxTraining").onclick = function() { betterCapTraining(); };

	//realign Stats box to make it easier to fit them in, align action info with progress bar
	var style = document.createElement('style');
	style.innerHTML = `
	.statNum {
		margin: 5px 3px 0;
		text-align: left;
		font-size: 13px
	}
	.statNum div {
		text-align: left;
		font-size: 13px
	}
	.thinProgressBarUpper {
		position: relative;
	}
	.reqActions {
		position: absolute;
		right: 0;
		bottom: 100%;
	}
	.button, .loadoutbutton {
		margin-top:3px;
	}
	`;
	document.head.appendChild(style);
}

function createTotaltracker(parent, trackID) {
	let totalTracker = document.createElement('div');
	totalTracker.classList.add('statNum');
	parent.appendChild(totalTracker);
	["", "Inc"].forEach((type) => {
		let tracker = document.createElement('div');
		tracker.classList.add('medium');
		tracker.id = `${trackID}${type}`;
		tracker.innerHTML = '';
		totalTracker.appendChild(tracker);
	});

}

function createTotalStat() {
	let totalStat = document.createElement('div');
	totalStat.classList.add('statRegularContainer');

	let totalContainer = document.createElement('div');
	totalContainer.classList.add('statLabelContainer');
	totalContainer.style = 'display: inline-block;';
	totalStat.appendChild(totalContainer);

	let totalName = document.createElement('div');
	totalName.classList.add('medium', 'bold');
	totalName.innerHTML = 'Total';
	totalContainer.appendChild(totalName);

	createTotaltracker(totalContainer, 'statTotalss');
	createTotaltracker(totalContainer, 'statTotalTalent');

	let totalLevel = document.createElement('div');
	totalLevel.classList.add('statNum','medium', 'bold');
	totalLevel.innerHTML = '';
	totalContainer.appendChild(totalLevel);

	document.querySelector('#statContainer').appendChild(totalStat);
	resetTotalSS();
	resetTotalTalent();
}

function resetTotalSS() {
	let count = 0;
	statList.forEach(stat => {
		count += stats[stat].soulstone;
		currSSList[stat] = 0;
	});
	startSSTotal = count;
	currSSTotal = count;
	document.querySelector('#statTotalss').innerHTML = intToString(count, 1);
	document.querySelector('#statTotalssInc').innerHTML = '';
}

function resetTotalTalent() {
	let count = 0;
	statList.forEach(stat => {
		count += getLevelFromTalent(stats[stat].talent);
		currTalentList[stat] = 0;
	});
	startTalentTotal = count;
	currTalentTotal = count;
	document.querySelector('#statTotalTalent').innerHTML = intToString(count, 1);
	document.querySelector('#statTotalTalentInc').innerHTML = '';

}

function updateIncreases(stat, suffix) {
	//track changes in Talent and SS
	let change = suffix === "Talent" ? getTalent(stat) - getLevelFromTalent(statsAtStart[stat].talent)
				: stats[stat].soulstone - statsAtStart[stat].soulstone;
	if (change != 0) {
		let displayStr = `(${change > 0 ? "+" : ""}${intToString(change, 1)})`;
		document.querySelector(`#stat${stat}${suffix}Inc`).innerText = displayStr;
		updateTotalSSTalent(stat, suffix, change);
	}
}

function updateTotalSSTalent(stat, suffix, change) {
	let totalChange, newTotal, displayStr;
	if (suffix === "Talent") {
		currTalentTotal += change - currTalentList[stat];
		currTalentList[stat] = change
		totalChange = currTalentTotal - startTalentTotal;
		newTotal = currTalentTotal;
	} else {
		currSSTotal += change - currSSList[stat];
		currSSList[stat] = change
		totalChange = currSSTotal - startSSTotal;
		newTotal = currSSTotal;
	}
	displayStr = `(${totalChange > 0 ? "+" : ""}${intToString(totalChange, 1)})`;
	document.querySelector(`#statTotal${suffix}`).innerHTML = intToString(newTotal, 1);
	document.querySelector(`#statTotal${suffix}Inc`).innerHTML = displayStr;
}

function updateRepeats(town, action) {
	//show required repeats to gain 1 level, and a user set goal level, default 100
	let level = town.getLevel(action);
	if (level < 100) {
		let progressMod = 1
		{
			//all modifications to progressMod should be multiplicative, things can have different base rates, AND be affected by glasses.
			//handle glasses actions
			let glasses = actions.next.find(a => a.name === "Buy Glasses" && a.disabled === false);
			let actionObj = getActionByVarName(action);
			if (glasses && actionObj.affectedBy?.includes("Buy Glasses")) {
				progressMod *= 2;
				if (actionObj.name == "Wander") progressMod *= 2; // wander gets x4 on glasses
			}
			
			//handle Pickaxe/mountain (some things affected by pickaxe are not faster with it, so just handle mountain)
			if (action == "Mountain") {
				let pickaxe = actions.next.find(a => a.name === "Buy Pickaxe" && a.disabled === false);
				progressMod *= pickaxe ? 2 : 1;
			}
			
			//handle constant speed actions
			let speedModActions = {Wander: 2, Met: 2, Secrets: 5, ThrowParty: 32, 
								   Hermit: .5, Canvassed: .5, Excursion: .5, 
								   Apprentice: .3, Mason: .2, Architect: .1,
								   ExploreJungle: .2,
								   PickPockets: .3, RobWarehouse: .2, InsuranceFraud: .1,
								   BuildTower: 5.05};
			progressMod *= speedModActions[action] ? speedModActions[action] : 1;
			
			// Hook in to the predictor state to get the guild, guild rank, and any relevant buffs this loop
			let resources = Koviko.state.resources
			let guild = resources.guild;
			let segment = 0;
			switch (action) {
				case "Hermit":
					progressMod *= (1 + towns[1].getLevel("Shortcut") / 100);
					break;
				case "Apprentice": // Crafting Guild Actions
				case "Mason":
				case "Architect":
					segment = guild == "crafting" ? resources.crafts : 0;
					progressMod *= precision3(1 + segment / 20 + Math.pow(segment, 2) / 300);
					break;
				case "Meander": 
					progressMod = (getBuffLevel("Imbuement")  + (('Imbue Mind' in Koviko.state?.currProgress) ? Koviko.state?.currProgress['Imbue Mind']: 0)) / 100; // Not a multiplier.
					break;
				case "ExploreJungle":
					progressMod *= calcJungleMulti(Koviko.state.progress['Fight Jungle Monsters']?.completed,Koviko.state.progress['Fight Jungle Monsters']?.progress);
					break;
				case "PickPockets": // Thieves Guild Actions
				case "RobWarehouse": 
				case "InsuranceFraud":
					segment = guild == "thieves" ? resources.thieves : 0;
					progressMod *= precision3(1 + segment / 20 + Math.pow(segment, 2) / 300);
					break;
				case "SurveyZ0": // Survey Actions
				case "SurveyZ1":
				case "SurveyZ2":
				case "SurveyZ3":
				case "SurveyZ4":
				case "SurveyZ5":
				case "SurveyZ6":
				case "SurveyZ7":
				case "SurveyZ8":
					progressMod = getExploreSkill(); // Not a multiplier
					break;
			}
			
			/* 
			TODO
			Unimplemented actions
			
			ExplorersGuild // Random exploration?  Might not need to handle it at all.
			if (getExploreSkill() == 0) towns[this.townNum].finishProgress("SurveyZ"+this.townNum, 100);
			*/
		}
		
		let actionElement = document.querySelector(`#reqActions${action}`);
		let goal = Number(actionElement.querySelector(".goal").value);
		
		let toNext = Math.ceil((level+1)/progressMod* (1 - town.getPrcToNext(action)/100))
		let toGoal = ((goal*(goal+1)/2) - level*(level+1)/2)/progressMod - ((level + 1)/progressMod - toNext); 

		actionElement.querySelector(`.nextReq`).innerText = intToString(toNext, 1);
		actionElement.querySelector(`.goalReq`).innerText = intToString(toGoal, 1);
	}
	else {
		document.querySelector(`#reqActions${action}`).style.display = "none";
	}
}

function calcJungleMulti(segment, progress) {
	let seg1Cost = precision3(Math.pow(1.3,segment))*1e8;
	let seg2Cost = precision3(Math.pow(1.3,segment+1))*1e8;
	let segments = (progress - seg1Cost < 0) ? segment : (progress - seg1Cost - seg2Cost < 0) ? segment + 1 : segment + 2;
	let multi = precision3(1 + 0.05 * Math.pow(segments, 1.05));
	if (isNaN(multi)) return 1;
	return multi;
}

function updateSkillRepeats(skill) {
	// Use the predictor output to calculate loops required to reach the goal
	let skillElement = document.querySelector(`#skillReqActions${skill}`);
	let goal = Number(skillElement.querySelector(".goal").value);
	
	//auto adjust goals upward if we're not editing it
	if (goal <= getSkillLevel(skill) && document.activeElement != skillElement.querySelector(".goal")) {
		skillElement.querySelector(".goal").value = goal + 1;
		goal += 1;
	}
	
	let expToGoal = (getExpOfSkillLevel(goal) - skills[skill].exp);
	let start = Koviko.cache.cache.at(0)?.data[0].skills[skill.toLowerCase()]; // initial state from the cache
	let end = Koviko.state.skills[skill.toLowerCase()]; // final state from predictor
	let skillExpGain = end - start;
	let loopsToGoal = Math.ceil(expToGoal / skillExpGain * 10) / 10; // always round up, one decimal place
	
	if (skillExpGain > 0) {
		skillElement.querySelector(`.goalReq`).innerText = intToString(loopsToGoal, 2);
		//document.querySelector(`#skillReqActions${skill}`).style.display = ""
	}
	else {
		skillElement.querySelector(`.goalReq`).innerText = "";
		//document.querySelector(`#skillReqActions${skill}`).style.display = "none";
	}
}


function updateTarget() {
	towns.forEach((town) => town.progressVars.forEach((action) => {
		updateRepeats(town, action);
	}))
}

function getActionByVarName(varName) {
	return Action[varName] === undefined ? Action[Object.keys(Action).find(key => Action[key].varName === varName)] : Action[varName];
}

// DemonKitty's Action Efficiency

function calcEff() {
    // Calculate the efficiency of the last active action

    let lastAction = findAction();
    if (lastAction >= 0) {
        let actionString = Koviko.totalDisplay.innerHTML;
        // Getting the time prediction from Predictor
        let lastBarIndex = actionString.lastIndexOf('|');
        let firstBarIndex = actionString.lastIndexOf('|',lastBarIndex-1);
        let time = actionString.substring(firstBarIndex + 2, lastBarIndex - 1).split(':');
        let seconds = (+time[0]) * 60 * 60 + (+time[1]) * 60 + (+time[2]);
        let actionInfo = document.querySelector('#nextActionContainer' + lastAction).children[0].children;
        let imageSrc = actionInfo[0].src;
        let actionName = actions.next[lastAction].name;
        let actionCount = 0;
        actions.next.forEach((listedAction,i) => {
            if (!listedAction.disabled && listedAction.name === actionName) actionCount += listedAction.loops;
        })
        // predictor supports calculating # of repeats for last action with repeats enabled, and the element with the predicted count gets a unique "finLoops" class if this is enabled
        let finLoops = document.querySelector('li.finLoops');
        if (finLoops) {
            actionCount += finLoops.innerHTML.replace(/,/g, '') * 1.0 - actions.next[lastAction].loops;
        }
        if (Koviko.totalDisplay.parentNode.children.length == 4) {
            createEffText(actionCount, seconds, imageSrc);
        } else {
            updateEffText(actionCount, seconds, imageSrc);
        }
    } else {
        if (Koviko.totalDisplay.parentNode.children.length == 4) {
            let rateSpan = Koviko.totalDisplay.parentNode.children[3];
            rateSpan.children[0].innerHTML = '0.00';
        }
    }
}

function findAction() {
    //Finds the last action that is not disabled
    let lastAction = document.querySelector(`#nextActionsList`).children.length - 1;
    if (lastAction < 0) {
        return -1;
    }

    let nextAction = lastAction;
    while (nextAction >= 0) {
        // Grabs the first non-opaque action
        if (document.querySelector('#nextActionContainer' + nextAction).style.opacity !== '0.5') {
            return nextAction;
        }
        nextAction -= 1;
    }
    return -1;
}

function updateEffText(amount, seconds, imageSrc) {
    // Updates the efficiency text
    let rateSpan = Koviko.totalDisplay.parentNode.children[4];
    rateSpan.children[0].innerHTML = (" | " + ((amount / seconds)*60).toFixed(2));
    rateSpan.children[1].src = imageSrc;
}

function createEffText(amount, seconds, imageSrc) {
    // Creates the efficiency text
    let rateSpan = document.createElement("span");
    rateSpan.style = "color:#8293ff; font-weight: bold; padding-left: 0.5em";
    rateSpan.appendChild(createTextElement(" | " + ((amount / seconds)*60).toFixed(2) + " "));
    let image = document.createElement("img");
    image.src = imageSrc;
    image.className = "smallIcon";
    rateSpan.appendChild(image);
    rateSpan.appendChild(createTextElement("/min"));
    Koviko.totalDisplay.parentNode.appendChild(rateSpan);
}

function createTextElement(text) {
    // Creates the text for the efficiency (yes I know divs are probably wrong to use here)
    let textEl = document.createElement("div");
    textEl.innerHTML = text;
    return textEl;
}

function hideStatGains() {
    document.querySelector("#statContainer").childNodes.forEach(stat => {
	stat.children[1].style = "display: none";
    });
}

function showStatGains() {
    document.querySelector("#statContainer").childNodes.forEach(stat => {
	stat.children[1].style = "width: 90%";
    });
}

// Code to fix the placement of tooltips on the screen so they don't go over

function fitTooltipToScreen(tooltip) {
    // Adds style to make box based on right side of parent if it would go offscreen
    let rect = tooltip.getBoundingClientRect();
    if((rect.x + rect.width) > window.innerWidth) {
	tooltip.style = "right: 0%";
    }
}

function undoTooltipStyle(tooltip) {
    //Undoes the styling in case screen size is later changed
    tooltip.style = "";
}


function fitTooltipSetup() {
    for (let i = 0; i < towns.length; i++) {
	townDiv = document.querySelector(`#actionOptionsTown${i}`);
	townDiv.childNodes.forEach(action => {
		action.querySelector(".showthat").addEventListener("mouseover",function() {
			fitTooltipToScreen(action.querySelector(".showthis"));
		});
		action.querySelector(".showthat").addEventListener("mouseout",function() {
			undoTooltipStyle(action.querySelector(".showthis"));
		});
	});
    }
}

// Code to add a cap button to the haggle action to set it to 15

function haggleMax(index) {
	// Uses code from the cap action function from the game, but designed for haggle amount
	let action = actions.next[index];
	let amount = getNumOnList(action.name) + (action.disabled ? action.loops : 0);
	let newAmount = 15 - amount;
	actions.nextLast = copyObject(actions.next);
    	if (action.loops + newAmount < 0) action.loops = 0;
    	else action.loops += newAmount;
    	view.updateNextActions();
    	view.updateLockedHidden();
}

function createHaggleMax(){
	// Creates a cap button for each haggle action
	for (let i = 0; i < actions.next.length; i++) {
		const action = actions.next[i];
		if (action.name === "Haggle") {
			let haggleCap = document.createElement("i");
			haggleCap.id = `capButton${i}`;
			haggleCap.classList.add("actionIcon","far","fa-circle");
			haggleCap.onclick = function() { haggleMax(i) };
			document.querySelector(`#nextActionContainer${i}`).children[1].insertAdjacentElement("afterbegin",haggleCap);
		}
	}
}


function betterCapTraining() {
	// Only increase training actions that were at the previous cap (assumed from highest training action in the loop)
	let actionsCopy = structuredClone(actions.next);
	let maxCurrentTraining = Math.max(...actions.next.filter((action) => trainingActions.includes(action.name)).map((action) => action.loops));
	
	if (maxCurrentTraining < trainingLimits) {
		actionsCopy.forEach((action) => { 
			if (trainingActions.includes(action.name) && action.loops == maxCurrentTraining) {
				action.loops = trainingLimits;
			} 
		})
	}
	actions.next = actionsCopy;
	view.updateNextActions();
}


function updateAll() {
	skillList.forEach((skill) => updateSkillRepeats(skill));
	updateTarget();
}




var statsAtStart;
var startSSTotal;
var startTalentTotal;
var currSSTotal;
var currSSList = {Dexterity: 0, Strength: 0, Constitution: 0, Speed: 0, Perception: 0, Charisma: 0, Intelligence: 0, Luck: 0, Soul: 0};
var currTalentTotal;
var currTalentList = {Dexterity: 0, Strength: 0, Constitution: 0, Speed: 0, Perception: 0, Charisma: 0, Intelligence: 0, Luck: 0, Soul: 0};

setTimeout(() => {
    // Growth Tracking and Remaining Actions
    startTracking();
    addUIElements();
    fitTooltipSetup();
	
	// wrapper for predictor to update things on change
	Koviko.originalUpdate = Koviko.update;
	Koviko.update = function() {
		Koviko.originalUpdate(...arguments);
		updateAll()
	}

    //document.querySelector("#radarStats").addEventListener("input", hideStatGains);
    //document.querySelector("#regularStats").addEventListener("input", showStatGains);
    // Action Efficiency
    document.querySelector('#actionList').children[1].style += 'left:34px';
    let observer = new MutationObserver(calcEff);
    observer.observe(Koviko.totalDisplay.parentNode.childNodes[5], {attributes: true, childList: true, characterData: true});
    let observer2 = new MutationObserver(createHaggleMax);
    observer2.observe(Koviko.totalDisplay.parentNode.childNodes[5], {attributes: true, childList: true, characterData: true});
    calcEff();
    createHaggleMax();
}, 5000)
