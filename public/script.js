document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const taskForm = document.getElementById('task-form');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const statusInput = document.getElementById('status');
    const tasksList = document.getElementById('tasks-list');
    const submitBtn = document.getElementById('submit-btn');
    const updateBtn = document.getElementById('update-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const filterSelect = document.getElementById('filter');
    
    let tasks = [];
    let currentTaskId = null;
    
    // Load tasks when page loads
    fetchTasks();
    
    // Event listeners
    taskForm.addEventListener('submit', handleFormSubmit);
    updateBtn.addEventListener('click', handleUpdateTask);
    cancelBtn.addEventListener('click', resetForm);
    filterSelect.addEventListener('change', renderTasks);
    
    // Fetch all tasks from API
    function fetchTasks() {
        fetch('/api/tasks')
            .then(response => response.json())
            .then(data => {
                tasks = data;
                renderTasks();
            })
            .catch(error => {
                console.error('Error fetching tasks:', error);
                alert('Failed to load tasks. Please try again.');
            });
    }
    
    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const task = {
            title: titleInput.value,
            description: descriptionInput.value,
            status: statusInput.value
        };
        
        fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            tasks.unshift(data); // Add to beginning of array
            renderTasks();
            resetForm();
        })
        .catch(error => {
            console.error('Error adding task:', error);
            alert('Failed to add task. Please try again.');
        });
    }
    
    // Handle task update
    function handleUpdateTask() {
        if (!currentTaskId) return;
        
        const task = {
            title: titleInput.value,
            description: descriptionInput.value,
            status: statusInput.value
        };
        
        fetch(`/api/tasks/${currentTaskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            // Update task in array
            const index = tasks.findIndex(t => t.id == currentTaskId);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...task };
            }
            
            renderTasks();
            resetForm();
        })
        .catch(error => {
            console.error('Error updating task:', error);
            alert('Failed to update task. Please try again.');
        });
    }
    
    // Handle task deletion
    function handleDeleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            // Remove task from array
            tasks = tasks.filter(task => task.id != id);
            renderTasks();
            
            // Reset form if we're editing the task that was deleted
            if (currentTaskId == id) {
                resetForm();
            }
        })
        .catch(error => {
            console.error('Error deleting task:', error);
            alert('Failed to delete task. Please try again.');
        });
    }
    
    // Fill form with task data for editing
    function editTask(id) {
        const task = tasks.find(task => task.id == id);
        if (!task) return;
        
        titleInput.value = task.title;
        descriptionInput.value = task.description || '';
        statusInput.value = task.status;
        
        submitBtn.style.display = 'none';
        updateBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
        
        currentTaskId = id;
        
        // Scroll to form
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    }
    
    // Reset the form
    function resetForm() {
        taskForm.reset();
        submitBtn.style.display = 'inline-block';
        updateBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        currentTaskId = null;
    }
    
    // Render tasks to DOM
    function renderTasks() {
        tasksList.innerHTML = '';
        
        const filterValue = filterSelect.value;
        let filteredTasks = tasks;
        
        if (filterValue !== 'all') {
            filteredTasks = tasks.filter(task => task.status === filterValue);
        }
        
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '<p>No tasks found.</p>';
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');
            
            // Format date
            const createdDate = new Date(task.created_at);
            const formattedDate = createdDate.toLocaleDateString() + ' ' + 
                                 createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            taskItem.innerHTML = `
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-status status-${task.status}">${formatStatus(task.status)}</div>
                </div>
                <div class="task-description">${task.description || 'No description'}</div>
                <div class="task-date">Created: ${formattedDate}</div>
                <div class="task-actions">
                    <button class="edit-btn" data-id="${task.id}">Edit</button>
                    <button class="delete-btn" data-id="${task.id}">Delete</button>
                </div>
            `;
            
            // Add event listeners to buttons
            taskItem.querySelector('.edit-btn').addEventListener('click', function() {
                editTask(this.getAttribute('data-id'));
            });
            
            taskItem.querySelector('.delete-btn').addEventListener('click', function() {
                handleDeleteTask(this.getAttribute('data-id'));
            });
            
            tasksList.appendChild(taskItem);
        });
    }
    
    // Format status for display
    function formatStatus(status) {
        switch(status) {
            case 'pending':
                return 'Pending';
            case 'in-progress':
                return 'In Progress';
            case 'completed':
                return 'Completed';
            default:
                return status;
        }
    }
});