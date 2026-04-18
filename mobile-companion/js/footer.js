const currentVersion = "1.8.0";

function injectTracker() {
    const script = document.createElement('script');
    script.src = `js/tracker.js?v=${currentVersion}`;
    document.head.appendChild(script);
}
injectTracker();

function loadGlobalFooter() {
    const versionText = `v${currentVersion}`
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString(undefined, options);

    const footerHTML = `
        <footer style="text-align: center; padding: 30px; margin-top: 50px; border-top: 1px solid #eee; color: #777; font-size: 0.85em; font-family: 'Inter', sans-serif;">
            <p>© ${now.getFullYear()} C3DW | <span style="color: #bbb;">${versionText}</span> | Last Updated: ${dateString}</p>
        </footer>
        `;

    document.body.insertAdjacentHTML('beforeend', footerHTML);
}

const versionDisplay = document.getElementById('version-display');
if (versionDisplay) versionDisplay.textContent = `v${currentVersion}`;

window.addEventListener("DOMContentLoaded", loadGlobalFooter);