import * as THREE from "three";

const tooltip = document.getElementById('tooltip');
let mousePosition = { x: 0, y: 0 };

export function addSatellites(scene, camera, renderer) {
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
            const altitude = positionGd.height; // Keep altitude in kilometers

            const position = convertLatLonToXYZ(latitude, longitude, altitude);

            const geometry = new THREE.SphereGeometry(0.01, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const satelliteMesh = new THREE.Mesh(geometry, material);

            satelliteMesh.position.set(position.x, position.y, position.z);
            satelliteMesh.userData = {
                name: tle0,
                NORAD_CAT_ID: satrec.satnum,
                tle1,
                tle2,
                satrec,
                initialLatitude: latitude,
                initialLongitude: longitude,
            };

            scene.add(satelliteMesh);
            satellites.push(satelliteMesh);
        });

        document.addEventListener('mousemove', (event) => {
            mousePosition.x = event.clientX; 
            mousePosition.y = event.clientY; 
            onDocumentMouseMove(mousePosition, satellites, camera, renderer);
        });

        const pinLat = 35.66408;
        const pinLon = 139.76043;
        const pinAltitude = 70;
        const pinPosition = convertLatLonToXYZ(pinLat, pinLon, pinAltitude);

        const pinGeometry = new THREE.ConeGeometry(0.02, 0.1, 8);
        const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const pinMesh = new THREE.Mesh(pinGeometry, pinMaterial);
        pinMesh.position.set(pinPosition.x, pinPosition.y, pinPosition.z);
        scene.add(pinMesh);

        animateSatellites(satellites, simulatedTime, camera, renderer);

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
                const material = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow for debugging
                const pin = new THREE.Mesh(geometry, material);
        
                pin.position.set(position.x, position.y, position.z);
                scene.add(pin);
        
                console.log(`${name} Position (XYZ):`, position);
            });
        }
        
        addDebugReferencePoints(scene);
        addTestPins(scene);
        
    })
    .catch(error => console.error('Error fetching satellite data:', error));

}

function convertLatLonToXYZ(lat, lon, alt) {
    const globeRadius = 1; // Globe radius in globe.js
    const earthRealRadius = 6371; // Earth's radius in kilometers
    const scaleFactor = globeRadius / earthRealRadius;

    const radius = globeRadius + alt * scaleFactor;// Total radius including scaled altitude
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = -lon * (Math.PI / 180);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return { x, y, z };
}

function onDocumentMouseMove(event, satellites, camera, renderer) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(satellites);

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const { name, NORAD_CAT_ID, initialLatitude, initialLongitude } = intersected.userData;
        const tooltipX = (mouse.x + 1) / 2 * window.innerWidth;
        const tooltipY = -(mouse.y - 1) / 2 * window.innerHeight;
        showTooltip(
            `Name: ${name}<br>
             NORAD CAT ID: ${NORAD_CAT_ID}<br>
             Initial Latitude: ${initialLatitude.toFixed(2)}<br>
             Initial Longitude: ${initialLongitude.toFixed(2)}`,
            tooltipX,
            tooltipY
        );
    } else {
        hideTooltip();
    }
}


function showTooltip(content, x, y) {
    const tooltip = document.getElementById('tooltip'); // Outer container
    const tooltipContent = document.getElementById('tooltip-content'); // .text element

    tooltipContent.innerHTML = content; // Set the dynamic content
    tooltip.style.left = `${x}px`; // Position tooltip
    tooltip.style.top = `${y}px`;
    tooltip.style.display = 'block'; // Show tooltip
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'none'; // Hide tooltip
}


function animateSatellites(satellites, simulatedTime, camera, renderer) {
    const timeStep = 100; 
    simulatedTime.setTime(simulatedTime.getTime() + timeStep);

    camera.updateMatrixWorld();

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

        const vector = satelliteMesh.position.clone().project(camera);

        const canvasBounds = renderer.domElement.getBoundingClientRect();
        const screenX = canvasBounds.left + (vector.x * 0.5 + 0.5) * canvasBounds.width;
        const screenY = canvasBounds.top + (-vector.y * 0.5 + 0.5) * canvasBounds.height;

        updateTooltip(
            `Name: ${satelliteMesh.userData.name}<br>
             NORAD CAT ID: ${satelliteMesh.userData.NORAD_CAT_ID}`,
            screenX,
            screenY
        );
    });
    
    requestAnimationFrame(() => animateSatellites(satellites, simulatedTime, camera, renderer));
}


function updateTooltip(content, x, y) {
    tooltip.innerHTML = content;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.display = 'block';
}
