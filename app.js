const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',  // Default XAMPP MySQL password is empty
    database: 'task_manager'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Routes
// Get all tasks
app.get('/api/tasks', (req, res) => {
    const query = 'SELECT * FROM tasks ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            return res.status(500).json({ error: 'Error fetching tasks' });
        }
        res.json(results);
    });
});

// Add a new task
app.post('/api/tasks', (req, res) => {
    const { title, description, status } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const query = 'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)';
    db.query(query, [title, description, status || 'pending'], (err, result) => {
        if (err) {
            console.error('Error adding task:', err);
            return res.status(500).json({ error: 'Error adding task' });
        }
        
        const newTask = {
            id: result.insertId,
            title,
            description,
            status: status || 'pending',
            created_at: new Date()
        };
        
        res.status(201).json(newTask);
    });
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, status } = req.body;
    
    const query = 'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?';
    db.query(query, [title, description, status, taskId], (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            return res.status(500).json({ error: 'Error updating task' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json({ id: taskId, title, description, status });
    });
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    
    const query = 'DELETE FROM tasks WHERE id = ?';
    db.query(query, [taskId], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).json({ error: 'Error deleting task' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json({ message: 'Task deleted successfully' });
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});