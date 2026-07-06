/* ═══════════════════════════════════════════════════════════
   SBE Cable Tray Rate Calculator — Application Logic
   ═══════════════════════════════════════════════════════════ */

(() => {
    'use strict';

    // ── Configuration ─────────────────────────────────────────
    // When served by the same Express server, use relative paths (empty string).
    // For separate frontend dev server, override with window.API_BASE_URL.
    const API_BASE = window.API_BASE_URL || '';

    const API = {
        featuredRates: `${API_BASE}/api/featured-rates`,
        calculate: `${API_BASE}/api/calculate`,
        listTrays: `${API_BASE}/api/trays`,
    };

    // ── DOM References ────────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        nav: $('#main-nav'),
        navLinks: $('#nav-links'),
        navBurger: $('#nav-burger'),
        featuredGrid: $('#featured-grid'),
        calcForm: $('#calc-form'),
        calcSubmit: $('#calc-submit'),
        calcBtnText: $('#calc-btn-text'),
        calcSpinner: $('#calc-spinner'),
        resultCard: $('#result-card'),
        resultTitle: $('#result-title'),
        resultDims: $('#result-dims'),
        resultFinalRate: $('#result-final-rate'),
        resultCoverRate: $('#result-cover-rate'),
        coverRateBlock: $('#cover-rate-block'),
        resultReset: $('#result-reset'),
        historyTable: $('#history-table'),
        historyTbody: $('#history-tbody'),
        historyLoading: $('#history-loading'),
        historyEmpty: $('#history-empty'),
        historyRefresh: $('#history-refresh'),
        historyCount: $('#history-count'),
        toastContainer: $('#toast-container'),
    };

    // ── Toast Notification System ─────────────────────────────
    function showToast(message, type = 'success', duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        const icon = type === 'success' ? '✓' : '✕';
        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        dom.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast--exit');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }

    // ── API Helper ────────────────────────────────────────────
    async function apiFetch(url, options = {}) {
        try {
            const res = await fetch(url, {
                headers: { 'Content-Type': 'application/json' },
                ...options,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                throw new Error('Cannot reach the backend. Is it running?');
            }
            throw err;
        }
    }

    // ── Navigation ────────────────────────────────────────────
    function initNav() {
        // Scroll effect
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    dom.nav.classList.toggle('nav--scrolled', window.scrollY > 40);
                    updateActiveNavLink();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Burger toggle
        dom.navBurger.addEventListener('click', () => {
            dom.navBurger.classList.toggle('nav__burger--open');
            dom.navLinks.classList.toggle('nav__links--open');
        });

        // Close mobile nav on link click
        $$('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                dom.navBurger.classList.remove('nav__burger--open');
                dom.navLinks.classList.remove('nav__links--open');
            });
        });
    }

    function updateActiveNavLink() {
        const sections = ['hero', 'featured', 'calculator', 'history', 'about'];
        const scrollPos = window.scrollY + 200;

        let current = 'hero';
        for (const id of sections) {
            const section = document.getElementById(id);
            if (section && section.offsetTop <= scrollPos) {
                current = id;
            }
        }

        // Map featured to hero for nav highlight
        const navTarget = current === 'featured' ? 'hero' : current;

        $$('.nav__link').forEach(link => {
            const isActive = link.dataset.section === navTarget;
            link.classList.toggle('nav__link--active', isActive);
        });
    }

    // ── Reveal on Scroll ──────────────────────────────────────
    function initReveal() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal--visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );

        $$('.reveal').forEach(el => observer.observe(el));
    }

    // ── Featured Rates ────────────────────────────────────────
    async function loadFeaturedRates() {
        try {
            const data = await apiFetch(API.featuredRates);
            renderFeaturedCards(data);
        } catch (err) {
            dom.featuredGrid.innerHTML = `
                <div class="featured__loading">
                    <p style="color: var(--accent-rose);">⚠ ${err.message}</p>
                    <button class="btn btn--ghost btn--sm" style="margin-top: 1rem;" onclick="location.reload()">Retry</button>
                </div>`;
        }
    }

    function renderFeaturedCards(data) {
        const variants = {
            'Cable Tray': { class: 'cable', icon: '🔲' },
            'Ladder': { class: 'ladder', icon: '🪜' },
            'Raceway': { class: 'raceway', icon: '📦' },
        };

        const cards = data.items.map((item, i) => {
            const v = variants[item.type] || variants['Cable Tray'];
            const coverHtml = item.coverRate
                ? `<div class="featured__card-cover">Cover Rate: <span>₹ ${item.coverRate}</span> + GST</div>`
                : '';

            return `
                <div class="featured__card featured__card--${v.class} reveal" style="animation-delay: ${i * 100}ms">
                    <div class="featured__card-content">
                        <span class="featured__card-badge">${v.icon} ${item.type}</span>
                        <h3 class="featured__card-title">${item.title}</h3>
                        <p class="featured__card-dims">${data.width}mm × ${data.height}mm × ${data.thickness}mm</p>
                        <div class="featured__card-price">₹ ${item.price}</div>
                        <span class="featured__card-gst">+ GST Extra</span>
                        ${coverHtml}
                    </div>
                </div>`;
        }).join('');

        dom.featuredGrid.innerHTML = cards;

        // Re-observe newly added reveal elements
        setTimeout(() => initReveal(), 50);
    }

    // ── Calculator ────────────────────────────────────────────
    function initCalculator() {
        dom.calcForm.addEventListener('submit', handleCalculate);
        dom.resultReset.addEventListener('click', resetCalculator);
    }

    async function handleCalculate(e) {
        e.preventDefault();

        const formData = new FormData(dom.calcForm);
        const payload = {
            type: formData.get('type'),
            width: parseFloat(formData.get('width')),
            height: parseFloat(formData.get('height')),
            thickness: parseFloat(formData.get('thickness')),
            save: formData.get('save') === 'on',
        };

        // Validate
        if (!payload.type || isNaN(payload.width) || isNaN(payload.height) || isNaN(payload.thickness)) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (payload.width <= 0 || payload.height <= 0 || payload.thickness <= 0) {
            showToast('Dimensions must be positive values', 'error');
            return;
        }

        // Show loading
        dom.calcSubmit.classList.add('btn--loading');
        dom.calcSubmit.disabled = true;

        try {
            const result = await apiFetch(API.calculate, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            showResult(result);

            if (payload.save) {
                showToast('Calculation saved to database!', 'success');
                // Refresh history in background
                loadHistory();
            } else {
                showToast('Rate calculated successfully!', 'success');
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            dom.calcSubmit.classList.remove('btn--loading');
            dom.calcSubmit.disabled = false;
        }
    }

    function showResult(tray) {
        dom.calcForm.style.display = 'none';
        dom.resultCard.classList.add('result-card--visible');

        dom.resultTitle.textContent = `${tray.type} Cable Tray`;
        dom.resultDims.innerHTML = `
            <span class="result-card__dim"><strong>Width:</strong> ${tray.width} mm</span>
            <span class="result-card__dim"><strong>Height:</strong> ${tray.height} mm</span>
            <span class="result-card__dim"><strong>Thickness:</strong> ${tray.thickness} mm</span>
        `;

        // Animate the rate number
        animateValue(dom.resultFinalRate, tray.finalRate);

        if (tray.coverRate && tray.coverRate > 0) {
            dom.coverRateBlock.style.display = 'block';
            animateValue(dom.resultCoverRate, tray.coverRate);
        } else {
            dom.coverRateBlock.style.display = 'none';
        }
    }

    function animateValue(el, target) {
        const duration = 800;
        const startTime = performance.now();
        const start = 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (target - start) * eased);
            el.textContent = `₹ ${current.toLocaleString('en-IN')}`;
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    }

    function resetCalculator() {
        dom.resultCard.classList.remove('result-card--visible');
        dom.calcForm.style.display = 'block';
        dom.calcForm.reset();
    }

    // ── History ───────────────────────────────────────────────
    async function loadHistory() {
        dom.historyLoading.style.display = 'block';
        dom.historyTable.style.display = 'none';
        dom.historyEmpty.style.display = 'none';

        try {
            const data = await apiFetch(API.listTrays);
            const trays = data.trays || [];

            dom.historyCount.textContent = `${trays.length} record${trays.length !== 1 ? 's' : ''}`;

            if (trays.length === 0) {
                dom.historyLoading.style.display = 'none';
                dom.historyEmpty.style.display = 'flex';
                return;
            }

            renderHistoryTable(trays);
        } catch (err) {
            dom.historyLoading.innerHTML = `
                <p style="color: var(--accent-rose);">⚠ ${err.message}</p>`;
        }
    }

    function getTypeBadgeClass(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('ladder')) return 'type-badge--ladder';
        if (t.includes('raceway')) return 'type-badge--raceway';
        return 'type-badge--cable';
    }

    function renderHistoryTable(trays) {
        dom.historyTbody.innerHTML = trays.map((tray, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><span class="type-badge ${getTypeBadgeClass(tray.type)}">${tray.type || '—'}</span></td>
                <td>${tray.width ?? '—'} mm</td>
                <td>${tray.height ?? '—'} mm</td>
                <td>${tray.thickness ?? '—'} mm</td>
                <td class="rate-cell">₹ ${tray.finalRate ?? '—'}</td>
                <td>${tray.coverRate ? `₹ ${tray.coverRate}` : '—'}</td>
            </tr>
        `).join('');

        dom.historyLoading.style.display = 'none';
        dom.historyTable.style.display = 'table';
    }

    function initHistory() {
        dom.historyRefresh.addEventListener('click', () => {
            showToast('Refreshing records...', 'success');
            loadHistory();
        });
    }

    // ── Smooth Scroll for anchors ─────────────────────────────
    function initSmoothScroll() {
        $$('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ── Initialize ────────────────────────────────────────────
    function init() {
        initNav();
        initReveal();
        initSmoothScroll();
        initCalculator();
        initHistory();

        // Load data
        loadFeaturedRates();
        loadHistory();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
