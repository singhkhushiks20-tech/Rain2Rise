let rainfallRecords = [];
let stockRecords = [];
let comparisonChart = null;

// Show selected module
function showSection(sectionId) {
    document.querySelectorAll(".panel").forEach(panel => {
        panel.style.display = "none";
    });

    const selectedPanel = document.getElementById(sectionId);
    selectedPanel.style.display = "block";

    selectedPanel.scrollIntoView({
        behavior: "smooth"
    });

    if (sectionId === "compare") {
        loadAnalysis();
    }
}

// Load CSV file
async function loadCSV(file) {
    const response = await fetch(file);

    if (!response.ok) {
        throw new Error("Unable to load " + file);
    }

    const text = await response.text();
    const rows = text.trim().split(/\r?\n/);
    const headers = rows[0].split(",");

    return rows.slice(1).map(row => {
        const values = row.split(",");
        const record = {};

        headers.forEach((header, index) => {
            record[header.trim()] = values[index]?.trim();
        });

        return record;
    });
}

// Load both datasets
async function loadAnalysis() {
    const status = document.getElementById("analysisStatus");

    status.innerText = "Loading datasets...";

    try {
        rainfallRecords = await loadCSV("datasets/rainfall.csv");
        stockRecords = await loadCSV("datasets/stocks.csv");

        showDashboard();

    } catch (error) {
        console.error(error);

        status.innerText =
            "Unable to load CSV files. Please use Live Server.";
    }
}

// Display comparison graph
function showDashboard() {
    const rainfall = rainfallRecords
        .filter(row => row.Location === "Delhi")
        .map(row => Number(row.Rainfall_mm));

    const labels = rainfallRecords
        .filter(row => row.Location === "Delhi")
        .map(row => row.Month);

    const stockData = stockRecords.filter(
        row => row.Company === "TCS"
    );

    const prices = stockData.map(row =>
        Number(row.Closing_Price_INR)
    );

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(
        document.getElementById("comparisonChart"),
        {
            type: "line",

            data: {
                labels: labels,

                datasets: [
                    {
                        label: "Delhi Rainfall (mm)",
                        data: rainfall,
                        borderColor: "#55c8ff",
                        yAxisID: "y",
                        tension: 0.3
                    },
                    {
                        label: "TCS Sample Stock Price (₹)",
                        data: prices,
                        borderColor: "#62e6a1",
                        yAxisID: "y1",
                        tension: 0.3
                    }
                ]
            },

            options: {
                responsive: true,

                scales: {
                    y: {
                        position: "left",
                        title: {
                            display: true,
                            text: "Rainfall (mm)",
                            color: "white"
                        },
                        ticks: {
                            color: "white"
                        }
                    },

                    y1: {
                        position: "right",
                        title: {
                            display: true,
                            text: "Stock Price (₹)",
                            color: "white"
                        },
                        ticks: {
                            color: "white"
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },

                    x: {
                        ticks: {
                            color: "white"
                        }
                    }
                },

                plugins: {
                    legend: {
                        labels: {
                            color: "white"
                        }
                    }
                }
            }
        }
    );

    document.getElementById("analysisStatus").innerText =
        "Loaded " + rainfall.length +
        " Delhi rainfall records and " +
        prices.length + " TCS sample stock records.";

    showCorrelation(rainfall, prices);
}

// Calculate correlation
function showCorrelation(x, y) {
    const meanX =
        x.reduce((a, b) => a + b, 0) / x.length;

    const meanY =
        y.reduce((a, b) => a + b, 0) / y.length;

    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;

    for (let i = 0; i < x.length; i++) {
        numerator += (x[i] - meanX) * (y[i] - meanY);
        denominatorX += Math.pow(x[i] - meanX, 2);
        denominatorY += Math.pow(y[i] - meanY, 2);
    }

    const denominator = Math.sqrt(
        denominatorX * denominatorY
    );

    if (denominator === 0) {
        document.getElementById("correlationResult").innerText =
            "Correlation cannot be calculated.";
        return;
    }

    const correlation = numerator / denominator;

    document.getElementById("correlationResult").innerText =
        "Sample correlation coefficient: " +
        correlation.toFixed(3);
}

// Rainfall Tracker for all four cities
function showRainfall() {
    const city = document.getElementById("location").value;

    const result = document.getElementById("rainResult");

    if (rainfallRecords.length === 0) {
        result.innerText =
            "Please open Rain vs Stocks once to load the dataset.";
        return;
    }

    const cityRecords = rainfallRecords.filter(
        row => row.Location === city
    );

    if (cityRecords.length === 0) {
        result.innerText =
            "No sample rainfall data available for this city.";
        return;
    }

    const totalRainfall = cityRecords.reduce(
        (sum, row) => sum + Number(row.Rainfall_mm),
        0
    );

    const highestMonth = cityRecords.reduce(
        (highest, current) =>
            Number(current.Rainfall_mm) >
            Number(highest.Rainfall_mm) ? current : highest
    );

    result.innerText =
        city + " | Total annual sample rainfall: " +
        totalRainfall + " mm | Highest rainfall: " +
        highestMonth.Month + " (" +
        highestMonth.Rainfall_mm + " mm)";
}

// Stock Dashboard
function showStock() {
    const company = document.getElementById("company").value;

    const result = document.getElementById("stockResult");

    if (stockRecords.length === 0) {
        result.innerText =
            "Please open Rain vs Stocks once to load the dataset.";
        return;
    }

    const companyRecords = stockRecords.filter(
        row => row.Company === company
    );

    if (companyRecords.length === 0) {
        result.innerText =
            "No sample data available for this company.";
        return;
    }

    const firstPrice =
        Number(companyRecords[0].Closing_Price_INR);

    const latestRecord =
        companyRecords[companyRecords.length - 1];

    result.innerText =
        company + " | December sample price: ₹" +
        latestRecord.Closing_Price_INR +
        " | January sample price: ₹" +
        firstPrice;
}

// Innovation Lab
function testConcept() {
    const input = document.getElementById("rainInput");

    const value = input.value;
    const rainfall = Number(value);

    const result = document.getElementById("labResult");

    if (
        value.trim() === "" ||
        !Number.isFinite(rainfall) ||
        rainfall < 0
    ) {
        result.innerText = "Please enter a valid rainfall value.";
        return;
    }

    if (rainfall < 50) {
        result.innerText = "Low rainfall level.";
    } else if (rainfall < 150) {
        result.innerText = "Moderate rainfall level.";
    } else {
        result.innerText = "High rainfall level.";
    }
}
