const tableElement = document.querySelector('#data-table-withdrawal');

let timeout;
let inputCount = 0;

filterSorting(undefined, 'same');

// CRUD
function getDetailWithdrawal(data) {
    // delete unnecessary field
    delete data.__v;
    delete data.sortField;
    delete data.updatedAt;

    let htmlData = `<table style='text-align: left; width: 100%; margin: auto;' id='waste-types'>`;
    for (const key in data) {
        if (key === 'customer') {
            if (data[key].full_name !== undefined) {
                htmlData += '<tr>';
                htmlData += `<th>customer_full_name</th>`;
                htmlData += `<td>${data.customer.full_name}</td>`;
                htmlData += '</tr>';
            }

            if (data[key]._id !== undefined) {
                htmlData += '<tr>';
                htmlData += `<th>customer_id</th>`;
                htmlData += `<td>${data.customer._id}</td>`;
                htmlData += '</tr>';
            }

            // remove the processed customer field
            delete data.customer;
        } else if (key === 'deposit') {

            if (data[key]._id !== undefined) {
                htmlData += '<tr>';
                htmlData += `<th>deposit_id</th>`;
                htmlData += `<td>${data.deposit._id}</td>`;
                htmlData += '</tr>';
            }

            // remove the processed waste_type field
            delete data.waste_type;
        } else {
            htmlData += '<tr>';
            htmlData += `<th>${key}</th>`;
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

function deleteDataWithdrawal(data) {
    let generateTitle;
    let generateText;
    if (data.status === 'active') {
        generateText = data._id + " has been deleted";
        generateTitle = 'Confirm to delete ' + data._id + '?';
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
            fetch(baseUrlApi + 'withdrawal', {
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

async function createDataWithdrawal() {

    const checkMonth = moment().format('MMMM');
    if (checkMonth !== 'December') {
        Swal.fire({
            title: 'Withdrawals only in December',
            icon: 'error'
        })
    } else {
        fetch(baseUrlApi + 'withdrawal', {
            method: 'POST',  // Change to POST
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({date: moment()})
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.status) {
                    Swal.fire({
                        title: 'Failed to procces!',
                        text: res.message,
                        icon: 'error'
                    });
                } else {
                    Swal.fire({
                        title: 'Successfully Withdrawal!',
                        icon: 'success'
                    }).then((res) => {
                        filterSorting(undefined, 'same');
                        setBarChart();
                    });
                }

            })
    }

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
    fetch(baseUrlApi + 'withdrawal/table', {
        method: 'POST',  // Change to POST
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    })
        .then(res => res.json())
        .then(res => {
            const dataTable = res.result?.data;
            tableElement.querySelector('#loading').remove();
            if (dataTable?.length) {
                setBarChart();
                dataTable.forEach((element, index) => {
                    let customerNameConvert = element.customer.full_name.split(' ').map(each => each[0].toUpperCase() + each.slice(1)).join(' ');
                    const statusConvert = element.status[0].toUpperCase() + element.status.slice(1);

                    const amountConvert = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                    }).format(element.amount);
                    const parsedElement = JSON.stringify(element).replace(/"/g, "'");
                    const deleteBtn = `<img src="img/asset-14.png" onclick="deleteDataWithdrawal(${parsedElement})"/>`;

                    if (customerNameConvert.length > 20) customerNameConvert = customerNameConvert.slice(0, 20) + '...';

                    let newElement = '<tr>';
                    newElement += `<td>${element.createdAt}</td>`;
                    newElement += `<td>${amountConvert}</td>`;
                    newElement += `<td style="width: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${customerNameConvert}</td>`;
                    newElement += `<td style="text-align: center;">${statusConvert}</td>`;
                    newElement += `
                <td style="text-align: center;" class="th-action">
                    ${element.status === 'active' ? deleteBtn : ''}
                    <img src="img/asset-16.png" onclick="getDetailWithdrawal(${parsedElement})"/>
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

async function fetchAllData() {
    const bodyRequest = {
        filter: {status: 'active'},
        pagination: {page: 0, limit: 1000}
    };

    try {
        const response = await fetch(baseUrlApi + 'withdrawal/table', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(bodyRequest)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }


        const data = await response.json();
        return data.result.data;
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

// CHART
async function setBarChart() {
    const rawDataWithdrawal = await fetchAllData();
    let rawDataset = [];

    // REMOVE EXISTING CANVAS
    document.getElementById('barChart-withdrawal').remove();
    const canvasBar = document.createElement('canvas');
    canvasBar.id = 'barChart-withdrawal';
    document.querySelectorAll('.chart-deposit')[0].appendChild(canvasBar);

    rawDataWithdrawal.forEach(withdrawal => {
        const getYear = moment(withdrawal.createdAt).format('YYYY');
        let checkYear = rawDataset.find(data => data.years === getYear);
        if (!checkYear) {
            checkYear = {years: getYear, deposits: []};
            rawDataset.push(checkYear);
        }

        checkYear.deposits.push({id: withdrawal.customer, amount: withdrawal.amount});
    });

    // SUMMARY DISPLAY DATA
    const totalData = rawDataWithdrawal.length;
    let totalWithdrawal = rawDataWithdrawal.reduce((acc, current) => acc + current.amount, 0);
    const totalYears = rawDataset.length;

    document.querySelectorAll('.counter-item > .number')[0].innerText = formatNumber(totalData);
    document.querySelector('.counter-item > .number-deposit').innerText = formatNumber(totalWithdrawal);
    document.querySelectorAll('.counter-item > .number')[1].innerText = formatNumber(totalYears);

    const dataWasteType = {
        labels: rawDataset.map(data => data.years) || [],
        datasets: [{
            label: 'Withdrawal Per-year',
            data: rawDataset.map(data => data.deposits.reduce((acc, current) => acc + current.amount, 0)) || [],
            backgroundColor: [
                'rgba(54, 162, 235, 0.2)',
            ],
            borderColor: [
                'rgb(54, 162, 235)'
            ],
            borderWidth: 1
        }]
    };
    const configWasteType = {
        type: 'bar',
        data: dataWasteType,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        },
    };
    const ctxWasteType = document.getElementById('barChart-withdrawal').getContext('2d');
    new Chart(ctxWasteType, configWasteType);
}
