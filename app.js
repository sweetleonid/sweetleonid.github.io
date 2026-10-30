const categoryNames = {
    epidemic: "Происшествия",
    creature: "Животный мир",
    natural: "Погода и природа",
    social: "Город и общество",
    tech: "Технологии",
    other: "Городская хроника"
};

const seededArticles = Array.isArray(articles) ? articles : [];

let activeCategory = "all";

function getArticleTimestamp(date) {
    const monthNumbers = {
        "января": 0,
        "февраля": 1,
        "марта": 2,
        "апреля": 3,
        "мая": 4,
        "июня": 5,
        "июля": 6,
        "августа": 7,
        "сентября": 8,
        "октября": 9,
        "ноября": 10,
        "декабря": 11
    };
    const match = String(date || "").trim().toLowerCase()
        .match(/^(\d{1,2})\s+([а-яё]+)\s+(\d{4})$/);

    if (!match || monthNumbers[match[2]] === undefined) return 0;

    return Date.UTC(Number(match[3]), monthNumbers[match[2]], Number(match[1]));
}

function getArticles() {
    return seededArticles
        .map((article, index) => ({ article, index }))
        .sort((a, b) => getArticleTimestamp(b.article.date) - getArticleTimestamp(a.article.date) || a.index - b.index)
        .map(({ article }) => article);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getExcerpt(content, limit = 155) {
    const text = String(content || "").replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

function renderHome() {
    const allArticles = getArticles().filter((article) =>
        activeCategory === "all" || article.category === activeCategory
    );
    const grid = document.getElementById("articles-grid");

    if (!allArticles.length) {
        grid.innerHTML = '<p class="empty-state">В этой рубрике пока нет публикаций.</p>';
        return;
    }

    grid.innerHTML = allArticles.map((article) => `
        <article class="article-card" data-article-id="${escapeHtml(article.id)}" tabindex="0" role="button" aria-label="Открыть статью: ${escapeHtml(article.title)}">
            <span class="category-badge">${escapeHtml(categoryNames[article.category] || categoryNames.other)}</span>
            <h3>${escapeHtml(article.title)}</h3>
            <p class="excerpt">${escapeHtml(getExcerpt(article.content))}</p>
            <div class="meta"><span>${escapeHtml(article.date || "Дата уточняется")}</span><span>ЧИТАТЬ →</span></div>
        </article>`).join("");
}

function renderCategories() {
    const categories = [...new Set(getArticles().map((article) => article.category))]
        .filter((category) => categoryNames[category]);
    const categoryNav = document.getElementById("category-nav");

    categoryNav.innerHTML = categories.map((category) => `
        <button type="button" class="nav-link" data-category="${escapeHtml(category)}" aria-pressed="false">
            ${escapeHtml(categoryNames[category])}
        </button>`).join("");
}

function selectCategory(category) {
        activeCategory = category;
        document.querySelectorAll("[data-category]").forEach((button) => {
            const isActive = button.dataset.category === activeCategory;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
        renderHome();
}

function openArticle(articleId) {
    const article = getArticles().find((item) => String(item.id) === String(articleId));
    if (!article) return;

    const articleContainer = document.getElementById("article-full");
    articleContainer.innerHTML = `
        <div class="article-category">${escapeHtml(categoryNames[article.category] || categoryNames.other)}</div>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="article-deck">${escapeHtml(getExcerpt(article.content, 210))}</p>
        <div class="article-meta">${escapeHtml(article.date || "Дата уточняется")} · Корреспондент Бобровского Феномена</div>
        <p class="fiction-disclaimer">Будьте здоровы.</p>
        <div class="article-content">${escapeHtml(article.content)}</div>
        ${article.consequences ? `<section class="consequences"><h3>Что было дальше</h3><p>${escapeHtml(article.consequences)}</p></section>` : ""}`;
    showPage("article");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showPage(pageName) {
    document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
    const page = document.getElementById(`${pageName}-page`);
    if (page) page.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const pageLink = target?.closest("[data-page]");
    if (pageLink) {
        event.preventDefault();
        if (pageLink.dataset.page === "home") selectCategory("all");
        showPage(pageLink.dataset.page);
        return;
    }
    const categoryButton = target?.closest("[data-category]");
    if (categoryButton) {
        selectCategory(categoryButton.dataset.category);
        showPage("home");
        return;
    }
    const articleCard = target?.closest("[data-article-id]");
    if (articleCard) openArticle(articleCard.dataset.articleId);
});

document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target instanceof Element &&
        event.target.matches("[data-article-id]")) {
        event.preventDefault();
        openArticle(event.target.dataset.articleId);
    }
});

renderCategories();
renderHome();
