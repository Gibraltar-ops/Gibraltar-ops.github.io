// Scrollspy for the start page: highlights the nav link of the section currently in view.
// Loaded only on the start page (see _layouts/default.html).
(function () {
    // Nav links that point to a section on the start page, e.g. "/#skills" or "#contact".
    const links = Array.from(document.querySelectorAll('.nav-links a'))
        .filter(link => link.hash && document.getElementById(link.hash.slice(1)));

    // The matching sections, sorted in the order they appear on the page.
    const sections = links
        .map(link => document.getElementById(link.hash.slice(1)))
        .sort((a, b) => a.offsetTop - b.offsetTop);

    const header = document.querySelector('.main-header');
    let ticking = false;

    function setActive(id) {
        links.forEach(link => {
            const isActive = link.hash === '#' + id;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    function update() {
        ticking = false;

        // A section counts as "in view" once its top passes a line
        // 30% down the visible area below the sticky header.
        const line = window.scrollY + header.offsetHeight + window.innerHeight * 0.3;
        let current = null;
        for (const section of sections) {
            if (section.offsetTop <= line) {
                current = section.id;
            }
        }

        // At the very bottom the last section (Contact) may never reach the line.
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        if (atBottom && sections.length > 0) {
            current = sections[sections.length - 1].id;
        }

        setActive(current);
    }

    // requestAnimationFrame keeps the work to at most once per frame while scrolling.
    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
})();
