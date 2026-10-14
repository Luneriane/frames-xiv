const header = document.querySelector("header");


/* ---------- Header size ---------- */
if (header) {
	const compactAfter = 80;
	const expandBefore = 20;

	const updateHeader = () => {
		const isCompact = header.classList.contains("is-compact");

		if (!isCompact && window.scrollY > compactAfter) {
			header.classList.add("is-compact");
		} else if (isCompact && window.scrollY < expandBefore) {
			header.classList.remove("is-compact");
		}
	};

  
/* ---------- Middle bar size ---------- */
	window.addEventListener("scroll", updateHeader, { passive: true });
	updateHeader();
}
/*
toggle : ID of the toggle element, for exemple "all-filters-toggle"
content : element ID with variable height, for exemple "filters-block"
*/
const heightTransitionHandlers = new WeakMap();

window.changeHeight = (toggle, content) => {
	if (!toggle || !content) return;

	const previousHandler = heightTransitionHandlers.get(content);
	if (previousHandler) {
		content.removeEventListener("transitionend", previousHandler);
		heightTransitionHandlers.delete(content);
	}

	if (toggle.classList.contains("is-active")) {
		const currentHeight = content.getBoundingClientRect().height;
		content.style.height = "auto";
		const targetHeight = content.getBoundingClientRect().height;
		content.style.height = `${currentHeight}px`;
		content.offsetHeight;
		requestAnimationFrame(() => {
			content.style.height = `${targetHeight}px`;
		});

		const transitionHandler = (event) => {
			if (event.target !== content || event.propertyName !== "height") return;

			content.removeEventListener("transitionend", transitionHandler);
			heightTransitionHandlers.delete(content);
			if (toggle.classList.contains("is-active")) {
				content.style.height = "auto";
			}
		};

		content.addEventListener("transitionend", transitionHandler);
		heightTransitionHandlers.set(content, transitionHandler);
	} else {
		content.style.height = `${content.getBoundingClientRect().height}px`;
		requestAnimationFrame(() => {
			content.style.height = "0px";
		});
	}
};

/* ---------- Get Language ---------- */
const supportedLanguages = ["fr", "en", "de", "ja"];

function detectBrowserLanguage() {
	for (const browserLanguage of navigator.languages ?? [navigator.language]) {
		const language = browserLanguage.toLowerCase().split("-")[0];
		if (supportedLanguages.includes(language)) return language;
	}

	return "en";
}

function getSavedLanguage() {
	try {
		const savedLanguage = localStorage.getItem("frames-xiv-language");
		return supportedLanguages.includes(savedLanguage) ? savedLanguage : null;
	} catch {
		return null;
	}
}

/* ---------- Change Language ---------- */
function getTranslation(dictionary, key) {
	return key.split(".").reduce((value, part) => value?.[part], dictionary);
}

let uiTranslations;

window.changeLanguage = async (language) => {
	if (!supportedLanguages.includes(language)) return;

	try {
		if (!uiTranslations) {
			const response = await fetch("./data/ui.json");
			if (!response.ok) throw new Error("Could not load data/ui.json");
			uiTranslations = await response.json();
		}

		document.querySelectorAll("[data-i18n]").forEach((element) => {
			const translations = getTranslation(uiTranslations, element.dataset.i18n);
			const translation = translations?.[language];
			if (typeof translation === "string") element.textContent = translation;
		});
		document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
			const translations = getTranslation(uiTranslations, element.dataset.i18nPlaceholder);
			const translation = translations?.[language];
			if (typeof translation === "string") element.placeholder = translation;
		});

		document.documentElement.lang = language;
		const languageLabel = document.getElementById("lang-on");
		if (languageLabel) languageLabel.textContent = language.toUpperCase();
		window.dispatchEvent(new CustomEvent("site-language-change", {
			detail: { language }
		}));

		try {
			localStorage.setItem("frames-xiv-language", language);
		} catch {
			// Language changes still work when storage is unavailable.
		}
	} catch (error) {
		console.error("Language change failed:", error);
	}
};

document.querySelectorAll("#lang-menu [data-language]").forEach((option) => {
	option.addEventListener("click", () => {
		window.changeLanguage(option.dataset.language);
	});
});

window.changeLanguage(getSavedLanguage() ?? detectBrowserLanguage());