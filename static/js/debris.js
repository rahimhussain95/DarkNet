import * as THREE from "three";

const tooltip = document.getElementById('tooltip');
const tooltipContent = document.getElementById('tooltip-content');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let lastFrameTime = performance.now();

// Satellite functionality that is implemented onto ThreeJS globe
export function addSatellites(scene, camera, renderer) {
    fetch('/data')
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

            const startPos = convertLatLonToXYZ(latitude, longitude, altitude);

            // Satellite design
            const geometry = new THREE.SphereGeometry(0.01, 8, 8);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffff00,
                emissive: 0xffffff,
                emissiveIntensity: 3.0
            });
            const satelliteMesh = new THREE.Mesh(geometry, material);
            satelliteMesh.position.set(startPos.x, startPos.y, startPos.z);

            // Satellite info from TLE data
            satelliteMesh.userData = {
                name: tle0,
                NORAD_CAT_ID: satrec.satnum,
                tle1,
                tle2,
                satrec,
                initialLatitude: latitude,
                initialLongitude: longitude
            };

            scene.add(satelliteMesh);
            satellites.push(satelliteMesh);
        });

        document.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; 
            onDocumentMouseMove(mouse, satellites, camera, renderer, scene);
        });

       

        animateSatellites(satellites, simulatedTime, camera, renderer, scene);

        // Test points and global landmarks for debugging reference
        
        // addDebugReferencePoints(scene);
        // addTestPins(scene);

    })
    .catch(error => console.error('Error fetching satellite data:', error));
}

// Conversion to map satellite coordinates accurately
function convertLatLonToXYZ(lat, lon, alt) {
    const globeRadius = 1;
    const earthRealRadius = 6371; // km
    const scaleFactor = globeRadius / earthRealRadius;

    const radius = globeRadius + alt * scaleFactor;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = -lon * (Math.PI / 180);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return { x, y, z };
}

// Tooltip functionality
function onDocumentMouseMove(mouse, satellites, camera, renderer, scene) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(satellites);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        let { name, NORAD_CAT_ID } = intersectedObject.userData;

        // Remove leading '0 ' if present. (regex: start of string, followed by "0 ").
        name = name.replace(/^0\s*/, '');

        tooltip.style.display = 'block';
        tooltip.style.left = `${(mouse.x * window.innerWidth / 2) + (window.innerWidth / 2)}px`;
        tooltip.style.top = `${(-mouse.y * window.innerHeight / 2) + (window.innerHeight / 2)}px`;

        // Remove latitude and longitude lines; just show name + NORAD
        tooltipContent.innerHTML = `
            <strong>${name}</strong><br>
            NORAD ID: ${NORAD_CAT_ID}
        `;
    } else {
        tooltip.style.display = 'none';
    }

    renderer.render(scene, camera);
}

function showTooltip(content, x, y) {
    const tooltip = document.getElementById('tooltip'); 
    const tooltipContent = document.getElementById('tooltip-content'); 

    tooltipContent.innerHTML = content;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.display = 'block';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'none';
}

// Satellite Animation
function animateSatellites(satellites, simulatedTime, camera, renderer, scene) {
    const now = performance.now();
    const dt = now - lastFrameTime;
    lastFrameTime = now;

    // Use to calibrate satellite orbit movement proportional to actual movement
    simulatedTime.setTime(simulatedTime.getTime() + dt * 5);

    camera.updateMatrixWorld();

    satellites.forEach(satelliteMesh => {
        const { satrec } = satelliteMesh.userData;
        if (!satrec) return;

        const positionAndVelocity = satellite.propagate(satrec, simulatedTime);
        const positionEci = positionAndVelocity.position;
        if (!positionEci) return;

        const gmst = satellite.gstime(simulatedTime);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const lat = satellite.degreesLat(positionGd.latitude);
        const lon = satellite.degreesLong(positionGd.longitude);
        const alt = positionGd.height; 

        const newPos = convertLatLonToXYZ(lat, lon, alt);
        satelliteMesh.position.set(newPos.x, newPos.y, newPos.z);
    });

    renderer.render(scene, camera);
    
    requestAnimationFrame(() => animateSatellites(satellites, simulatedTime, camera, renderer, scene));
}

// Landmark points for satellite coordinate calibration
function addTestPins(scene) {
    const testLocations = [
        { name: 'Esplanade Mall, LA', lat: 30.01687, lon: -90.24939, alt: 0 },
        { name: 'Royal Park Hotel, Tokyo', lat: 35.66408, lon: 139.76043, alt: 70 },
        { name: 'Eiffel Tower, Paris', lat: 48.8584, lon: 2.2945, alt: 0 },
        { name: 'Sydney Opera House, Australia', lat: -33.8568, lon: 151.2153, alt: 0 },
    ];

    testLocations.forEach(({ name, lat, lon, alt }) => {
        const position = convertLatLonToXYZ(lat, lon, alt);
        const geometry = new THREE.SphereGeometry(0.02, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const pin = new THREE.Mesh(geometry, material);

        pin.position.set(position.x, position.y, position.z);
        scene.add(pin);

        console.log(`${name} Position (XYZ):`, position);
    });
}

// Reference points for ThreeJS earth mapping calibration
function addDebugReferencePoints(scene) {
    const referencePoints = [
        { name: 'North Pole', lat: 90, lon: 0, alt: 0 },
        { name: 'Equator Prime Meridian', lat: 0, lon: 0, alt: 0 },
        { name: 'Equator 90E', lat: 0, lon: 90, alt: 0 },
        { name: 'Equator 90W', lat: 0, lon: -90, alt: 0 },
        { name: 'South Pole', lat: -90, lon: 0, alt: 0 },
    ];

    referencePoints.forEach(({ name, lat, lon, alt }) => {
        const position = convertLatLonToXYZ(lat, lon, alt);
        const geometry = new THREE.SphereGeometry(0.02, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const pin = new THREE.Mesh(geometry, material);

        const pinLat = 35.66408;
        const pinLon = 139.76043;
        const pinAltitude = 70;
        const pinPosition = convertLatLonToXYZ(pinLat, pinLon, pinAltitude);
        const pinGeometry = new THREE.ConeGeometry(0.02, 0.1, 8);
        const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const pinMesh = new THREE.Mesh(pinGeometry, pinMaterial);
        pinMesh.position.set(pinPosition.x, pinPosition.y, pinPosition.z);
        scene.add(pinMesh);

        pin.position.set(position.x, position.y, position.z);
        scene.add(pin);

        console.log(`${name} Position (XYZ):`, position);
    });
}
