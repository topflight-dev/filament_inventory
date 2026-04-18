const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('dev') === 'true') {
    localStorage.setItem('developer_mode', 'true');
    alert('Developer Mode Activated: Your visits will no longer be tracked.');
}

const isDeveloper = localStorage.getItem('developer_mode') === 'true';
const hasBeenTracked = sessionStorage.getItem('visited_this_session');

if (!isDeveloper && !hasBeenTracked) {
    fetch('https://filament-inventory.onrender.com/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: window.location.pathname })
    })
    .then(() => {
        sessionStorage.setItem('visited_this_session', 'true');
    })
    .catch(err => console.log("Tracking skipped"));
}