const tableElement = document.querySelector('#data-table-customer');

let timeout;
let inputCount = 0;

filterSorting(undefined, 'same');

// CRUD
function getDetailCustomer(data) {
    return window.location.href = `/customer/${data._id}`;
}

function editDataCustomer(data) {
    const tables = `
    <table class="sa-input" style="width: 100%; max-width: 600px; margin: 20px auto; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 16px; color: #333; background: #f9f9f9; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
    <tr>
        <th style="background: #4CAF50; color: white; font-weight: bold; padding: 15px 20px; text-align: left;">
            Name
        </th>
        <td style="padding: 15px 20px; text-align: left;">
            <input type="text" value="${data.full_name.replace(/\b\w/g, char => char.toUpperCase())}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
        </td>
    </tr>
    <tr style="background: #f2f2f2;">
        <th style="background: #4CAF50; color: white; font-weight: bold; padding: 15px 20px; text-align: left;">
            Phone
        </th>
        <td style="padding: 15px 20px; text-align: left;">
            <input type="number" value="${data.phone_number}" min="0" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
        </td>
    </tr>
    <tr>
        <th style="background: #4CAF50; color: white; font-weight: bold; padding: 15px 20px; text-align: left;">
            Address
        </th>
        <td style="padding: 15px 20px; text-align: left;">
            <textarea style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">${data.address.replace(/\b\w/g, char => char.toUpperCase())}</textarea>
        </td>
    </tr>
    <tr style="background: #f2f2f2;">
        <th style="background: #4CAF50; color: white; font-weight: bold; padding: 15px 20px; text-align: left;">
            Decision
        </th>
        <td style="padding: 15px 20px; text-align: left;">
            <select style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                <option value="yes">Yes</option>
                <option value="no">No</option>
            </select>
        </td>
    </tr>
</table>

    `;

    Swal.fire({
        title: 'Edit data ' + data.full_name.replace(/\b\w/g, char => char.toUpperCase()),
        html: tables,
        confirmButtonText: 'Save',
        confirmButtonColor: 'gold',
        showCancelButton: true,
    }).then((result) => {
        const getNameValue = document.querySelectorAll('.sa-input input')[0].value;
        const getPhoneValue = document.querySelectorAll('.sa-input input')[1].value;
        const getAdressValue = document.querySelector('.sa-input textarea').value;
        const getDecisionValue = document.querySelector('.sa-input select').value;
        const bodyRequest = {
            full_name: getNameValue,
            phone_number: getPhoneValue,
            address: getAdressValue,
            withdrawal_decision: getDecisionValue
        };
        if (result.isConfirmed) {
            fetch(baseUrlApi + 'customer', {
                method: 'PUT',  // Change to POST
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: data._id, input: bodyRequest})
            })
                .then((res) => res.json())
                .then((res) => {
                    if (res.status) {
                        Swal.fire({
                            title: "Failed to edit!",
                            text: res.message,
                            icon: "error"
                        });
                    } else {
                        Swal.fire({
                            title: 'Successfully Updated!',
                            icon: "success"
                        }).then((res) => {
                            filterSorting();
                        });
                    }

                })
        }
    });
}

function deleteDataCustomer(data) {
    let generateTitle;
    let generateText;
    if (data.status === 'active') {
        generateText = data.full_name + " has been deleted";
        generateTitle = 'Confirm to delete ' + data.full_name.replace(/\b\w/g, char => char.toUpperCase()) + '?';
    } else {
        generateText = data.full_name + " has been reactivated";
        generateTitle = 'Confirm to re-active ' + data.full_name.replace(/\b\w/g, char => char.toUpperCase()) + '?';
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
            fetch(baseUrlApi + 'customer', {
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

function createDataCustomer() {
    const tables = `
    <div class='reset-btn sa' style="margin-bottom: 20px; text-align: center;">
    <button onclick='addMoreInput()' style="padding: 10px 20px; font-size: 16px; background-color: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.3s;">
        Add More+
    </button>
</div>

<table class='sa-input' data-count-input=${inputCount} style="width: 100%; max-width: 800px; margin: 0 auto; border-collapse: collapse;">
    <tr>
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333;">
            Name
        </th>
        <td style="padding: 12px;">
            <input type="text" value="" placeholder="Name.." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
        </td>
    </tr>
    <tr>
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333;">
            Gender
        </th>
        <td style="padding: 12px;">
            <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
        </td>
    </tr>
    <tr>
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333;">
            Phone
        </th>
        <td style="padding: 12px;">
            <input type="number" value="" min="0" placeholder="Phone Number.." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
        </td>
    </tr>
    <tr>
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333;">
            Address
        </th>
        <td style="padding: 12px;">
            <textarea placeholder="Address.." style="width: 100%; height: 120px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;"></textarea>
        </td>
    </tr>
    <tr>
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333;">
            Decision
        </th>
        <td style="padding: 12px;">
            <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
                <option value="yes">Yes</option>
                <option value="no">No</option>
            </select>
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
            const getNameValue = e.querySelectorAll('.sa-input input')[0].value;
            const getPhoneValue = e.querySelectorAll('.sa-input input')[1].value;
            const getAdressValue = e.querySelector('.sa-input textarea').value;
            const getGenderValue = document.querySelectorAll('.sa-input select')[0].value;
            const getDecisionValue = e.querySelectorAll('.sa-input select')[1].value;
            bodyRequest.push({
                full_name: getNameValue.toLowerCase(),
                gender: getGenderValue,
                phone_number: getPhoneValue ?? 0,
                address: getAdressValue.toLowerCase(),
                withdrawal_decision: getDecisionValue.toLowerCase()
            });
        });

        if (result.isConfirmed) {
            fetch(baseUrlApi + 'customer', {
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
                            filterSorting();
                        });
                    }

                })
        } else {
            inputCount = 0;
        }
    });
}

// INPUT DATA
function addMoreInput() {
    inputCount++;
    document.querySelector('.swal2-html-container').innerHTML += `
    <div data-count-input=${inputCount}>
        <br>
    <div class='reset-btn sa'>
        <button hidden></button>
        <button hidden></button>
        <button onclick='deleteInput()'>Delete</button>
    </div>
      <table class='sa-input' data-count-input=${inputCount} style="width: 100%; max-width: 800px; margin: 0 auto; border-collapse: collapse;">
    <tr>
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333;">
            Name
        </th>
        <td style="padding: 12px;">
            <input type="text" value="" placeholder="Name.." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
        </td>
    </tr>
    <tr>
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333;">
            Gender
        </th>
        <td style="padding: 12px;">
            <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
        </td>
    </tr>
    <tr>
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333;">
            Phone
        </th>
        <td style="padding: 12px;">
            <input type="number" value="" min="0" placeholder="Phone Number.." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
        </td>
    </tr>
    <tr>
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333;">
            Address
        </th>
        <td style="padding: 12px;">
            <textarea placeholder="Address.." style="width: 100%; height: 120px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;"></textarea>
        </td>
    </tr>
    <tr>
        <th style="text-align: left; padding: 12px; background-color: #f4f4f4; font-weight: 600; color: #333;">
            Decision
        </th>
        <td style="padding: 12px;">
            <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
                <option value="yes">Yes</option>
                <option value="no">No</option>
            </select>
        </td>
    </tr>
</table>
  </div>
    `;
}

// FETCH DATA
function fetchDataTable(bodyRequest) {
    const body = bodyRequest;
    tableElement.innerHTML = '';
    const tableElementContainer = document.querySelector('.waste-type-table:nth-child(2) > thead');
    tableElement.innerHTML += `
    <tr id='loading'>
        <td colspan='7' style='text-align: center;'>
            <img src='https://cdn.pixabay.com/animation/2022/07/29/03/42/03-42-05-37_512.gif' width='25%'/>
        </td>
    </tr>
    `;
    fetch(baseUrlApi + 'customer/table', {
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
                    let nameConvert = element.full_name.split(' ').map(each => each[0].toUpperCase() + each.slice(1)).join(' ');
                    let addressConvert = element.address[0].toUpperCase() + element.address.slice(1);

                    if (nameConvert.length > 20) nameConvert = nameConvert.slice(0, 20) + '...';
                    if (addressConvert.length > 20) addressConvert = addressConvert.slice(0, 20) + '...';
                    const statusConvert = element.status[0].toUpperCase() + element.status.slice(1);
                    const depositConvert = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                    }).format(element.balance.deposit);
                    const withdrawConvert = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                    }).format(element.balance.withdrawal);
                    const decisionConvert = element.withdrawal_decision[0].toUpperCase() + element.withdrawal_decision.slice(1);
                    const parsedElement = JSON.stringify(element).replace(/"/g, "'");

                    let newElement = '<tr>';
                    // newElement += `<td style="text-align: center;"> ${index+1}</td>`;
                    newElement += `<td style="width: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nameConvert}</td>`;
                    newElement += `<td>${element.phone_number !== 'unknown' ? element.phone_number : '-'}</td>`;
                    newElement += `<td style="width: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${addressConvert}</td>`;
                    newElement += `<td>${depositConvert.replace("₹", "₹ ")}</td>`;
                    newElement += `<td>${withdrawConvert.replace("₹", "₹ ")}</td>`;
                    newElement += `<td>${element.join_date}</td>`;
                    newElement += `<td style="text-align: center;">${decisionConvert}</td>`;
                    newElement += `<td style="text-align: center;">${statusConvert}</td>`;
                    newElement += `
                <td style="text-align: center;" class="th-action">
                    <img src="img/asset-15.png" onclick="editDataCustomer(${parsedElement})"/>
                    <img src="img/asset-14.png" onclick="deleteDataCustomer(${parsedElement})"/>
                    <img src="img/asset-16.png" onclick="getDetailCustomer(${parsedElement})"/>
                </td>`;

                    newElement += '</tr>';
                    tableElement.innerHTML += newElement;
                    document.getElementsByName('last-page')[0].setAttribute('data-page', element.amount_data ?? 0);
                });
            } else {
                tableElement.innerHTML += `
            <tr>
                <td colspan='10' style='text-align:center; padding: 20px;'>No result.</td>
            </tr>
            `;
            }

        });
}

// SUMMARY DATA
function summaryData() {
    const body = {
        pagination: {
            page: 0, limit: 1000
        }
    };
    fetch(baseUrlApi + 'customer/table', {
        method: 'POST',  // Change to POST
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    })
        .then(res => res.json())
        .then(res => {
            const rawData = res.result.data;
            const totalCustomers = rawData.length;
            const totalCustomerActive = rawData.filter(each => each.status === 'active').length;
            const totalCustomerDeleted = rawData.filter(each => each.status === 'deleted').length;

            document.querySelectorAll('.counter-item > .number')[0].innerText = formatNumber(totalCustomers);
            document.querySelectorAll('.counter-item > .number')[1].innerText = formatNumber(totalCustomerActive);
            document.querySelectorAll('.counter-item > .number')[2].innerText = formatNumber(totalCustomerDeleted);
        });
}