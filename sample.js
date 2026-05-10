// 1. DATABASE SCHEMA (State Management)
const Traveloop = {
    // Mimics relational tables: Users -> Trips -> Stops -> Activities
    trips: JSON.parse(localStorage.getItem('traveloop_trips')) || [],
    
    // 2. DATA PERSISTENCE (Scaling/Security)
    save() {
        localStorage.setItem('traveloop_trips', JSON.stringify(this.trips));
        this.render(); // Re-render UI whenever data changes
    },

    // 3. LOGIC/BUSINESS RULES (Performance)
    // Functional approach to calculating total trip cost [cite: 69]
    calculateBudget(tripId) {
        const trip = this.trips.find(t => t.id === tripId);
        if (!trip) return 0;
        // Summing costs across nested stops and activities [cite: 11, 23]
        return trip.stops?.reduce((acc, stop) => 
            acc + stop.activities.reduce((sum, act) => sum + Number(act.cost), 0), 0) || 0;
    },

    // 4. RENDERING ENGINE (Modularity/Clarity)
    render() {
        this.renderTripList();
        this.renderDashboard();
    },

    renderTripList() {
        const container = document.querySelector('#my-trips .grid');
        if (!container) return;

        // Creating dynamic "Trip Cards" based on the Trip List Screen requirements [cite: 41, 46]
        container.innerHTML = this.trips.map(trip => `
            <div class="card">
                <h3>${trip.name}</h3>
                <p class="text-muted">${trip.startDate} to ${trip.endDate}</p>
                <div class="flex justify-between align-center">
                    <strong>$${this.calculateBudget(trip.id)}</strong>
                    <button class="btn btn-outline" onclick="deleteTrip(${trip.id})">🗑</button>
                </div>
            </div>
        `).join('') || '<p>No trips planned yet. Let’s dream! [cite: 5]</p>';
    }
};

// Initialization on page load
document.addEventListener('DOMContentLoaded', () => Traveloop.render());