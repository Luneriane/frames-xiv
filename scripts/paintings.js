const allFiltersToggle = document.getElementById("all-filters-toggle")
const filtersBlock = document.getElementById("filters-block")
const toggleBlock = document.getElementsByClassName("toggle-block")
const expToggle = document.getElementById("exp-toggle")
const areaToggle = document.getElementById("area-toggle")
const expList = document.getElementById("exp-list")
const areaList = document.getElementById("area-list")
const gallery = document.getElementById("gallery")
const modal = document.getElementById("modal")
const modalCard = document.getElementById("modal-card")
const modalClose = document.getElementById("modal-close")
let paintingsDataCache
let uiDataCache
let paintingUiCache
let activePainting
let currentLanguage = document.documentElement.lang || "en"

function localizedText(values, language) {
  return values?.[language] ?? values?.en ?? ""
}

/* ---------- Middle-bar Height---------- */
Array.from(toggleBlock).forEach(function(element) {
  element.addEventListener('click', () =>
    element.classList.toggle("is-active")
  );
});

if (allFiltersToggle && filtersBlock) {
  allFiltersToggle.addEventListener("click", () => {
    window.changeHeight(allFiltersToggle, filtersBlock)
  })
}
if (expToggle && expList) {
  expToggle.addEventListener("click", () => {
    window.changeHeight(expToggle, expList)
  })
}
if (areaToggle && areaList) {
  areaToggle.addEventListener("click", () => {
    window.changeHeight(areaToggle, areaList)
  })
}

/* ---------- Middle-bar options ---------- */
async function loadFilterOptions() {
  if (!expList || !areaList) return

  try {
    const [uiResponse, dataResponse, paintingUiResponse] = await Promise.all([
      fetch("./data/ui.json"),
      fetch("./data/paintings-data.json"),
      fetch("./data/paintings-ui.json")
    ])
    if (!uiResponse.ok || !dataResponse.ok || !paintingUiResponse.ok) {
      throw new Error("Impossible de charger les données des filtres.")
    }

    const [ui, paintingsData, paintingUi] = await Promise.all([
      uiResponse.json(),
      dataResponse.json(),
      paintingUiResponse.json()
    ])
    uiDataCache = ui
    paintingsDataCache = paintingsData
    paintingUiCache = paintingUi

  const renderOptions = (list, entries, imagePath, language) => {
  const selectedIds = new Set(
    [...list.querySelectorAll(".filter-icon.is-active")]
      .map((image) => image.dataset.filterId)
  )
  const ids = Object.keys(entries)
  if (imagePath.endsWith("/areas")) {
    ids.sort((left, right) => Number(left) - Number(right))
  }

  list.replaceChildren(...ids.map((id) => {
    const item = document.createElement("li")
    const image = document.createElement("img")
    const localizedName = entries[id]?.[language] ?? entries[id]?.en ?? id

    image.src = `${imagePath}/${id}.png`
    image.alt = localizedName
    image.className = "filter-icon"
    image.dataset.filterId = id
    if (selectedIds.has(id)) image.classList.add("is-active")

    image.addEventListener("click", () => {
      image.classList.toggle("is-active")
      renderGallery(currentLanguage)
    })

    item.append(image)
    return item
  }))
}

    const renderLocalizedOptions = (language) => {
      currentLanguage = language
      renderOptions(expList, ui.expansions, "./assets/icons/expansions", language)
      renderOptions(areaList, paintingsData.areas, "./assets/icons/areas", language)
      renderGallery(language)
      if (activePainting) openPaintingModal(activePainting, language)
    }

    renderLocalizedOptions(document.documentElement.lang || "en")
    window.addEventListener("site-language-change", (event) => {
    renderLocalizedOptions(event.detail.language)
  })
  } catch (error) {
    console.error("Chargement des filtres impossible :", error)
  }
}

loadFilterOptions()

/* ---------- Painting cards ---------- */

function createCard(painting, language) {
  const card = document.createElement("article")
  card.className = "card"
  card.tabIndex = 0
  card.setAttribute("role", "button")
  card.setAttribute("aria-haspopup", "dialog")
  card.dataset.paintingId = painting.id

  const title = localizedText(painting.name, language)
  const image = document.createElement("img")
  image.src = `./assets/landscapes/${painting.id}.png`
  image.alt = title
  image.className = "card-img"
  card.append(image)

  const titleElement = document.createElement("span")
  titleElement.className = "frame-title"
  titleElement.textContent = title
  card.append(titleElement)

  const info = document.createElement("span")
  info.className = "card-info"
  const expansionIcon = document.createElement("img")
  expansionIcon.src = `./assets/icons/expansions/${painting.extension}.png`
  expansionIcon.alt = ""
  expansionIcon.className = "card-icon"
  const area = paintingsDataCache.areas[painting.area]
  const areaName = document.createElement("span")
  areaName.className = "card-text"
  areaName.textContent = localizedText(area, language)
  info.append(expansionIcon, areaName)
  card.append(info)

  const open = () => openPaintingModal(painting, language)
  card.addEventListener("click", open)
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      open()
    }
  })
  return card
}

function unlockLinks(index, painting, lang){
  if (!painting) return null
  
  const liE = document.createElement("li")
  const icon = document.createElement("img")
  const link = document.createElement("a")
  const label = paintingsDataCache[painting.unlocks[index].type][painting.unlocks[index].id].name[lang]
  const category = painting.unlocks[index].type
  const lodestoneId = paintingsDataCache[painting.unlocks[index].type][painting.unlocks[index].id].lodestoneId
  let language = ""

  switch (lang) {
    case "en":
      language = "eu"
    case "ja":
      language = "jp"
    default :
    language = lang
  }

  const src = "./assets/icons/" + category + ".png"
  icon.setAttribute("src", src)
  icon.classList.add("modal-icon")
  liE.append(icon)

  link.href = `https://${language}.finalfantasyxiv.com/lodestone/playguide/db/${category}/${lodestoneId}/`
  link.target = "_blank"
  link.rel = "noopener noreferrer"
  link.textContent = label
  link.classList.add("eorzeadb_link")
  liE.append(link)

  return liE
}  

function createLink(label, painting, lang) {
  if (!label) return null

  const liE = document.createElement("li")
  const icon = document.createElement("img")
  const src = "./assets/icons/links/" + label + ".png"
  const link = document.createElement("a")
  const lodestoneId = painting.lodestoneId
  const itemId = painting.id

  let language = ""
  switch (lang) {
    case "en":
      language = "eu"
    case "ja":
      language = "jp"
    default :
    language = lang
  }
  console.log(label)

  switch (label){
    case "lodestone" :
      link.href = `https://${language}.finalfantasyxiv.com/lodestone/playguide/db/item/${lodestoneId}/`
      link.classList.add("eorzeadb_link")      
      console.log(link.href)
      break

    case "garlandDB":
      link.href = "https://www.garlandtools.org/db/#item/" + itemId
      console.log(link.href)
      break
    case "teamcraft":
      link.href = `https://ffxivteamcraft.com/db/${language}/item/${itemId}`
      console.log(link.href)
      break
    default:
      console.log("default")
      break

  }
  icon.setAttribute("src", src)
  icon.classList.add("modal-icon")
  liE.append(icon)

  link.target = "_blank"
  link.rel = "noopener noreferrer"  
  link.textContent = label
  liE.append(link)

  console.log(liE)

  return liE

}

function getActiveFilterIds(list) {
  return new Set(
    [...list.querySelectorAll(".filter-icon.is-active")]
      .map((image) => image.dataset.filterId)
  )
}

function renderGallery(language) {
  if (!gallery || !paintingsDataCache) return

  const activeExp = expList ? getActiveFilterIds(expList) : new Set()
  const activeArea = areaList ? getActiveFilterIds(areaList) : new Set()

  const filtered = paintingsDataCache.paintings.filter((painting) => {
    const matchesExp = activeExp.size === 0 || activeExp.has(painting.extension)
    const matchesArea = activeArea.size === 0 || activeArea.has(painting.area)
    return matchesExp && matchesArea
  })

  gallery.replaceChildren(...filtered.map((painting) => createCard(painting, language)))
}

/* ---------- Modal ---------- */
function openPaintingModal(painting, language) {
  if (!modal || !modalCard) return
  activePainting = painting

  const title = localizedText(painting.name, language)
  const expansion = localizedText(uiDataCache.expansions[painting.extension], language)
  const area = localizedText(paintingsDataCache.areas[painting.area], language)
  const modalImage = document.getElementById("modal-img")
  modalImage.src = `./assets/landscapes/${painting.id}.png`
  modalImage.alt = title

  document.querySelector("#modal-info h2").textContent = title

  const expansionSection = document.getElementById("modal-exp")
  expansionSection.querySelector("h3").textContent = localizedText(paintingUiCache.expansionLabel, language)
  expansionSection.querySelector("img").src = `./assets/icons/expansions/${painting.extension}.png`
  expansionSection.querySelector("img").alt = ""
  expansionSection.querySelector("span").textContent = expansion

  const areaSection = document.getElementById("modal-area")
  areaSection.querySelector("h3").textContent = localizedText(paintingUiCache.areaLabel, language)
  areaSection.querySelector("img").src = `./assets/icons/areas/${painting.area}.png`
  areaSection.querySelector("img").alt = ""
  areaSection.querySelector("span").textContent = area

  const unlockList = document.getElementById("modal-unlock")
  unlockList.querySelector("h3").textContent = localizedText(paintingUiCache.unlockLabel, language)
  unlockList.querySelectorAll("li").forEach((item) => item.remove())

  
  for (const unlock in painting.unlocks){
    const liEl = unlockLinks(unlock, painting, language)
    unlockList.append(liEl)
  }

  const linksList = document.getElementById("modal-links")
  linksList.querySelector("h3").textContent = localizedText(paintingUiCache.linksLabel, language)
  linksList.querySelectorAll("li").forEach((item) => item.remove())

  const lodestoneLink = createLink("lodestone", painting, language)
  const garldandLink = createLink("garlandDB", painting, language)
  const teamcraftLink = createLink("teamcraft", painting, language)
  
  linksList.append(lodestoneLink)
  linksList.append(garldandLink)
  linksList.append(teamcraftLink)

  modal.classList.add("is-active")
  modal.setAttribute("aria-hidden", "false")
}

function closePaintingModal() {
  if (!modal) return
  modal.classList.remove("is-active")
  modal.setAttribute("aria-hidden", "true")
  activePainting = null
}

modalClose?.addEventListener("click", closePaintingModal)
modal?.addEventListener("click", (event) => {
  if (event.target === modal) closePaintingModal()
})
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal?.classList.contains("is-active")) {
    closePaintingModal()
  }
})