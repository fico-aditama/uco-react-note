import React, { useState, useEffect } from "react";
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

  const columns = [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "done", title: "Done" },
  ];

  return (
    <div className="container my-4">
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1>Simple Notes</h1>
        {user && (
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        )}
      </header>

      {notification && (
        <div className="alert alert-success position-fixed top-0 end-0 m-3" style={{ zIndex: 1000 }}>
          {notification}
        </div>
      )}

      {!user ? (
        <div className="card mx-auto" style={{ maxWidth: "400px" }}>
          <div className="card-body">
            <h5 className="card-title">Login</h5>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="form-control mb-3"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="form-control mb-3"
            />
            <button className="btn btn-primary w-100" onClick={handleLogin}>
              Login
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">{editId ? "Edit Catatan" : "Tambah Catatan"}</h5>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul"
                className="form-control mb-3"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Isi catatan"
                className="form-control mb-3"
                rows={3}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "todo" | "inprogress" | "done")}
                className="form-select mb-3"
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <button
                className="btn btn-success w-100"
                onClick={editId ? handleUpdateNote : handleAddNote}
              >
                {editId ? "Update" : "Tambah"}
              </button>
            </div>
          </div>

          <div className="row">
            {columns.map((column) => {
              const columnNotes = Object.entries(notes).filter(([, note]) => note.status === column.id);
              return (
                <div key={column.id} className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <h5>
                        {column.title} ({columnNotes.length})
                      </h5>
                    </div>
                    <div className="card-body">
                      {columnNotes.length > 0 ? (
                        columnNotes.map(([id, note]) => (
                          <div key={id} className="card mb-2">
                            <div className="card-body">
                              <h6 className="card-title">{note.title}</h6>
                              <p className="card-text">{note.content}</p>
                              <p className="card-text text-muted">
                                {note.author} • {new Date(note.timestamp).toLocaleDateString()}
                              </p>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-warning btn-sm"
                                  onClick={() => handleEditNote(id, note)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteNote(id)}
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted text-center">Tidak ada catatan</p>
                      )}
                    </div>
                  </div>
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