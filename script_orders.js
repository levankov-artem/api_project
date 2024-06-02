function fetchOrders() {
    fetch('https://api-project-auq5.onrender.com/orders')
        .then(response => response.json())
        .then(data => displayOrders(data.orders))
        .catch(error => console.error('Error fetching orders:', error));
}

function displayOrders(orders) {
    const tableBody = document.getElementById('ordersBody');
    tableBody.innerHTML = '';

    orders.forEach(order => {
        const row = tableBody.insertRow();
        const idCell = row.insertCell(0);
        const statusCell = row.insertCell(1);
        const deleteCell = row.insertCell(2);

        idCell.textContent = order.id;
        statusCell.textContent = order.status;

        // Create a delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = function() { deleteOrder(order.id); };
        deleteCell.appendChild(deleteButton);
    });
}

function deleteOrder(orderId) {
    fetch(`https://api-project-auq5.onrender.com/order/${orderId}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                console.log(`Order ${orderId} deleted`);
                fetchOrders(); // Refresh the list
            } else {
                console.error(`Failed to delete order ${orderId}`);
            }
        })
        .catch(error => console.error('Error deleting order:', error));
}
