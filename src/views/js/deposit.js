const tableElement = document.querySelector('#data-table-deposit');

let timeout;
let inputCount = 0;

filterSorting(undefined, 'same');
changeYear(new Date().getFullYear());

// CRUD
function getDetailDeposit(data) {
    // delete unnecessary field
    delete data.__v;
    delete data.sortField;

    let htmlData = `<table style='text-align: left; width: 100%; margin: auto;' id='waste-types'>`;
    for (const key in data) {
        if (key === '_id' || key === 'creator' || key === 'amount_data')
            continue;
        if (key === 'customer') {
            if (data[key].full_name !== undefined) {
                htmlData += '<tr>';
                htmlData += `<th>Customer Full Name</th>`;
                htmlData += `<td>${data.customer.full_name.replace(/\b\w/g, char => char.toUpperCase())}</td>`;
                htmlData += '</tr>';
            }


            // remove the processed customer field
            delete data.customer;
        } else if (key === 'waste_type') {
            if (data[key].name !== undefined) {
                htmlData += '<tr>';
                htmlData += `<th>Waste Type Name</th>`;
                htmlData += `<td>${data.waste_type.name.replace(/\b\w/g, char => char.toUpperCase())}</td>`;
                htmlData += '</tr>';
            }


            // remove the processed waste_type field
            delete data.waste_type;
        } else {
            htmlData += '<tr>';
            htmlData += `<th>${key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</th>`;
            htmlData += `<td>${data[key]}</td>`;
            htmlData += '</tr>';
        }
    }
    htmlData += '</table>';

    Swal.fire({
        title: 'Data Deposit',
        html: htmlData
    });
}

function deleteDataDeposit(data) {
    let generateTitle;
    let generateText;
    if (data.status === 'active') {
        generateText = data.waste_type.name[0].toUpperCase() + data.waste_type.name.slice(1) + " has been deleted";
        generateTitle = 'Confirm to delete ' + data.waste_type.name[0].toUpperCase() + data.waste_type.name.slice(1) + '?';
    }


    Swal.fire({
        title: generateTitle,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Confirm"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(baseUrlApi + 'deposit', {
                method: 'DELETE',  // Change to POST
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: data._id})
            })
                .then((res) => res.json())
                .then((res) => {
                    if (res.status) {
                        Swal.fire({
                            title: "Failed to delete!",
                            text: res.message,
                            icon: "error"
                        });
                    } else {
                        Swal.fire({
                            title: generateText,
                            icon: "success"
                        }).then((res) => {
                            filterSorting(undefined, 'same');
                        });
                    }

                });
        }
    });
}

async function calculateAmount(count) {
    const getDocument = document.querySelectorAll('.sa-input')[count];

    const getValueWasteType = getDocument.querySelectorAll('select')[1].value;
    const listWasteType = await getAllWasteTypeData();
    const getOneDataWasteType = listWasteType.filter((each) => each._id === getValueWasteType)[0];
    const getAmountValue = getDocument.querySelectorAll('.sa-input input')[0].value;

    console.log(getAmountValue)
    const calculate = getAmountValue * getOneDataWasteType.price;
    getDocument.querySelectorAll('.sa-input input')[1].value = calculate;
}

async function getAllWasteTypeData() {
    const bodyRequest = {
        filter: {status: 'active'},
        sorting: {name: 1},
        pagination: {page: 0, limit: 1000}
    };

    try {
        const response = await fetch(baseUrlApi + 'waste-type/table', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(bodyRequest)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const res = await response.json();
        return res.result?.data.map(each => ({
            _id: each._id,
            name: each.name.split(' ').map(each => each[0].toUpperCase() + each.slice(1)).join(' '),
            price: each.price
        })) || [];
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

async function getAllCustomerData() {
    const bodyRequest = {
        filter: {status: 'active'},
        sorting: {full_name: 1},
        pagination: {page: 0, limit: 1000}
    };

    try {
        const response = await fetch(baseUrlApi + 'customer/table', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(bodyRequest)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const res = await response.json();
        return res.result?.data.map(each => ({
            _id: each._id,
            name: each.full_name.split(' ').map(each => each[0].toUpperCase() + each.slice(1)).join(' '),
            price: each.price
        })) || [];
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

async function createDataDeposit() {
    const listWasteType = await getAllWasteTypeData();
    const listCustomer = await getAllCustomerData();

    let optionWasteType = '';
    let optionCustomer = '';

    listWasteType.forEach(wt => {
        optionWasteType += `<option value="${wt._id}">${wt.name}</option>`
    });

    listCustomer.forEach(customer => {
        optionCustomer += `<option value="${customer._id}">${customer.name}</option>`
    });

    const tables = `
    <div class='reset-btn sa' style="margin-bottom: 20px; text-align: center;">
    <button onclick='addMoreInput(${JSON.stringify(optionWasteType)}, ${JSON.stringify(optionCustomer)})' 
            style="padding: 12px 24px; font-size: 16px; background-color: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.3s;">
        Add More+
    </button>
</div>

<table class='sa-input' data-count-input=${inputCount} style="width: 100%; max-width: 700px; margin: 0 auto; border-collapse: collapse; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);">
    <tr style="display: flex; justify-content: space-between; align-items: center;">
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333; width: 30%;"> 
            Customer
        </th>
        <td style="padding: 12px; width: 70%;">
            <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box; transition: border-color 0.3s;">
                ${optionCustomer}
            </select>
        </td>
    </tr>

    <tr style="display: flex; justify-content: space-between; align-items: center;">
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333; width: 30%;">
            Waste Type
        </th>
        <td style="padding: 12px; width: 70%;">
            <select onchange="calculateAmount(${inputCount})" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box; transition: border-color 0.3s;">
                ${optionWasteType}
            </select>
        </td>
    </tr>

    <tr style="display: flex; justify-content: space-between; align-items: center;">
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333; width: 30%;">
            Weight
        </th>
        <td style="padding: 12px; width: 70%;">
            <input type="number" value="" min="0" placeholder="Weight.." onchange="calculateAmount(${inputCount})" 
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box; transition: border-color 0.3s;">
        </td>
    </tr>

    <tr style="display: flex; justify-content: space-between; align-items: center;">
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333; width: 30%;">
            Amount
        </th>
        <td style="padding: 12px; width: 70%;">
            <input type="number" value="" placeholder="Amount.." readOnly 
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; color: gray; font-size: 14px; box-sizing: border-box; background-color: #f9f9f9;">
        </td>
    </tr>
</table>

    `;

    Swal.fire({
        title: 'Create New Data',
        html: tables,
        confirmButtonText: 'Create',
        confirmButtonColor: 'green',
        showCancelButton: true,
    }).then((result) => {
        let bodyRequest = [];
        const element = document.querySelectorAll('.sa-input > tbody');
        element.forEach(e => {
            const getCustomerValue = e.querySelectorAll('.sa-input select')[0].value;
            const getWasteTypeValue = e.querySelectorAll('.sa-input select')[1].value;
            const getWeightValue = e.querySelectorAll('.sa-input input')[0].value;
            const getAmountValue = e.querySelectorAll('.sa-input input')[1].value;
            bodyRequest.push({
                waste_type: getWasteTypeValue,
                customer: getCustomerValue,
                weight: +getWeightValue,
                amount: +getAmountValue
            });
        });

        if (result.isConfirmed) {
            fetch(baseUrlApi + 'deposit', {
                method: 'POST',  // Change to POST
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({input: bodyRequest})
            })
                .then((res) => res.json())
                .then((res) => {
                    if (res.status) {
                        Swal.fire({
                            title: "Failed to create!",
                            text: res.message,
                            icon: "error"
                        });
                    } else {
                        Swal.fire({
                            title: 'Successfully Created!',
                            icon: "success"
                        }).then((res) => {
                            window.location.reload();
                            // filterSorting(undefined, 'same');
                        });
                    }

                })
        } else {
            inputCount = 0;
        }
    });
}

// INPUT DATA
function addMoreInput(optionWasteType, optionCustomer) {
    inputCount++;
    const selectedCustomer = document.querySelectorAll('.sa-input')[inputCount - 1].querySelectorAll('select')[0].value;
    const selectedWasteType = document.querySelectorAll('.sa-input')[inputCount - 1].querySelectorAll('select')[1].value;

    document.querySelector('.swal2-html-container').innerHTML += `
    <div data-count-input=${inputCount}>
        <br>
    <div class='reset-btn sa'>
        <button hidden></button>
        <button hidden></button>
        <button onclick='deleteInput()'>Delete</button>
    </div>
    <table class='sa-input' data-count-input=${inputCount} style="width: 100%; max-width: 700px; margin: 0 auto; border-collapse: collapse; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);">
    <tr style="display: flex; justify-content: space-between; align-items: center;">
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333; width: 30%;"> 
            Customer
        </th>
        <td style="padding: 12px; width: 70%;">
            <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box; transition: border-color 0.3s;">
                ${optionCustomer}
            </select>
        </td>
    </tr>

    <tr style="display: flex; justify-content: space-between; align-items: center;">
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333; width: 30%;">
            Waste Type
        </th>
        <td style="padding: 12px; width: 70%;">
            <select onchange="calculateAmount(${inputCount})" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box; transition: border-color 0.3s;">
                ${optionWasteType}
            </select>
        </td>
    </tr>

    <tr style="display: flex; justify-content: space-between; align-items: center;">
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333; width: 30%;">
            Weight
        </th>
        <td style="padding: 12px; width: 70%;">
            <input type="number" value="" min="0" placeholder="Weight.." onchange="calculateAmount(${inputCount})" 
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box; transition: border-color 0.3s;">
        </td>
    </tr>

    <tr style="display: flex; justify-content: space-between; align-items: center;">
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333; width: 30%;">
            Amount
        </th>
        <td style="padding: 12px; width: 70%;">
            <input type="number" value="" placeholder="Amount.." readOnly 
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; color: gray; font-size: 14px; box-sizing: border-box; background-color: #f9f9f9;">
        </td>
    </tr>
</table>
  </div>
    `;

    document.querySelectorAll('.sa-input').forEach(each => {
        each.querySelectorAll('select')[0].value = selectedCustomer;
        each.querySelectorAll('select')[1].value = selectedWasteType;
    });
}

// FETCH DATA
function fetchDataTable(bodyRequest) {
    const body = bodyRequest;
    tableElement.innerHTML = '';
    tableElement.innerHTML += `
    <tr id='loading'>
        <td colspan='8' style='text-align: center;'>
            <img src='https://cdn.pixabay.com/animation/2022/07/29/03/42/03-42-05-37_512.gif' width='25%'/>
        </td>
    </tr>
    `;
    fetch(baseUrlApi + 'deposit/table', {
        method: 'POST',  // Change to POST
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    })
        .then(res => res.json())
        .then(res => {
            const dataTable = res.result?.data;
            tableElement.querySelector('#loading').remove();
            if (dataTable?.length) {
                summaryData();
                dataTable.forEach((element, index) => {
                    let customerNameConvert = element.customer.full_name.split(' ').map(each => each[0].toUpperCase() + each.slice(1)).join(' ');
                    let wasteTypeConvert = element.waste_type.name.split(' ').map(each => each[0].toUpperCase() + each.slice(1)).join(' ');
                    const statusConvert = element.status[0].toUpperCase() + element.status.slice(1);
                    const withdrawalConvert = element.withdrawal_status[0].toUpperCase() + element.withdrawal_status.slice(1);
                    const amountConvert = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                    }).format(element.amount);
                    const parsedElement = JSON.stringify(element).replace(/"/g, "'");
                    const deleteBtn = `<img src="img/asset-14.png" onclick="deleteDataDeposit(${parsedElement})"/>`;

                    if (customerNameConvert.length > 20) customerNameConvert = customerNameConvert.slice(0, 20) + '...';

                    let newElement = '<tr>';
                    newElement += `<td>${element.deposit_date}</td>`;
                    newElement += `<td>${amountConvert.replace("₹", "₹ ")}</td>`;
                    newElement += `<td style="text-align: right;">${element.weight} kg</td>`;
                    newElement += `<td style="width: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${wasteTypeConvert}</td>`;
                    newElement += `<td style="width: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${customerNameConvert}</td>`;
                    newElement += `<td style="text-align: center;">${withdrawalConvert}</td>`;
                    newElement += `<td style="text-align: center;">${statusConvert}</td>`;
                    newElement += `
                <td style="text-align: center;" class="th-action">
                    ${element.status === 'active' ? deleteBtn : ''}
                    <img src="img/asset-16.png" onclick="getDetailDeposit(${parsedElement})"/>
                </td>`;

                    newElement += '</tr>';
                    tableElement.innerHTML += newElement;
                    document.getElementsByName('last-page')[0].setAttribute('data-page', element.amount_data ?? 0);
                });
            } else {
                tableElement.innerHTML += `
            <tr>
                <td colspan='8' style='text-align:center; padding: 20px;'>No result.</td>
            </tr>
            `;
            }

        });
}

// CHART
async function setLineChart(rawData) {
    const rawDataDeposit = rawData;
    let rawDataset = [];

    // REMOVE EXISTING CANVAS
    document.getElementById('lineChart-deposit').remove();
    const canvasLine = document.createElement('canvas');
    canvasLine.id = 'lineChart-deposit';
    document.querySelectorAll('.chart-deposit')[0].appendChild(canvasLine);

    rawDataDeposit.forEach(deposit => {
        const getMonth = moment(deposit.deposit_date, "MMMM DD, YYYY").format('MMMM-YYYY');
        let checkMonth = rawDataset.find(data => data.month === getMonth);
        if (!checkMonth) {
            checkMonth = {month: getMonth, customers: []};
            rawDataset.push(checkMonth);
        }

        checkMonth.customers.push({id: deposit.customer, amount: deposit.amount});
    });

    let dataDeposit = {
        labels: rawDataset.map(data => data.month),
        datasets: [{
            label: 'Total Deposit',
            data: rawDataset.map(data => data.customers.reduce((acc, current) => acc + current.amount, 0)),
            fill: true,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgb(75, 192, 192, 0.2)',
            borderWidth: 2
        }]
    };

    const configDeposit = {
        type: 'line',
        data: dataDeposit,
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: false,
                        text: 'Month'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: false,
                        text: 'Amount'
                    }
                }
            }
        }
    };

    const ctxDeposit = document.getElementById('lineChart-deposit').getContext('2d');
    new Chart(ctxDeposit, configDeposit);
}

async function changeYear(year) {
    const body = {
        filter: {
            status: 'active',
            deposit_chart: `${year}-07-24T05:01:37.986Z`
        },
        pagination: {
            page: 0,
            limit: 1000
        }
    };

    const response = await fetch(baseUrlApi + 'deposit/table', {
        method: 'POST',  // Change to POST
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }


    const data = await response.json();
    setLineChart(data.result.data);
    setDougChart(data.result.data);
}

async function setDougChart(rawData) {
    const rawDataDeposit = rawData;
    let rawDataset = [];

    // REMOVE EXISTING CANVAS
    document.getElementById('doughChart-deposit').remove();
    const canvasDough = document.createElement('canvas');
    canvasDough.id = 'doughChart-deposit';
    document.querySelectorAll('.chart-customer')[0].appendChild(canvasDough);

    rawDataDeposit.forEach(deposit => {
        const getMonth = moment(deposit.deposit_date, "MMMM DD, YYYY").format('MMMM');
        let checkMonth = rawDataset.find(data => data.month === getMonth);
        if (!checkMonth) {
            checkMonth = {month: getMonth, customers: []};
            rawDataset.push(checkMonth);
        }

        checkMonth.customers.push({id: deposit.customer, amount: deposit.amount});
    });

    const getActiveCustomer = rawDataset.map(monthData => {
        const uniqueCustomers = new Set(monthData.customers.map(customer => customer.id._id));
        return uniqueCustomers.size;
    });

    const dataCustomer = {
        labels: rawDataset.map(data => data.month),
        datasets: [{
            label: 'Customers Active',
            data: getActiveCustomer,
            backgroundColor: [
                'rgb(54, 162, 235, 0.8)',
                'rgb(104, 162, 235, 0.8)',
                'rgb(154, 162, 235, 0.8)',
                'rgb(204, 162, 235, 0.8)',
                'rgb(254, 162, 235, 0.8)',
                'rgb(54, 162, 235, 0.8)',
            ],
            hoverOffset: 2
        }]
    };

    const configCustomer = {
        type: 'doughnut',
        data: dataCustomer,
    };

    const ctxCustomer = document.getElementById('doughChart-deposit').getContext('2d');
    new Chart(ctxCustomer, configCustomer);
}

// SUMMARY DATA
function summaryData() {
    const body = {
        pagination: {
            page: 0, limit: 1000
        }
    };
    fetch(baseUrlApi + 'deposit/table', {
        method: 'POST',  // Change to POST
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    })
        .then(res => res.json())
        .then(res => {
            const rawData = res.result.data;
            let totalData = rawData.filter(item => item.status === 'active').length;
            let totalDeposit = rawData.filter(item => item.status === 'active').reduce((acc, current) => acc + current.amount, 0);
            let totalWeight = rawData.filter(item => item.status === 'active').reduce((acc, current) => acc + current.weight, 0);


            document.querySelectorAll('.counter-item > .number-deposit')[0].innerText = formatNumber(totalData);
            document.querySelectorAll('.counter-item > .number-deposit')[1].innerText = formatNumber(totalDeposit.toFixed(1));
            document.querySelectorAll('.counter-item > .number-deposit')[2].innerText = formatNumber(totalWeight.toFixed(1));
        });
}