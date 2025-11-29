class AQIMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.aqiData = [];
        this.init();
    }

    init() {
        this.initMap();
        this.loadAQIData();
    }

    initMap() {
        // Initialize Leaflet map centered on Delhi
        this.map = L.map('aqiMap').setView([28.6139, 77.2090], 10);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add AQI legend
        this.addLegend();
    }

    addLegend() {
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'aqi-legend');
            div.innerHTML = `
                <h6>AQI Legend</h6>
                <div><span style="background:#00E400"></span>Good (0-50)</div>
                <div><span style="background:#FFFF00"></span>Satisfactory (51-100)</div>
                <div><span style="background:#FF7E00"></span>Moderate (101-200)</div>
                <div><span style="background:#FF0000"></span>Poor (201-300)</div>
                <div><span style="background:#99004C"></span>Very Poor (301-400)</div>
                <div><span style="background:#7E0023"></span>Severe (401-500)</div>
            `;
            return div;
        };

        legend.addTo(this.map);
    }

    async loadAQIData() {
        try {
            // Try to get real data from API
            const data = await CommonUtils.makeApiCall('/citizen/aqi/current');
            if (data && data.length > 0) {
                this.aqiData = data;
            } else {
                // Use mock data if API fails
                this.aqiData = this.getMockAQIData();
            }
            this.updateMapMarkers();
        } catch (error) {
            console.error('Error loading AQI data:', error);
            this.aqiData = this.getMockAQIData();
            this.updateMapMarkers();
        }
    }

    updateMapMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add new markers
        this.aqiData.forEach(location => {
            const marker = L.circleMarker([this.getRandomLat(), this.getRandomLng()], {
                radius: 15,
                fillColor: CommonUtils.getAQIColor(location.aqi),
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            marker.bindPopup(`
                <div class="aqi-popup">
                    <h6>${location.location}</h6>
                    <div class="aqi-value">AQI: ${location.aqi}</div>
                    <div class="aqi-status">${CommonUtils.getAQIStatus(location.aqi)}</div>
                    <div class="pollutants">
                        <small>PM2.5: ${location.pm25} μg/m³</small><br>
                        <small>PM10: ${location.pm10} μg/m³</small>
                    </div>
                </div>
            `);

            this.markers.push(marker);
        });
    }

    getRandomLat() {
        return 28.4 + Math.random() * 0.6; // Delhi latitude range
    }

    getRandomLng() {
        return 76.8 + Math.random() * 0.8; // Delhi longitude range
    }

    getMockAQIData() {
        return [
            {
                location: 'Connaught Place',
                aqi: 256,
                pm25: 115,
                pm10: 198,
                latitude: 28.6328,
                longitude: 77.2197
            },
            {
                location: 'Dwarka',
                aqi: 198,
                pm25: 95,
                pm10: 165,
                latitude: 28.5847,
                longitude: 77.0497
            },
            {
                location: 'Noida',
                aqi: 278,
                pm25: 125,
                pm10: 210,
                latitude: 28.5355,
                longitude: 77.3910
            },
            {
                location: 'Gurugram',
                aqi: 312,
                pm25: 145,
                pm10: 235,
                latitude: 28.4595,
                longitude: 77.0266
            },
            {
                location: 'Rohini',
                aqi: 234,
                pm25: 108,
                pm10: 185,
                latitude: 28.7433,
                longitude: 77.0678
            }
        ];
    }
}

// Initialize map when DOM is loaded and map element exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('aqiMap')) {
        window.aqiMap = new AQIMap();
    }
});
