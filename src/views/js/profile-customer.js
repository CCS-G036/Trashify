function editDataCustomer(rawData) {
    const data = JSON.parse(rawData);
    const tables = `
        <table class='sa-input' style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="border-bottom: 1px solid #ddd;">
        <th style="text-align: left; padding: 10px; font-weight: bold; width: 30%;">Name</th>
        <td style="padding: 10px;">
            <input type="text" value="${data.full_name.replace(/\b\w/g, char => char.toUpperCase())}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">    
        </td>
    </tr>
    <tr style="border-bottom: 1px solid #ddd;">
        <th style="text-align: left; padding: 10px; font-weight: bold;">Gender</th>
        <td style="padding: 10px;">
            <select style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
        </td>
    </tr>
    <tr style="border-bottom: 1px solid #ddd;">
        <th style="text-align: left; padding: 10px; font-weight: bold;">Phone</th>
        <td style="padding: 10px;">
            <input type="number" value="${data.phone_number}" min="0" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">    
        </td>
    </tr>
    <tr style="border-bottom: 1px solid #ddd;">
        <th style="text-align: left; padding: 10px; font-weight: bold;">Address</th>
        <td style="padding: 10px;">
            <textarea style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">${data.address.replace(/\b\w/g, char => char.toUpperCase())}</textarea>
        </td>
    </tr>
    <tr style="border-bottom: 1px solid #ddd;">
        <th style="text-align: left; padding: 10px; font-weight: bold;">Decision</th>
        <td style="padding: 10px;">
            <select style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                <option value="yes">Yes</option>
                <option value="no">No</option>
            </select>
        </td>
    </tr>
</table>

        `;

    Swal.fire({
        title: 'Edit data ' + data.full_name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
        html: tables,
        confirmButtonText: 'Save',
        confirmButtonColor: 'gold',
        showCancelButton: true,
    }).then((result) => {
        const getNameValue = document.querySelectorAll('.sa-input input')[0].value;
        const getPhoneValue = document.querySelectorAll('.sa-input input')[1].value;
        const getAdressValue = document.querySelector('.sa-input textarea').value;
        const getGenderValue = document.querySelectorAll('.sa-input select')[0].value;
        const getDecisionValue = document.querySelectorAll('.sa-input select')[1].value;
        const bodyRequest = {
            full_name: getNameValue,
            phone_number: getPhoneValue,
            gender: getGenderValue,
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
                            window.location.reload();
                        });
                    }

                })
        }
    });
}