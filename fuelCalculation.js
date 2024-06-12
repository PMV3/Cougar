document.addEventListener('DOMContentLoaded', () => {
    function calculateFirstTable() {
        const qInTanks = parseFloat(document.getElementById('qInTanks').value);
        const reserve = parseFloat(document.getElementById('reserve').value);
        const consumption = parseFloat(document.getElementById('consumption').value);

        const usable = qInTanks - reserve;
        document.getElementById('usable').value = usable.toFixed(2);

        const onSiteHours = parseFloat(document.getElementById('onSiteHours').value) || 0;
        const onSiteMinutes = parseFloat(document.getElementById('onSiteMinutes').value) || 0;
        const onSite = onSiteHours + (onSiteMinutes / 60);

        const flight = usable / consumption;
        document.getElementById('flight').value = convertToHoursMinutes(flight);

        const legs = flight + onSite;
        document.getElementById('legs').value = convertToHoursMinutes(legs);

        const speedBox1 = parseFloat(document.getElementById('speedBox1').value);

        const trip = legs * speedBox1;
        document.getElementById('trip').value = trip.toFixed(2);

        const range = trip / 2;
        document.getElementById('range').value = range.toFixed(2);
    }

    function calculateSecondTable() {
        const range2 = parseFloat(document.getElementById('range2').value);
        const speed2 = parseFloat(document.getElementById('speed2').value);
        const consumption2 = parseFloat(document.getElementById('consumption2').value);

        const trip2 = range2 * 2;
        document.getElementById('trip2').value = trip2.toFixed(2);

        const legs2 = trip2 / speed2;
        document.getElementById('legs2').value = convertToHoursMinutes(legs2);

        const onSiteHours2 = parseFloat(document.getElementById('onSiteHours2').value) || 0;
        const onSiteMinutes2 = parseFloat(document.getElementById('onSiteMinutes2').value) || 0;
        const onSite2 = onSiteHours2 + (onSiteMinutes2 / 60);

        const flight2 = legs2 + onSite2;
        document.getElementById('flight2').value = convertToHoursMinutes(flight2);

        const needed2 = flight2 * consumption2;
        document.getElementById('needed2').value = needed2.toFixed(2);

        const reserve2 = parseFloat(document.getElementById('reserve2').value);
        const qInTanks2 = needed2 + reserve2;
        document.getElementById('qInTanks2').value = qInTanks2.toFixed(2);
    }

    function convertToHoursMinutes(value) {
        const totalMinutes = value * 60;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return `${hours}h ${minutes}m`;
    }

    window.calculateFirstTable = calculateFirstTable;
    window.calculateSecondTable = calculateSecondTable;
});
