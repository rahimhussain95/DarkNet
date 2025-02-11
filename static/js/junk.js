import * as THREE from 'three';

// Ensure tooltip element exists
const tooltip = document.getElementById('tooltip');
if (!tooltip) {
    const tooltipElement = document.createElement('div');
    tooltipElement.id = 'tooltip';
    tooltipElement.style.position = 'absolute';
    tooltipElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    tooltipElement.style.color = '#fff';
    tooltipElement.style.padding = '5px';
    tooltipElement.style.display = 'none';
    document.body.appendChild(tooltipElement);
}

const tooltipContent = document.getElementById('tooltip-content');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Add satellite tracking to the new globe setup
export function adSatellites(planet, camera, renderer) {
    fetch('/test')
        .then(response => response.json())
        .then(data => {
            const satellites = [];
            const simulatedTime = new Date();

            data.forEach(satelliteData => {
                const { tle0, tle1, tle2 } = satelliteData;
                const satrec = satellite.twoline2satrec(tle1, tle2);

                const positionAndVelocity = satellite.propagate(satrec, simulatedTime);
                const positionEci = positionAndVelocity.position;

                if (!positionEci) {
                    console.error(`Error propagating satellite: ${tle0}`);
                    return;
                }
                
                const gmst = satellite.gstime(simulatedTime);
                const positionGd = satellite.eciToGeodetic(positionEci, gmst);

                const latitude = satellite.degreesLat(positionGd.latitude);
                const longitude = satellite.degreesLong(positionGd.longitude);
                const altitude = positionGd.height;

                const position = convertLatLonToXYZ(latitude, longitude, altitude);

                const satGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                const satMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xff0000, emissiveIntensity: 0.5 });
                const satelliteMesh = new THREE.Mesh(satGeometry, satMaterial);

                satelliteMesh.position.set(position.x, position.y, position.z);
                satelliteMesh.userData = {
                    name: tle0,
                    NORAD_CAT_ID: satrec.satnum,
                    latitude,
                    longitude,
                    altitude
                };

                planet.add(satelliteMesh);
                satellites.push(satelliteMesh);
            });

            document.addEventListener('mousemove', (event) => {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                handleMouseHover(mouse, satellites, camera);
            });

            animateSatellites(satellites, simulatedTime);
        })
        .catch(error => console.error('Error fetching satellite data:', error));
}

function handleMouseHover(mouse, satellites, camera) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(satellites);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const { name, NORAD_CAT_ID, latitude, longitude } = intersectedObject.userData;

        showTooltip(
            `<strong>${name}</strong><br>
             NORAD ID: ${NORAD_CAT_ID}<br>
             Latitude: ${latitude.toFixed(2)}<br>
             Longitude: ${longitude.toFixed(2)}`,
            event.clientX + 10,
            event.clientY + 10
        );
    } else {
        hideTooltip();
    }
}

function convertLatLonToXYZ(lat, lon, alt) {
    const globeRadius = 10;  // Ensure consistency with sphere.js
    const earthRealRadius = 6371;
    const scaleFactor = globeRadius / earthRealRadius;

    const radius = globeRadius + alt * scaleFactor;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return {
        x: -(radius * Math.sin(phi) * Math.cos(theta)),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta),
    };
}

function showTooltip(content, x, y) {
    tooltipContent.innerHTML = content;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.display = 'block';
}

function hideTooltip() {
    tooltip.style.display = 'none';
}

function animateSatellites(satellites, simulatedTime) {
    const timeStep = 100;
    simulatedTime.setTime(simulatedTime.getTime() + timeStep);

    satellites.forEach(satelliteMesh => {
        const { satrec } = satelliteMesh.userData;

        const positionAndVelocity = satellite.propagate(satrec, simulatedTime);
        const positionEci = positionAndVelocity.position;

        if (!positionEci) return;

        const gmst = satellite.gstime(simulatedTime);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const latitude = satellite.degreesLat(positionGd.latitude);
        const longitude = satellite.degreesLong(positionGd.longitude);
        const altitude = positionGd.height;

        const position = convertLatLonToXYZ(latitude, longitude, altitude);
        satelliteMesh.position.set(position.x, position.y, position.z);
    });

    requestAnimationFrame(() => animateSatellites(satellites, simulatedTime));
}
