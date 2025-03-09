import React, { useState, useEffect } from "react";
import "./App.css";
import {
  addNote,
  getNotes,
  updateNote,
  deleteNote,
  loginUser,
  logoutUser,
  authStateChanged,
} from "./firebase";

interface Note {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  uid: string;
  status: "todo" | "inprogress" | "done";
}

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"todo" | "inprogress" | "done">("todo");
  const [editId, setEditId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    authStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) showNotification(`Selamat datang, ${currentUser.email}!`);
    });
    const unsubscribe = getNotes((data) => {
      const notesData = data || {};
      Object.keys(notesData).forEach((key) => {
        if (!notesData[key].status || !["todo", "inprogress", "done"].includes(notesData[key].status)) {
          notesData[key].status = "todo";
        }
      });
      setNotes(notesData);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    if (!email || !password) {
      showNotification("Email dan password harus diisi!");
      return;
    }
    loginUser(email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setEmail("");
        setPassword("");
      })
      .catch((error) => showNotification(`Gagal login: ${error.message}`));
  };

  const handleLogout = () => {
    logoutUser()
      .then(() => {
        setUser(null);
        showNotification("Berhasil logout!");
      })
      .catch((error) => showNotification(`Gagal logout: ${error.message}`));
  };

  const handleAddNote = () => {
    if (!title || !content) {
      showNotification("Judul dan isi harus diisi!");
      return;
    }
    if (user) {
      addNote({
        title,
        content,
        author: user.email,
        timestamp: new Date().toISOString(),
        uid: user.uid,
        status,
      })
        .then(() => {
          setTitle("");
          setContent("");
          setStatus("todo");
          showNotification("Catatan ditambahkan!");
        })
        .catch((error) => showNotification(`Gagal menambah: ${error.message}`));
    }
  };

  const handleEditNote = (id: string, note: Note) => {
    setEditId(id);
    setTitle(note.title);
    setContent(note.content);
    setStatus(note.status);
  };

  const handleUpdateNote = () => {
    if (!editId || !title || !content) {
      showNotification("Judul dan isi harus diisi!");
      return;
    }
    updateNote(editId, { title, content, status })
      .then(() => {
        setEditId(null);
        setTitle("");
        setContent("");
        setStatus("todo");
        showNotification("Catatan diperbarui!");
      })
      .catch((error) => showNotification(`Gagal memperbarui: ${error.message}`));
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id)
      .then(() => showNotification("Catatan dihapus!"))
      .catch((error) => showNotification(`Gagal menghapus: ${error.message}`));
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const columns = [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "done", title: "Done" },
  ];

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      <header className="app-header">
        <h1>Simple Notes</h1>
        {user && (
          <>
            <button className="btn btn-mode" onClick={toggleDarkMode}>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <button className="btn btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </header>
      {notification && <div className="notification">{notification}</div>}

      {!user ? (
        <div className="login-container">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="input-field"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field"
          />
          <button className="btn btn-login" onClick={handleLogin}>
            Login
          </button>
        </div>
      ) : (
        <div className="main-content">
          <div className="note-form">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul"
              className="input-field"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Isi catatan"
              className="input-field"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "todo" | "inprogress" | "done")}
              className="input-field"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button className="btn btn-save" onClick={editId ? handleUpdateNote : handleAddNote}>
              {editId ? "Update" : "Tambah"}
            </button>
          </div>

          <div className="notes-board">
            {columns.map((column) => {
              const columnNotes = Object.entries(notes).filter(([, note]) => note.status === column.id);
              return (
                <div key={column.id} className="notes-column">
                  <h2>{column.title} ({columnNotes.length})</h2>
                  {columnNotes.length > 0 ? (
                    columnNotes.map(([id, note]) => (
                      <div key={id} className="note-card">
                        <h3>{note.title}</h3>
                        <p>{note.content}</p>
                        <div className="note-meta">
                          {note.author} • {new Date(note.timestamp).toLocaleDateString()}
                        </div>
                        <div className="note-actions">
                          <button className="btn btn-edit" onClick={() => handleEditNote(id, note)}>
                            Edit
                          </button>
                          <button className="btn btn-delete" onClick={() => handleDeleteNote(id)}>
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">Tidak ada catatan</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;