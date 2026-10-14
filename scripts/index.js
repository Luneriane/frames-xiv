const changelogElement = document.getElementById("changelog");
let changelogEntries = [];

function formatChangelogDate(date, language) {
	const localDate = new Date(
		Number(date.year),
		Number(date.month) - 1,
		Number(date.day),
		12
	);

	return new Intl.DateTimeFormat(language, {
		day: "numeric",
		month: "long",
		year: "numeric"
	}).format(localDate);
}

function renderChangelogDates(language) {
	changelogElement.querySelectorAll(".change-item time[data-date]").forEach((dateElement) => {
		const date = JSON.parse(dateElement.dataset.date);
		dateElement.textContent = formatChangelogDate(date, language);
	});

	changelogElement.querySelectorAll(".change-item").forEach((card, cardIndex) => {
		card.querySelectorAll(".change-list li").forEach((item, itemIndex) => {
			const change = changelogEntries[cardIndex]?.changes[itemIndex];
			if (change) item.textContent = change[language] ?? change.en ?? "";
		});
	});
}

async function loadChangelog() {
	if (!changelogElement) return;

	try {
		const response = await fetch("./data/changelog.json");
		if (!response.ok) throw new Error("Could not load changelog.json");

		changelogEntries = await response.json();
		const cards = changelogEntries.map((entry) => {
			const card = document.createElement("article");
			card.className = "change-item";

			const date = document.createElement("h3");
			const time = document.createElement("time");
			time.dateTime = `${entry.date.year}-${entry.date.month}-${entry.date.day}`;
			time.dataset.date = JSON.stringify(entry.date);
			date.append(time);
			card.append(date);

			const list = document.createElement("ul");
			list.className = "change-list";
			entry.changes.forEach((change) => {
				const item = document.createElement("li");
				item.textContent = change[document.documentElement.lang] ?? change.en ?? "";
				list.append(item);
			});
			card.append(list);
			return card;
		});

		changelogElement.replaceChildren(...cards);
		renderChangelogDates(document.documentElement.lang);
	} catch (error) {
		console.error("Changelog loading failed:", error);
	}
}

if (changelogElement) {
	loadChangelog();
	window.addEventListener("site-language-change", (event) => {
		renderChangelogDates(event.detail.language);
	});
}
