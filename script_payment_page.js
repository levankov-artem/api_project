var qrId;
var QR_id;
var paymentStatusPoll; // Global variable to manage the polling interval
var qrDisplayed = false;
var email;

document.getElementById('emailForm').addEventListener('submit', function(event) {
    event.preventDefault();
    email = document.getElementById('email').value;
    if (validateEmail(email)) {
        if (!qrDisplayed) { // Check if the QR code has not been displayed yet
            checkOrderExistsAndDisplayQR(idValue);
        } else {
            alert('QR code has already been displayed.');
        }
    } else {
        alert('Please enter a valid email address.');
    }
});

function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function generateReceiptNumber() {
    return Math.floor(Math.random() * 9000000000000) + 1000000000000; // Generates a 13-digit random number
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var idValue = getParameterByName('id');
var totalAmountValue = getParameterByName('total_amount');
var currencyValue = getParameterByName('currency');

var idAsString = String(idValue);

var apiRequestUrl = `https://pay-test.raif.ru/api/sbp/v2/qrs`;

var jsonBodyOrder = {
    qrType: "QRStatic",
    sbpMerchantId: "MA622976",
    amount: totalAmountValue,
    currency: currencyValue,
    order: idAsString
};

function checkOrderExistsAndDisplayQR(orderId) {
    fetch(`https://api-project-auq5.onrender.com/order/${orderId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.QR_link) {
            displayQRCode(data.QR_link);
            startPaymentStatusPolling(String(data.QR_id)); // Start polling
        } else {
            createAndDisplayNewOrder();
        }
    })
    .catch(error => console.error('Error:', error));
}

function displayQRCode(qrUrl) {
    if (!qrDisplayed) {
        var qrImageContainer = document.getElementById('qrImageContainer');
        qrImageContainer.style.display = 'block';
        var img = document.createElement('img');
        img.src = qrUrl;
        qrImageContainer.appendChild(img);
        qrDisplayed = true;
    }
}
function createAndDisplayNewOrder() {
    fetch(apiRequestUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonBodyOrder)
    })
    .then(response => response.json())
    .then(data => {
        console.log('API response:', data);
        var qrImageUrl = data.qrUrl;
        displayQRCode(qrImageUrl);
        qrId = String(data.qrId);
        sendPostRequest(idValue, 'not paid', qrImageUrl, qrId);
        startPaymentStatusPolling(qrId); // Start polling
    })
    .catch(error => console.error('Error:', error));
}

function checkPaymentStatus(qrId) {
    fetch(`https://api-project-auq5.onrender.com/check_payment_status/${qrId}`)
    .then(response => response.json())
    .then(data => {
        console.log('Payment Info response:', data);

        var notificationContainer = document.getElementById('notification');

        if (data.paymentStatus === 'SUCCESS') {
            notificationContainer.innerHTML = 'Payment Status: Paid';
            sendPutRequest(idValue, 'paid');
            clearInterval(paymentStatusPoll);
            createReceipt();
        }
    })
    .catch(error => {
        console.error('Error checking payment status:', error);
    });
}

function createReceipt() {
    var receiptData = {
        receiptNumber: generateReceiptNumber().toString(),
        client: {
            email: email.toString()  // use the globally available email variable
        },
        items: [
            {
                name: "Online psychologist services",
                price: totalAmountValue,
                quantity: 1,
                amount: totalAmountValue,
                vatType: "NONE"
            }
        ],
        total: totalAmountValue
    };

    var url = "https://test.ecom.raiffeisen.ru/api/fiscal/v1/receipts/sell";

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJNQTYyMjk3NiIsImp0aSI6ImM5MTBjNGU4LTRhZmMtNDBlMS04ZGU3LWVlODg2N2JiOGU3NCJ9.rnPFEsixy9Wr4GhxT9D9s8dlBg5dRKWMLPfxl48oHAo'
        },
        body: JSON.stringify(receiptData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Receipt creation response:', data);
        updateReceipt(data.receiptNumber);
    })
    .catch(error => console.error('Error creating receipt:', error));
}

function updateReceipt(receiptNumber) {
    var url = `https://test.ecom.raiffeisen.ru/api/fiscal/v1/receipts/sell/${receiptNumber}`;

    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJNQTYyMjk3NiIsImp0aSI6ImM5MTBjNGU4LTRhZmMtNDBlMS04ZGU3LWVlODg2N2JiOGU3NCJ9.rnPFEsixy9Wr4GhxT9D9s8dlBg5dRKWMLPfxl48oHAo'
        }
    })
    .then(response => response.json())
    .then(data => console.log('Receipt update response:', data))
    .catch(error => console.error('Error updating receipt:', error));

    startReceiptStatusPolling(receiptNumber);
}

function statusCheckReceipt(receiptNumber) {
    var url = `https://test.ecom.raiffeisen.ru/api/fiscal/v1/receipts/sell/${receiptNumber}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJNQTYyMjk3NiIsImp0aSI6ImM5MTBjNGU4LTRhZmMtNDBlMS04ZGU3LWVlODg2N2JiOGU3NCJ9.rnPFEsixy9Wr4GhxT9D9s8dlBg5dRKWMLPfxl48oHAo'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Receipt update response:', data);
        if (data.status === 'DONE') {
            var url = document.getElementById('url');
            url.innerHTML = `Here is your receipt: <a href="${data.ofdUrl}" target="_blank">View Receipt</a>`;
            clearInterval(receiptStatusPoll);
        }
    })
    .catch(error => {
        console.error('Error updating receipt:', error);
        document.getElementById('notification').innerText = 'Error updating receipt.';
    });
}

function startPaymentStatusPolling(qrId) {
    var pollInterval1 = 500; // Poll every 500 milliseconds (0.5 seconds)
    paymentStatusPoll = setInterval(function() {
        checkPaymentStatus(qrId);
    }, pollInterval1);
}

function startReceiptStatusPolling(receiptNumber) {
    var pollInterval2 = 1000; // Poll every 1000 milliseconds (1 seconds)
    receiptStatusPoll = setInterval(function() {
        statusCheckReceipt(receiptNumber);
    }, pollInterval2);
}

function sendPostRequest(id, status, QR_link, QR_id) {
    fetch(`https://api-project-auq5.onrender.com/order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, status: status, QR_link: QR_link, QR_id: QR_id })
    })
    .then(response => response.json())
    .then(data => console.log('Post request response:', data))
    .catch(error => console.error('Error sending POST request:', error));
}

function sendPutRequest(id, new_status) {
    fetch(`https://api-project-auq5.onrender.com/order/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: new_status })
    })
    .then(response => response.json())
    .then(data => console.log('Put request response:', data))
    .catch(error => console.error('Error sending PUT request:', error));
}
