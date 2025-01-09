const tooltip = document.getElementById('tooltip');

// Example: Display satellite info when hovering over an object
function showTooltip(content, x, y) {
    tooltip.innerHTML = content;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.display = 'block';
}

function hideTooltip() {
    tooltip.style.display = 'none';
}

// Example usage
document.addEventListener('mousemove', (event) => {
    showTooltip('Satellite Info: Example', event.pageX, event.pageY);
});
