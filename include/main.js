// --- Imports ---
import init, { Cell, Universe } from "../pkg/game_of_life.js";

// --- Constants ---
const DEFAULT_WIDTH =  80;
const DEFAULT_HEIGHT = 60;
const DEFAULT_SPEED = 100;
const DEFAULT_DENSITY = 1;
const DEFAULT_CIRCULAR_UNIVERSE = true;
const DEFAULT_DISPLAY_DEAD = true;
const DEFAULT_DISPLAY_STATS = false;

// --- Module variables ---
var patterns;    // Example patterns.
var universe;    // Universe Model.
var speed;       // Game speed.
var timer;       // Game timer: triggers each generation.
var playing;     // Indicate if the game is running.
var displayDead; // Indicate if displays the dead cells with different color than empty.
var formatter;   // Number format.;
var generation;  // Generation count;

var statsGeneration;
var statsPopulation;
var lastMouseEvent = null;

/**
 * Initialize the game with the default values.
 *
 * return {void}
 */
export async function initGame() {
	playing = false;
	displayDead = true;
	formatter = new Intl.NumberFormat();
	statsGeneration = element("stats_generation");
	statsPopulation = element("stats_population");
	element("grid_width").value = DEFAULT_WIDTH;
	element("grid_height").value = DEFAULT_HEIGHT;
	element("speed").value = DEFAULT_SPEED;
	element("density").selectedIndex = DEFAULT_DENSITY;
	element("circular_universe").checked = DEFAULT_CIRCULAR_UNIVERSE;
	element("display_dead").checked = DEFAULT_DISPLAY_DEAD;
	element("display_stats").checked = DEFAULT_DISPLAY_STATS;
	await fetch("include/patterns.json")
		.then(result => result.json())
		.then(json =>  initPatterns(json));
	await init().then(() => { updateUniverse() });
	document.onkeypress = function(e) { handleKeyPress(e); };
}

/**
 * Creates a new universe model and render table.
 *
 * return {void}
 */
export function updateUniverse() {
	var width = element("grid_width").value;
	var height = element("grid_height").value;
	universe = Universe.new(width, height);
	universe.set_circular(element("circular_universe").checked);
	createTable(width, height);
	generation = 0;
	statsGeneration.innerHTML = 0;
	statsPopulation.innerHTML = 0;
}

/**
 * Randomly populate the universe using the density selector.
 *
 * return {void}
 */
export function randomUniverse() {
	var e = element("density");
	var density = e.options[e.selectedIndex].value;
	universe.random(density);
	refreshTable();
}

/**
 * Starts the universe simulation.
 *
 * return {void}
 */
export function playUniverse() {
	speed = element("speed").value;
	toggleControls(false);
	playing = true;
	play();
}

/**
 * Stops the universe simulation.
 *
 * retun {void}
 */
export function stopUniverse() {
	clearTimeout(timer);
	toggleControls(true);
	playing = false;
}

/**
 * Set if the Universe is circular.
 *
 * @param {boolean} value
 */
export function setCircularUniverse(value) {
	universe.set_circular(value);
}

/**
 * Set if the display dead cells with a different color than empty.
 *
 * @param {boolean} value
 */
export function setDisplayDead(value) {
	displayDead = value;
	refreshTable();
}

/**
 * A private method that searches an element by ID.
 *
 * @param {string} id
 * @return {HTMLElement}
 */
function element(id) {
	return document.getElementById(id);
}

/**
 * A private method that initialize the patterns object from the json definition.
 *
 * @param {Object} json
 * @return {void}
 */
function initPatterns(json) {
	patterns = { pointer: [{x: 0,y: 0}]};
	var select = element("pattern");
	for (var gname in json) {
		var gid = gname.toLowerCase();
		var i18n = "ctrls.patterns." + gid;
		var group = json[gname];
		var elem = document.createElement("OPTGROUP");
		elem.label = gname;
		elem.setAttribute("i18n", i18n);
		select.appendChild(elem);
		for (var pname in group) {
			var pid = pname.toLowerCase();
			var pattern = group[pname];
			var a = new Array();
			var e = document.createElement("OPTION");
			var id = gid + '/' + pid;
			e.textContent = pname;
			e.setAttribute("value", id);
			elem.appendChild(e);
			for (var i = 0, c; c = pattern[i++];) {
				var n = c.indexOf(',');
				var x = parseInt(c.substring(0, n));
				var y = parseInt(c.substring(n + 1));
				var p = {x,y};
				a.push(p);
			}
			patterns[id] = a;
		}
	}
}

/**
 * A private method that returns the selected pattern.
 *
 * @return {Object} - An object with the coordinates of the pattern.
 */
function getPattern() {
	var select = element("pattern");
	var id = select.options[select.selectedIndex].value;
	return patterns[id];
}

/**
 * A private method that create the render table in the container HTLM element.
 *
 * @param {number} width
 * @param {number} height
 * @return {void}
 */
function createTable(width, height) {
	var root = element("container");
	root.innerHTML = '';

	var table = document.createElement("table");
	root.appendChild(table);
	for (var i = 0; i < height; i++) {
		var tr = document.createElement("tr");
		table.appendChild(tr);
		for (var j = 0; j < width; j++) {
			var td = document.createElement("td");
			td.setAttribute("id", i + "_" + j);
			td.setAttribute("class", "empty");
			td.onclick = handleMouseEventOnCell;
			td.onmouseenter = handleMouseEventOnCell;
			td.onmouseleave = handleMouseEventOnCell;
			tr.appendChild(td);
		}
	}
}

/**
 * A private method that refresh the render table.
 *
 * @return {void}
 */
function refreshTable() {
	var count = 0;
	for (var x = 0; x < universe.width(); x++) {
		for (var y = 0; y < universe.height(); y++) {
			refreshCell(x, y);
			if (universe.get(x, y) == Cell.Alive) count++;
		}
	}
	statsPopulation.innerHTML = formatter.format(count);
}

/**
 * A private method that refresh a cell in the render table.
 *
 * @param {number} x
 * @param {number} y
 * @return {void}
 */
function refreshCell(x, y) {
	var cell = element(y + '_' + x);
	switch (universe.get(x, y)) {
		case Cell.Alive: cell.setAttribute("class", "alive"); break;
		case Cell.Dead:  cell.setAttribute("class", displayDead?"dead":"empty");  break;
		default:         cell.setAttribute("class", "empty");
	}
}

/**
 * A private method that handles the mouse events on the cells of the render table.
 *
 * @param {Object} e - MouseEvent
 * @return {void}
 */
function handleMouseEventOnCell(e) {
	if (playing) return;
	var type = e.type;

	// --- Universe ---
	var w = universe.width();
	var h = universe.height();

	// --- Source ---
	var src = e.srcElement;
	var id = src.id;
	var i = id.indexOf('_');
	var sy = parseInt(id.substring(0,i));
	var sx = parseInt(id.substring(i + 1));

	// --- Pattern ---
	var pattern = getPattern();

	// -- Update Grid ---
	for (var j = 0, p; p = pattern[j++];) {
		var x = sx + p.x;
		var y = sy + p.y;
		if (x >= w || y >= h) continue;
		if (type == "mouseenter") {
			element(y + '_' + x).setAttribute("class", "over");
			lastMouseEvent = e;
		} else if (type == "mouseleave") {
			refreshCell(x, y);
			lastMouseEvent = null;
		} else if (type == "click") {
			universe.toggle(x, y);
			refreshCell(x, y);
		}
	}
}

/**
 * A private method that handles the keyboard events.
 *
 * @param {Object} e - KeyEvent
 * @return {void}
 */
function handleKeyPress(e) {
	if (playing) return;
	var pattern = getPattern();
	if (pattern.length == 1) return;
	if (e.code === "KeyA" || e.code === "KeyD") {
		var w = 0;
		var h = 0;
		for (var i = 0, p; p = pattern[i++];) {
			if (p.x > w) w = p.x;
			if (p.y > h) h = p.y;
		}
		for (var i = 0; i < pattern.length; i++) {
			var x = pattern[i].x;
			var y = pattern[i].y;
			if (e.code === "KeyA") {
				pattern[i].x = y;
				pattern[i].y = w - x;
			} else if (e.code === "KeyD") {
				pattern[i].x = h - y;
				pattern[i].y = x;
			}
		}
		if (lastMouseEvent != null) {
			refreshTable();
			handleMouseEventOnCell(lastMouseEvent);
		}
	}
}

/**
 * A private method that enable or disable the control panel.
 *
 * @param {boolean} enabled
 * @return {void}
 */
function toggleControls(enabled) {
	var list = document.querySelectorAll("form");
	for (var i = 0, f; f = list[i++];) {
		var elems = element(f.id).elements;
		for (var j = 0, e; e = elems[j++];) {
			e.disabled = (e.id === "button_stop" ? enabled : !enabled);
		}
	}
	element("button_play").style.display = (enabled ? "inline" : "none");
	element("button_stop").style.display = (enabled ? "none" : "inline");
}

/**
 * A private method that starts the simulation and configures the simulation timer.
 *
 * @return {void}
 */
function play() {
	universe.next();
	statsGeneration.innerHTML = formatter.format(++generation);
	refreshTable();
	timer = setTimeout(play, speed);
}
