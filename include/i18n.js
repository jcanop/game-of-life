var i18n = {
	labels:  new Map(),
	defaultLang: null,
	currentLang: null,
	init: function(lang) {
		this.defaultLang = lang;
		this.currentLang = lang;
		var map = new Map();
		this.labels.set(lang, map);
		var list = document.getElementsByTagName("*");
		for (var i = 0, e; e = list[i++];) {
			tag = e.tagName;
			id = e.getAttribute("i18n");
			if (id == null) continue;
			if (tag === "H1" || tag === "SPAN" || tag === "DIV") {
				map.set(id, e.innerHTML);
			} else if (tag === "INPUT" && (e.type === "submit" || e.type === "button")) {
				map.set(id, e.value);
			} else if (tag === "INPUT" && e.type === "number") {
				map.set(id, e.placeholder);
			} else if (tag === "OPTION") {
				map.set(id, e.innerHTML);
			} else if (tag === "OPTGROUP") {
				map.set(id, e.label);
			}
		}
	},
	change: async function(lang) {
		if (!this.labels.has(lang)) {
			await fetch("i18n/" + lang + ".json")
				.then(result => result.json())
				.then(data => this.labels.set(lang, new Map(Object.entries(data))))
		}
		this.currentLang = lang;
		this.updateUI();
	},
	updateUI: function() {
		var list = document.getElementsByTagName("*");
		for (var i = 0, e; e = list[i++];) {
			tag = e.tagName;
			id = e.getAttribute("i18n");
			if (id == null) continue;
			var label = this.labels.get(this.currentLang).has(id) ?
				this.labels.get(this.currentLang).get(id) :
				this.labels.get(this.defaultLang).get(id);
			if (tag === "H1" || tag === "SPAN" || tag === "DIV") {
				e.innerHTML = label;
			} else if (tag === "INPUT" && (e.type === "submit" || e.type === "button")) {
				e.value = label;
			} else if (tag === "INPUT" && e.type === "number") {
				e.placeholder = label;
			} else if (tag === "OPTION") {
				e.innerHTML = label;
			} else if (tag === "OPTGROUP") {
				e.label = label;
			}
		}
	}
}
