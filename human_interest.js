let percentSliderValue = 0;
let userData = [];
let lineChart = null;


async function loadData() {
    try {
        const savedData = localStorage.getItem('401k_userData');
        if (savedData) {
            userData = JSON.parse(savedData);
            console.log("Data loaded from localStorage:", userData.length, "entries");
            return userData;
        }
        
        const response = await fetch('user_mock_data.json');
        userData = await response.json();
        console.log("Mock data loaded from file:", userData.length, "entries");
        localStorage.setItem('401k_userData', JSON.stringify(userData));
    } catch (error) {
        console.error("Error loading data:", error);
        userData = [];
    }
    return userData;
}

function saveData(salary, contributionPercent, contributionDollar, numberOfPaychecks) {
    const newEntry = {
        salary,
        contribution_percent: contributionPercent,
        contribution_dollar_amount: contributionDollar,
        number_of_paychecks: numberOfPaychecks,
        timestamp: new Date().toISOString()
    };
    

    userData.push(newEntry);
    localStorage.setItem('401k_userData', JSON.stringify(userData));
    
    const apiData = {
        contribution_type: contributionPercent ? 'percentage' : 'fixed',
        contribution_percent: contributionPercent,
        contribution_dollar_amount: contributionDollar,
        number_of_paychecks: numberOfPaychecks,
        salary: salary,
    };
    
    fetch('/api/contribution', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log("Data successfully saved to server and user_mock_data.csv");
        } else {
            console.error("Server error:", data.error);
        }
    })
    .catch(error => {
        console.error("Error sending data to server:", error);
    });
    
    console.log("Data saved to localStorage:", newEntry);
}

function calculateYTDContribution(entry) {
    const salary = parseFloat(entry.salary) || 0;
    const contributionPercent = parseFloat(entry.contribution_percent) || 0;
    const contributionDollar = parseFloat(entry.contribution_dollar_amount) || 0;
    const numberOfPaychecks = parseFloat(entry.number_of_paychecks) || 26;
    
    if (contributionPercent > 0) {
        return (salary * contributionPercent / 100);
    } else if (contributionDollar > 0 && numberOfPaychecks > 0) {
        return contributionDollar * numberOfPaychecks;
    }
    return 0;
}

function calculateTotalYTD() {
    let totalYTD = 0;
    let contributionCount = 0;
    let totalSalary = 0;
    
    userData.forEach(entry => {
        const ytd = calculateYTDContribution(entry);
        totalYTD += ytd;
        if (ytd > 0) {
            contributionCount++;
            totalSalary += parseFloat(entry.salary) || 0;
        }
    });
    
    return {
        totalYTD,
        contributionCount,
        avgContribution: contributionCount > 0 ? totalYTD / contributionCount : 0,
        avgSalary: contributionCount > 0 ? totalSalary / contributionCount : 0
    };
}

function setupSlider() {
    const slider = document.getElementById("percent_slider");
    const label = document.getElementById("percent_label");
    
    function updateSlider() {
        document.body.style.setProperty("--thumbNumber", "'" + slider.value + "'");
        label.textContent = slider.value + "%";
        const percent = (slider.value - slider.min) / (slider.max - slider.min);
        const thumbPos = percent * (slider.offsetWidth - 20) + 10;
        label.style.left = thumbPos + "px";
        percentSliderValue = slider.value;
    }
    
    slider.addEventListener("input", updateSlider);
    slider.addEventListener("change", updateSlider);
    updateSlider();
}

function userInterface() {
    setupSlider();
    
    const elements = {
        percentageButton: document.getElementById("percentage_amount"),
        fixedButton: document.getElementById("fixed_amount"),
        sliderSection: document.getElementById("slider-section"),
        dollarAmountDiv: document.querySelector(".dollar_amount"),
        paychecksDiv: document.querySelector(".number_of_paychecks"),
        submitButton: document.getElementById("submit_data")
    };
    
    let isPercentageMode = false;
    
    elements.percentageButton.onclick = () => {
        elements.dollarAmountDiv.style.display = "none";
        elements.paychecksDiv.style.display = "none";
        elements.sliderSection.style.display = "block";
        isPercentageMode = true;
    };
    
    elements.fixedButton.onclick = () => {
        elements.sliderSection.style.display = "none";
        elements.dollarAmountDiv.style.display = "block";
        elements.paychecksDiv.style.display = "block";
        isPercentageMode = false;
    };
    
    elements.submitButton.onclick = () => {
        const salary = document.getElementById("salary").value;
        
        if (!salary) {
            alert("Please enter your salary");
            return;
        }
        
        let contributionPercent = "";
        let contributionDollar = "";
        let numberOfPaychecks = "";
        
        if (isPercentageMode) {
            contributionPercent = percentSliderValue;
            if (contributionPercent === 0) {
                alert("Please set a contribution percentage");
                return;
            }
        } else {
            contributionDollar = document.getElementById("dollar_amount").value;
            numberOfPaychecks = document.getElementById("number_of_paychecks").value;
            if (!contributionDollar || !numberOfPaychecks) {
                alert("Please enter both dollar amount and number of paychecks");
                return;
            }
        }
        
        try {
            saveData(salary, contributionPercent, contributionDollar, numberOfPaychecks);
            alert('Data saved successfully!');
        
            document.getElementById("salary").value = "";
            document.getElementById("dollar_amount").value = "";
            document.getElementById("number_of_paychecks").value = "";
            document.getElementById("percent_slider").value = 0;
            percentSliderValue = 0;
            document.getElementById("percent_label").textContent = "0%";
            
            elements.sliderSection.style.display = "none";
            elements.dollarAmountDiv.style.display = "none";
            elements.paychecksDiv.style.display = "none";
            
            updateDashboard();
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Error saving data');
        }
    };
}

function viewSavedData() {
    if (userData.length === 0) {
        alert("No saved data found");
        return;
    }
    
    let dataString = "Saved Data:\n\n";
    userData.forEach((entry, index) => {
        dataString += `Entry ${index + 1}:\n`;
        dataString += `Salary: $${entry.salary}\n`;
        if (entry.contribution_percent) {
            dataString += `Contribution: ${entry.contribution_percent}%\n`;
        }
        if (entry.contribution_dollar_amount) {
            dataString += `Contribution: $${entry.contribution_dollar_amount}\n`;
        }
        if (entry.timestamp) {
            dataString += `Saved: ${new Date(entry.timestamp).toLocaleString()}\n`;
        }
        dataString += `\n`;
    });
    
    alert(dataString);
}

function updateDashboard() {
    try {
        const dashboardElement = document.getElementById('dashboard');
        
        if (!dashboardElement) {
            console.error("Dashboard element not found");
            return;
        }
        
        dashboardElement.innerHTML = `
            <h3>401(k) Contribution Analytics</h3>
            <p style="font-size: 0.9rem; color: #64748b;">Total Entries: ${userData.length}</p>
            
            <div class="chart-section">
                <h4>Total YTD Contributions Trend</h4>
                <div class="chart-container">
                    <canvas id="lineChart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            updateLineChart();
        }, 100);
        
    } catch (error) {
        console.error("Error updating dashboard:", error);
    }
}

// Update line chart
function updateLineChart() {
    try {
        const canvas = document.getElementById('lineChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        if (lineChart) lineChart.destroy();
        
        const chartData = prepareLineChartData();
        
        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Cumulative YTD Contributions',
                    data: chartData.values,
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13, 148, 136, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#0d9488',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        font: { size: 16, weight: 'bold' },
                        color: '#1e3a8a'
                    },
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Cumulative YTD Contribution ($)', color: '#64748b' },
                        ticks: { callback: value => '$' + value.toLocaleString() }
                    },
                    x: {
                        title: { display: true, text: 'Salary', color: '#64748b' }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error updating line chart:", error);
    }
}

function prepareLineChartData() {
    const labels = [];
    const values = [];
    let cumulativeTotal = 0;
    
    const sortedData = [...userData].sort((a, b) => 
        (parseFloat(a.salary) || 0) - (parseFloat(b.salary) || 0)
    );
    
    sortedData.forEach(entry => {
        const ytdContribution = calculateYTDContribution(entry);
        if (ytdContribution > 0) {
            const salary = parseFloat(entry.salary) || 0;
            cumulativeTotal += ytdContribution;
            labels.push(`$${salary.toLocaleString()}`);
            values.push(cumulativeTotal);
        }
    });
    
    return { labels, values };
}
function calculateTotalYTDFromData(data) {
    const original = userData;
    userData = data;
    const result = calculateTotalYTD();
    userData = original;
    return result;
}

async function main() {
    await loadData();
    userInterface();
    updateDashboard();
}

loadData();