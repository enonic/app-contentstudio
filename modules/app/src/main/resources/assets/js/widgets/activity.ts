import Chart from 'chart.js/auto';

const drawGraph = (activityDataObj: Object) => {
    const activity = formatData(activityDataObj);
// set the dimensions and margins of the graph
    new Chart('activity-chart', {
        type: 'line',
        data: {
            labels: activity.labels,
            datasets: [{
                label: 'Items modified',
                data: activity.data,
                borderColor: '#b5c9e3',
                backgroundColor: 'rgba(181, 201, 227, 0.3)',
                fill: 'start',
                pointRadius: 0
            }]
        },
        options: {
            plugins: {
                filler: {
                    propagate: false,
                },
                legend: {
                    display: false
                }
            },
            interaction: {
                intersect: false,
            },
            elements: {
                line: {
                    tension: 0.4
                }
            },
            maintainAspectRatio: false
        }
    });
};

const formatData = (activityData: Object) => {
    const labels = [];
    const data = [];

    Object.keys(activityData).forEach((key: string) => {
        const dateParts: string[] = key.split('-');
        labels.push(`${dateParts[2]}/${dateParts[1]}`);
        data.push(activityData[key]);
    });

    return {
        data,
        labels
    };
};

(() => {
    if (!document.currentScript) {
        return;
    }

    const chartDataServiceUrl = document.currentScript.getAttribute('data-chart-service-url');

    if (!chartDataServiceUrl) {
        return;
    }

    fetch(chartDataServiceUrl)
        .then((response) => response.json())
        .then((activityDataObj: Object) => drawGraph(activityDataObj))
        .catch((e) => {
            console.error(e);
        });

})();
