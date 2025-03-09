import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
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
  const [notification, setNotification] = useState<string | null>(null);

  // Fungsi untuk menampilkan notifikasi sementara
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000); // Hilang setelah 3 detik
  };

  // Pantau autentikasi dan catatan global
  useEffect(() => {
    authStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        showNotification(`Selamat datang, ${currentUser.email}!`);
      }
    });
    getNotes((data) => setNotes(data || {}));
  }, []);

  // Register
  const handleRegister = () => {
    if (!email || !password) {
      showNotification("Email dan password harus diisi!");
      return;
    }
    registerUser(email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setEmail("");
        setPassword("");
      })
      .catch((error) => {
        if (error.code === "auth/email-already-in-use") {
          showNotification("Email sudah terdaftar!");
        } else if (error.code === "auth/invalid-email") {
          showNotification("Email tidak valid!");
        } else if (error.code === "auth/weak-password") {
          showNotification("Password terlalu lemah (minimal 6 karakter)!");
        } else {
          showNotification("Gagal mendaftar: " + error.message);
        }
      });
  };

  // Login
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
      .catch((error) => {
        if (error.code === "auth/wrong-password") {
          showNotification("Password salah!");
        } else if (error.code === "auth/user-not-found") {
          showNotification("Pengguna tidak ditemukan!");
        } else if (error.code === "auth/invalid-email") {
          showNotification("Email tidak valid!");
        } else {
          showNotification("Gagal login: " + error.message);
        }
      });
  };

  // Logout
  const handleLogout = () => {
    logoutUser()
      .then(() => {
        setUser(null);
        showNotification("Berhasil logout!");
      })
      .catch((error) => showNotification("Gagal logout: " + error.message));
  };

  // Add Note
  const handleAddNote = () => {
    if (!title || !content) {
      showNotification("Judul dan isi catatan harus diisi!");
      return;
    }
    if (user) {
      addNote({
        title,
        content,
        author: user.email,
        timestamp: new Date().toISOString(),
        uid: user.uid,
        status: "todo",
      });
      setTitle("");
      setContent("");
      showNotification("Catatan berhasil ditambahkan ke To Do!");
    }
  };

  // Edit Note
  const handleEditNote = (id: string, note: any) => {
    if (user && note.uid === user.uid) {
      setEditId(id);
      setTitle(note.title);
      setContent(note.content);
    } else {
      showNotification("Anda hanya bisa mengedit catatan Anda sendiri!");
    }
  };

  const handleUpdateNote = () => {
    if (editId && title && content && user) {
      updateNote(editId, { title, content });
      setEditId(null);
      setTitle("");
      setContent("");
      showNotification("Catatan berhasil diperbarui!");
    }
  };

  // Delete Note
  const handleDeleteNote = (id: string, noteUid: string) => {
    if (user && noteUid === user.uid) {
      deleteNote(id);
      showNotification("Catatan berhasil dihapus!");
    } else {
      showNotification("Anda hanya bisa menghapus catatan Anda sendiri!");
    }
  };

  // Drag-and-Drop Handler
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || !user) return;

    const noteId = result.draggableId;
    const note = notes[noteId];

    if (note.uid !== user.uid) {
      showNotification("Anda hanya bisa memindahkan catatan Anda sendiri!");
      return;
    }

    const newStatus =
      destination.droppableId === "todo"
        ? "todo"
        : destination.droppableId === "inprogress"
        ? "inprogress"
        : "done";

    updateNote(noteId, { status: newStatus });
    showNotification(`Catatan dipindahkan ke ${newStatus}!`);
  };

  // Filter catatan berdasarkan status
  const todoNotes = Object.entries(notes).filter(([, note]: [string, any]) => note.status === "todo");
  const inProgressNotes = Object.entries(notes).filter(([, note]: [string, any]) => note.status === "inprogress");
  const doneNotes = Object.entries(notes).filter(([, note]: [string, any]) => note.status === "done");

  return (
    <div className="container">
      <h1 className="title">React Notes Kanban</h1>
      {notification && <div className="notification">{notification}</div>}

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
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Masukkan isi catatan"
                rows={4}
              />
            </div>
            <button
              className={editId ? "btn btn-success" : "btn btn-primary"}
              onClick={editId ? handleUpdateNote : handleAddNote}
            >
              {editId ? "Update Catatan" : "Tambah Catatan"}
            </button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="kanban-board">
              {/* To Do */}
              <Droppable droppableId="todo">
                {(provided) => (
                  <div
                    className="kanban-column"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <h2>To Do</h2>
                    {todoNotes.map(([id, note]: [string, any], index) => (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(provided) => (
                          <div
                            className="note-item"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <h3>{note.title}</h3>
                            <p>{note.content}</p>
                            <span className="note-meta">
                              {note.author} - {new Date(note.timestamp).toLocaleString()}
                            </span>
                            <div className="note-actions">
                              <button
                                className="btn btn-warning"
                                onClick={() => handleEditNote(id, note)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteNote(id, note.uid)}
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* In Progress */}
              <Droppable droppableId="inprogress">
                {(provided) => (
                  <div
                    className="kanban-column"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <h2>In Progress</h2>
                    {inProgressNotes.map(([id, note]: [string, any], index) => (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(provided) => (
                          <div
                            className="note-item"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <h3>{note.title}</h3>
                            <p>{note.content}</p>
                            <span className="note-meta">
                              {note.author} - {new Date(note.timestamp).toLocaleString()}
                            </span>
                            <div className="note-actions">
                              <button
                                className="btn btn-warning"
                                onClick={() => handleEditNote(id, note)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteNote(id, note.uid)}
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Done */}
              <Droppable droppableId="done">
                {(provided) => (
                  <div
                    className="kanban-column"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <h2>Done</h2>
                    {doneNotes.map(([id, note]: [string, any], index) => (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(provided) => (
                          <div
                            className="note-item"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <h3>{note.title}</h3>
                            <p>{note.content}</p>
                            <span className="note-meta">
                              {note.author} - {new Date(note.timestamp).toLocaleString()}
                            </span>
                            <div className="note-actions">
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteNote(id, note.uid)}
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </DragDropContext>
        </div>
      )}
    </div>
  );
};

export default App;