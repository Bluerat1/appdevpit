import { useState, useEffect } from "react";
import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "https://appdevpit.onrender.com/api/todos/";
const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default function TodoList() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/");
        setTasks(response.data);
        setError("");
      } catch (error) {
        console.log("Full error object", error);
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchTasks();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const addTask = async () => {
    if (!task.trim()) {
      setError("Task cannot be empty!");
      return;
    }
    
    try {
      const newTask = { title: task, completed: false };
      const response = await axiosInstance.post("/", newTask);
      setTasks([...tasks, response.data]);
      setTask("");
      setError("");
    } catch (error) {
      setError("Failed to add task. Please try again.");
      console.error("Error adding task:", error);
    }
  };

  const removeTask = async (id) => {
    try {
      await axiosInstance.delete(`/${id}/`);
      setTasks(tasks.filter((task) => task.id !== id));
      setError("");
    } catch (error) {
      setError("Failed to delete task. Please try again.");
      console.error("Error deleting task:", error);
    }
  };

  const editTask = (id) => {
    const taskToEdit = tasks.find((task) => task.id === id);
    if (taskToEdit) {
      setEditingId(id);
      setEditText(taskToEdit.title);
    }
  };

  const handleSave = async () => {
    if (!editText.trim()) {
      setError("Task cannot be empty!");
      return;
    }
    
    try {
      const updatedTask = { title: editText };
      await axiosInstance.patch(`/${editingId}/`, updatedTask);
      setTasks(tasks.map(task =>
        task.id === editingId ? { ...task, title: editText } : task
      ));
      setEditingId(null);
      setError("");
    } catch (error) {
      setError("Failed to update task. Please try again.");
      console.error("Error updating task:", error);
    }
  };

  const toggleCompletion = async (id) => {
    try {
      const taskToToggle = tasks.find((task) => task.id === id);
      const updatedTask = { completed: !taskToToggle.completed };
      
      await axiosInstance.patch(`/${id}/`, updatedTask);
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ));
      setError("");
    } catch (error) {
      setError("Failed to update task status. Please try again.");
      console.error("Error toggling task completion:", error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "Completed") return task.completed;
    if (filter === "Pending") return !task.completed;
    return true;
  });

  return (
    <div className="app">
      <div className="header">
        <h2>To-Do List</h2>
        <button className="dark-mode-toggle" onClick={toggleDarkMode}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div className="task-input">
        <input
          type="text"
          placeholder="Add a new task..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTask()}
        />
        <button onClick={addTask}>Add Task</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-buttons">
        <button onClick={() => setFilter("All")}>All</button>
        <button onClick={() => setFilter("Completed")}>Completed</button>
        <button onClick={() => setFilter("Pending")}>Pending</button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading tasks...</div>
      ) : (
        <ul className="task-list">
          {filteredTasks.map((task) => (
            <li key={task.id} className={`task-item ${task.completed ? "completed" : ""}`}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleCompletion(task.id)}
              />
              {editingId === task.id ? (
                <>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                  />
                  <button onClick={handleSave}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span>{task.title}</span>
                  <div className="task-actions">
                    <button onClick={() => editTask(task.id)}>Edit</button>
                    <button onClick={() => removeTask(task.id)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
