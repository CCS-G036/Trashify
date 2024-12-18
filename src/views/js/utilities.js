const baseUrlApi = 'http://localhost:3000/';

function formatNumber(value) {
    if (value >= 1000000) {
        const millions = parseFloat(value / 1000000).toFixed(1);
        return `${millions}jt`;
    } else if (value >= 1000) {
        const thousands = parseFloat(value / 1000).toFixed(1);
        return `${thousands}k`;
    } else {
        return `${value}`;
    }
}

// INPUT DATA
function deleteInput() {
    document.querySelectorAll('.swal2-html-container > div')[inputCount].remove();
    inputCount--;
}

// FILTER SORTING
function filterSorting(element, paginationType) {
    const delay = element || paginationType !== 'same' ? 0 : 1000;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        let sorting = {};
        let filter = {};
        let pagination = {};

        if (element) {
            let status = parseInt(element.getAttribute('data-sort')) || 0;
            const originalText = element.innerText.replace(/[↓↑]/g, '');

            // Update status
            status = (status + 1) % 3;
            resetHeadersAndStatus(element, originalText);
            updateSortingText(element, originalText, status);
            element.setAttribute('data-sort', status);

            if (status > 0) {
                sorting[element.getAttribute('name')] = status === 1 ? 1 : -1;
            }
        }

        sorting = {...sorting, ...collectSortingData()};
        filter = collectFilterData();
        pagination = collectPagination(paginationType);
        fetchDataTable({filter, sorting, pagination});
    }, delay);
}

function updateSortingText(element, originalText, status) {
    if (element.getAttribute('name').split('-')[1] !== 'page') {
        element.innerText = originalText;
        if (status === 1) {
            element.innerText += '↑';
        } else if (status === 2) {
            element.innerText += '↓';
        }
    }
}

function resetHeadersAndStatus(element, originalText) {
    document.querySelectorAll('.waste-type-table > thead > tr > th > div:nth-child(1)').forEach(el => {
        el.innerText = el.innerText.replace(/[↓↑]/g, '');
        if (el.innerText !== originalText) {
            el.setAttribute('data-sort', 0);
        }
    });
}

function collectSortingData() {
    const sorting = {deposit_date: 'asc'};
    document.querySelectorAll('.waste-type-table > thead > tr > th > div:nth-child(1)').forEach(header => {
        const sortStatus = parseInt(header.getAttribute('data-sort'));
        if (sortStatus > 0) {
            sorting[header.getAttribute('name')] = sortStatus === 1 ? 1 : -1;
        }
    });
    return sorting;
}

function collectFilterData() {
    const filter = {status: 'active'};
    document.querySelectorAll('input, select').forEach(input => {
        if (input.value && input.getAttribute('name')) {
            filter[input.getAttribute('name')] = input.value;
        }
    });
    return filter;
}

// PAGINATION
function collectPagination(paginationType) {
    const pagination = {};
    const limit = 10;
    const getAllSpanPagination = document.querySelectorAll('.pagination > span');
    getAllSpanPagination.forEach((each) => {
        if (each.getAttribute('name') === 'active-page' && paginationType) {
            let activePage = parseInt(each.innerText);
            if (paginationType === 'next') {
                each.innerText = activePage + 1;
                pagination.page = each.innerText;
            } else if (paginationType === 'prev') {
                if (activePage <= 1) return false;
                each.innerText = activePage - 1;
                pagination.page = each.innerText;
            } else if (paginationType === 'last') {
                const totalData = parseInt(document.getElementsByName('last-page')[0].getAttribute('data-page'));
                const lastPage = Math.ceil(totalData / limit);
                each.innerText = lastPage < 1 ? 1 : lastPage;
                pagination.page = each.innerText;
            } else if (paginationType === 'first') {
                if (activePage <= 1) return false;
                each.innerText = 1;
                pagination.page = 1;
            } else {
                pagination.page = activePage;
            }


        }
    });

    pagination.page = parseInt(pagination.page);
    pagination.limit = limit;
    return pagination;
}

function resetFilter() {
    document.querySelectorAll('.waste-type-table > thead > tr > th').forEach(each => {
        if (each.innerText.includes('↑') || each.innerText.includes('↓')) {
            const getText = each.querySelector('div');
            getText.setAttribute('data-sort', 0);
            resetHeadersAndStatus(each, getText.innerText.replace(/[↓↑]/g, ''));
        }

        const inputElement = each.querySelector('input, div > input') ?? null;
        inputElement ? inputElement.value = '' : null

        const selectElement = each.querySelector('select');

        if (selectElement) {
            const typeSelectElement = selectElement.getAttribute('name');
            if (typeSelectElement === 'status') {
                selectElement.value = 'active';
            } else if (typeSelectElement === 'withdrawal_decision') {
                selectElement.value = 'yes';
            }
        }
    });
    filterSorting(undefined, 'reset');
}