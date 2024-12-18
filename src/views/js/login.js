document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;

    const inputBody = {username, password};

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputBody)
    })
        .then(response => response.json())
        .then(result => {
            if (result.status && result.status !== 200) {
                Swal.fire({
                    icon: "error",
                    title: result.message
                });
            } else {
                window.location.href = '/';
            }

        })
});