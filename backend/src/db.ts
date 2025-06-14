import mysql from 'mysql2/promise';

// Create a connection pool
export const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mycrm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to the database');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  }); 