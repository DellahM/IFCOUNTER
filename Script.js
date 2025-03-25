// Add this at the very top
console.log("Script loaded successfully!");

// Path configuration for GitHub Pages
const isGitHubPages = window.location.host.includes('github.io');
const repoName = 'IFCOUNTER'; // MUST match your repository name exactly

function getCorrectPath(path) {
    return isGitHubPages ? `/${repoName}${path}` : path;
}

// Example usage for service worker:
if ('serviceWorker' in navigator) {
    const swPath = getCorrectPath('/sw.js');
    navigator.serviceWorker.register(swPath)
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.log('Service Worker failed', err));
}

// Rest of your JavaScript code...