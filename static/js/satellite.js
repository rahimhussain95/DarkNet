import * as THREE from "three";

const tooltip = document.getElementById('tooltip');

export function addSatellites(scene, camera, renderer) {
    fetch('/data')
        .then(response => response.json())
        .then(data => {
            const satellites = [];
            data.forEach(satellite => {
                const { name, NORAD_CAT_ID, latitude, longitude, altitude, mean_motion, inclination, Priority } = satellite;

                // Convert initial lat/lon/alt to XYZ position
                const position = convertLatLonToXYZ(latitude, longitude, altitude);

                // Create satellite geometry and material
                const geometry = new THREE.SphereGeometry(0.01, 8, 8); // Small sphere for satellite
                const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const satelliteMesh = new THREE.Mesh(geometry, material);

                // Set position and user data for the satellite
                satelliteMesh.position.set(position.x, position.y, position.z);
                satelliteMesh.userData = {
                    name,
                    NORAD_CAT_ID,
                    Priority,
                    mean_motion,
                    inclination,
                    altitude,
                    latitude,
                    longitude,
                    orbitAngle: Math.random() * 2 * Math.PI, // Initialize with random orbit angle
                    inclinationRad: inclination * (Math.PI / 180), // Convert inclination to radians
                };

                // Add satellite to the scene and tracking array
                scene.add(satelliteMesh);
                satellites.push(satelliteMesh);
            });

            // Add event listener for mouse move to show tooltip
            document.addEventListener('mousemove', (event) => {
                onDocumentMouseMove(event, satellites, camera, renderer);
            });

            // Animate satellites
            animateSatellites(satellites);
        })
        .catch(error => console.error('Error fetching satellite data:', error));
}

function convertLatLonToXYZ(lat, lon, alt) {
    const globeRadius = 1; // Globe radius in globe.js
    const earthRealRadius = 6371; // Earth's radius in kilometers
    const scaleFactor = globeRadius / earthRealRadius;

    const scaledAltitude = alt * scaleFactor; // Scale altitude to match the globe's scale
    const radius = globeRadius + scaledAltitude; // Total radius including satellite altitude

    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return { x, y, z };
}

// Handle mouse movement to show tooltips
function onDocumentMouseMove(event, satellites, camera, renderer) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(satellites);

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const { name, NORAD_CAT_ID, Priority, latitude, longitude } = intersected.userData;
        showTooltip(`Name: ${name}<br>NORAD CAT ID: ${NORAD_CAT_ID}<br>Priority: ${Priority}<br>Latitude: ${latitude.toFixed(2)}<br>Longitude: ${longitude.toFixed(2)}`, event.clientX, event.clientY);
    } else {
        hideTooltip();
    }
}

// Show tooltip
function showTooltip(content, x, y) {
    tooltip.innerHTML = content;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.display = 'block';
}

// Hide tooltip
function hideTooltip() {
    tooltip.style.display = 'none';
}

function animateSatellites(satellites) {
    const globeRadius = 1;
    const earthRealRadius = 6371;
    const scaleFactor = globeRadius / earthRealRadius;

    satellites.forEach(satellite => {
        const { mean_motion, inclinationRad, altitude } = satellite.userData;

        const orbitalPeriod = 86400 / mean_motion;
        const angularSpeed = (2 * Math.PI) / orbitalPeriod;

        satellite.userData.orbitAngle += angularSpeed * 0.01;

        const newLat = Math.asin(Math.sin(inclinationRad) * Math.sin(satellite.userData.orbitAngle)) * (180 / Math.PI);
        const newLon = (satellite.userData.longitude + satellite.userData.orbitAngle * (180 / Math.PI)) % 360;

        const altitudeExaggeration = 5000;
        const scaledAltitude = altitude * scaleFactor * altitudeExaggeration;

        const position = convertLatLonToXYZ(newLat, newLon, scaledAltitude);

        satellite.position.set(position.x, position.y, position.z);
    });

    requestAnimationFrame(() => animateSatellites(satellites));
}

