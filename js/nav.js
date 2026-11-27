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
    let clickedId = null;    // section chosen by a nav click, wins until the jump is done
    let clickTimer = null;

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

        // A nav link was just clicked: keep that link active while the page jumps.
        // Needed for short sections at the bottom (About, Contact) that can never
        // scroll far enough up to pass the line below.
        if (clickedId) {
            setActive(clickedId);
            return;
        }

        // A section counts as "in view" once its top passes a line
        // 30% down the visible area below the sticky header.
        const line = window.scrollY + header.offsetHeight + window.innerHeight * 0.3;
        let current = null;
        for (const section of sections) {
            if (section.offsetTop <= line) {
                current = section.id;
            }
        }

        setActive(current);
    }

    // Clicking a nav link marks it right away. The mark is released on the first
    // scroll made by the user (wheel, touch or keys) after the jump has finished.
    links.forEach(link => {
        link.addEventListener('click', () => {
            clickedId = link.hash.slice(1);
            setActive(clickedId);
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => {
                const release = () => {
                    clickedId = null;
                    update();
                };
                ['wheel', 'touchmove', 'keydown'].forEach(type =>
                    window.addEventListener(type, release, { once: true, passive: true }));
            }, 600); // smooth jumps finish well within this time
        });
    });

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
