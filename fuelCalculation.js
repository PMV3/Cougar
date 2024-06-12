document.addEventListener('DOMContentLoaded', () => {
    // Function to calculate the first table
    window.calculateFirstTable = function() {
        const qInTanks = parseFloat(document.getElementById('qInTanks1').value);
        const reserve = parseFloat(document.getElementById('reserve1').value);
        const consumption = parseFloat(document.getElementById('consumption1').value);
        const onSite = parseFloat(document.getElementById('onSite1').value);
        const speed = parseFloat(document.getElementById('speed1').value);

        // Check if any of the required fields are empty
        if (isNaN(qInTanks) || isNaN(reserve) || isNaN(consumption) || isNaN(onSite) || isNaN(speed)) {
            alert("Please fill in all the required fields.");
            return;
        }

        // Perform calculations
        const usable = qInTanks - reserve;
        const flight = usable / consumption;
        const legs = flight + onSite;
        const trip = legs * speed;
        const range = trip / 2;

        // Update the result fields
        document.getElementById('usable1').value = usable.toFixed(2);
        document.getElementById('flight1').value = flight.toFixed(2);
        document.getElementById('legs1').value = legs.toFixed(2);
        document.getElementById('trip1').value = trip.toFixed(2);
        document.getElementById('range1').value = range.toFixed(2);
    };

    // Function to calculate the second table
    window.calculateSecondTable = function() {
        const range2 = parseFloat(document.getElementById('range2').value);
        const speed2 = parseFloat(document.getElementById('speed2').value);
        const consumption2 = parseFloat(document.getElementById('consumption2').value);

        const trip2 = range2 * 2;
        document.getElementById('trip2').value = trip2;

        const legs2 = trip2 / speed2;
        document.getElementById('legs2').value = legs2.toFixed(2);

        const flight2 = legs2 + parseFloat(document.getElementById('onSite2').value);
        document.getElementById('flight2').value = flight2.toFixed(2);

        const needed2 = flight2 * consumption2;
        document.getElementById('needed2').value = needed2.toFixed(2);

        const reserve2 = parseFloat(document.getElementById('reserve2').value);
        const qInTanks2 = needed2 + reserve2;
        document.getElementById('qInTanks2').value = qInTanks2.toFixed(2);
    };
});
