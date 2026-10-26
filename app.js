const categoryNames = {
    epidemic: "Происшествия",
    creature: "Животный мир",
    natural: "Погода и природа",
    social: "Город и общество",
    tech: "Технологии",
    other: "Городская хроника"
};

const storedArticlesKey = "bobrovsky-phenomenon-articles";
const seededArticles = Array.isArray(articles) ? articles : [];
let userArticles = [];

try {
    const savedArticles = JSON.parse(localStorage.getItem(storedArticlesKey) || "[]");
    if (Array.isArray(savedArticles)) userArticles = savedArticles;
} catch (error) {
    console.error("Не удалось прочитать сохранённые публикации.", error);
}

function getArticles() {
    return [...userArticles, ...seededArticles];
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
    const allArticles = getArticles();
    const featured = allArticles[0];
    const featureContainer = document.getElementById("featured-article");
    const grid = document.getElementById("articles-grid");
    const latestSection = document.querySelector(".latest-section");

    if (!featured) {
        featureContainer.innerHTML = '<p class="empty-state">Пока нет публикаций. Предложите первую новость для хроники.</p>';
        grid.innerHTML = "";
        return;
    }

    featureContainer.innerHTML = `
        <article class="featured-card" data-article-id="${escapeHtml(featured.id)}" tabindex="0" role="button" aria-label="Открыть статью: ${escapeHtml(featured.title)}">
            <div class="featured-image">
                <div class="featured-image-content">
                    <span class="featured-label">ИЗ АРХИВА · ${escapeHtml(categoryNames[featured.category] || categoryNames.other)}</span>
                    <h1>${escapeHtml(featured.title)}</h1>
                    <p class="featured-summary">${escapeHtml(getExcerpt(featured.content, 180))}</p>
                    <div class="featured-meta">
                        <span>${escapeHtml(featured.date || "Дата уточняется")}</span>
                        <span class="meta-separator" aria-hidden="true"></span>
                        <span>Корреспондент БФ</span>
                        <span class="featured-read">ЧИТАТЬ МАТЕРИАЛ →</span>
                    </div>
                </div>
            </div>
        </article>`;

    grid.innerHTML = allArticles.slice(1).map((article) => `
        <article class="article-card" data-article-id="${escapeHtml(article.id)}" tabindex="0" role="button" aria-label="Открыть статью: ${escapeHtml(article.title)}">
            <span class="category-badge">${escapeHtml(categoryNames[article.category] || categoryNames.other)}</span>
            <h3>${escapeHtml(article.title)}</h3>
            <p class="excerpt">${escapeHtml(getExcerpt(article.content))}</p>
            <div class="meta"><span>${escapeHtml(article.date || "Дата уточняется")}</span><span>ЧИТАТЬ →</span></div>
        </article>`).join("");
    latestSection.hidden = allArticles.length < 2;
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

    document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.toggle("active", pageName === "home" && link.textContent.trim() === "Главное");
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (event) => {
    const pageLink = event.target.closest("[data-page]");
    if (pageLink) {
        event.preventDefault();
        showPage(pageLink.dataset.page);
        return;
    }
    const articleCard = event.target.closest("[data-article-id]");
    if (articleCard) openArticle(articleCard.dataset.articleId);
});

document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-article-id]")) {
        event.preventDefault();
        openArticle(event.target.dataset.articleId);
    }
});

document.getElementById("article-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const newArticle = {
        id: `user-${Date.now()}`,
        title: document.getElementById("title").value.trim(),
        emoji: "📰",
        date: document.getElementById("date").value.trim() || "Дата уточняется",
        category: document.getElementById("category").value,
        content: document.getElementById("content").value.trim(),
        consequences: document.getElementById("consequences").value.trim()
    };
    if (!newArticle.title || !newArticle.content) return;

    userArticles.unshift(newArticle);
    try {
        localStorage.setItem(storedArticlesKey, JSON.stringify(userArticles));
    } catch (error) {
        userArticles.shift();
        console.error("Не удалось сохранить публикацию в этом браузере.", error);
        window.alert("Не удалось сохранить публикацию. Проверьте настройки хранилища браузера и попробуйте ещё раз.");
        return;
    }
    form.reset();
    renderHome();
    showPage("home");
});

renderHome();
