import React, { useState, useEffect } from "react";
import "./App.css";
import {
  addNote,
  getNotes,
  updateNote,
  deleteNote,
  registerUser,
  loginUser,
  logoutUser,
  authStateChanged,
} from "./firebase";

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState<any>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Pantau status autentikasi
  useEffect(() => {
    authStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        getNotes(currentUser.uid, (data) => setNotes(data || {}));
      } else {
        setNotes({});
      }
    });
  }, []);

  // Register
  const handleRegister = () => {
    registerUser(email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setEmail("");
        setPassword("");
      })
      .catch((error) => console.error("Register Error:", error));
  };

  // Login
  const handleLogin = () => {
    loginUser(email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setEmail("");
        setPassword("");
      })
      .catch((error) => console.error("Login Error:", error));
  };

  // Logout
  const handleLogout = () => {
    logoutUser()
      .then(() => setUser(null))
      .catch((error) => console.error("Logout Error:", error));
  };

  // Create
  const handleAddNote = () => {
    if (title && content && user) {
      addNote(
        {
          title,
          content,
          author: user.email,
          timestamp: new Date().toISOString(),
          uid: user.uid,
        },
        user.uid
      );
      setTitle("");
      setContent("");
    }
  };

  // Update
  const handleEditNote = (id: string, note: any) => {
    setEditId(id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleUpdateNote = () => {
    if (editId && title && content && user) {
      updateNote(user.uid, editId, { title, content });
      setEditId(null);
      setTitle("");
      setContent("");
    }
  };

  // Delete
  const handleDeleteNote = (id: string) => {
    if (user) deleteNote(user.uid, id);
  };

  return (
    <div className="container">
      <h1 className="title">React Notes</h1>

      {!user ? (
        <div className="auth-section">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
            />
          </div>
          <div className="button-group">
            <button className="btn btn-primary" onClick={handleRegister}>
              Register
            </button>
            <button className="btn btn-secondary" onClick={handleLogin}>
              Login
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="user-info">
            <span>Selamat datang, {user.email}</span>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Judul</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul catatan"
              />
            </div>
            <div className="form-group">
              <label>Isi</label>
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Masukkan isi catatan"
              />
            </div>
            <button
              className={editId ? "btn btn-success" : "btn btn-primary"}
              onClick={editId ? handleUpdateNote : handleAddNote}
            >
              {editId ? "Update Catatan" : "Tambah Catatan"}
            </button>
          </div>

          <div className="notes-list">
            {Object.entries(notes).map(([id, note]: [string, any]) => (
              <div key={id} className="note-item">
                <div>
                  <h3 className="note-title">{note.title}</h3>
                  <p>{note.content}</p>
                  <span className="note-meta">
                    {note.author} - {new Date(note.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="note-actions">
                  <button
                    className="btn btn-warning"
                    onClick={() => handleEditNote(id, note)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteNote(id)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;