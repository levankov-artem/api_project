from flask import Flask, request, jsonify
import psycopg2

app = Flask(__name__)

conn = psycopg2.connect(
    dbname='postgres',
    user='postgres',
    password='qwerty',
    host='localhost',
    port='5432'
)

with conn.cursor() as cursor:
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY,
            status TEXT NOT NULL,
            QR_link TEXT NOT NULL,
            QR_id TEXT NOT NULL
        )
    ''')
    conn.commit()

@app.route('/order', methods=['POST'])
def create_order():
    data = request.get_json()

    if 'status' in data and 'QR_link' in data and 'QR_id' in data:
        status = data['status']
        QR_link = data['QR_link']
        QR_id = data['QR_id']

        if 'id' in data:
            order_id = data['id']
            
            # Check if the specified 'id' already exists
            with conn.cursor() as cursor:
                cursor.execute('SELECT id FROM orders WHERE id = %s', (order_id,))
                existing_id = cursor.fetchone()

            if existing_id:
                return jsonify({'error': f'Order with id {order_id} already exists'}), 400
            else:
                # Insert the order into the database with the specified id
                with conn.cursor() as cursor:
                    cursor.execute('INSERT INTO orders (id, status, QR_link, QR_id) VALUES (%s, %s, %s, %s)', (order_id, status, QR_link, QR_id))
                    conn.commit()

        # Return the created order
        return jsonify({'id': order_id, 'status': status}), 201
    else:
        return jsonify({'error': 'Missing status in the request'}), 400

@app.route('/order/<order_id>', methods=['GET'])
def get_order_status(order_id):
    # Retrieve the order from the database
    with conn.cursor() as cursor:
        cursor.execute('SELECT * FROM orders WHERE id = %s', (order_id,))
        result = cursor.fetchone()

    if result:
        order_id, status, QR_link, QR_id = result
        # Return the status of the order
        return jsonify({'id': order_id, 'status': status, 'QR_link': QR_link, 'QR_id': QR_id})
    else:
        return jsonify({'error': f'Order with id {order_id} not found'}), 404

@app.route('/orders', methods=['GET'])
def get_all_orders():
    # Retrieve all orders from the database
    with conn.cursor() as cursor:
        cursor.execute('SELECT * FROM orders')
        results = cursor.fetchall()

    # Return a list of all orders
    orders = [{'id': order_id, 'status': status, 'QR_link': QR_link, 'QR_id': QR_id} for order_id, status, QR_link, QR_id in results]
    return jsonify({'orders': orders})

@app.route('/order/<order_id>', methods=['PUT'])
def update_order_status(order_id):
    data = request.get_json()

    if 'status' not in data:
        return jsonify({'error': 'Missing status in the request'}), 400

    new_status = data['status']

    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute('UPDATE orders SET status = %s WHERE id = %s RETURNING id', (new_status, order_id))
                updated_order_id = cursor.fetchone()

            if updated_order_id:
                return jsonify({'id': updated_order_id[0], 'status': new_status}), 200
            else:
                return jsonify({'error': f'Order with id {order_id} not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/order/<order_id>', methods=['DELETE'])
def delete_order(order_id):
    with conn.cursor() as cursor:
        # Check if the order exists
        cursor.execute('SELECT id FROM orders WHERE id = %s', (order_id,))
        existing_order = cursor.fetchone()

        if existing_order:
            # Delete the order
            cursor.execute('DELETE FROM orders WHERE id = %s', (order_id,))
            conn.commit()
            return jsonify({'message': f'Order with id {order_id} successfully deleted'}), 200
        else:
            return jsonify({'error': f'Order with id {order_id} not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)