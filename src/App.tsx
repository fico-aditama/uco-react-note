import React, { useState, useEffect } from "react";
import {
  addNote,
  getNotes,
  updateNote,
  deleteNote,
  loginUser,
  logoutUser,
  authStateChanged,
  registerUser,
  sendVerificationEmail,
  Note,
} from "./firebase";
import { User } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css"; // File CSS kustom untuk animasi dan styling tambahan

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"todo" | "inprogress" | "done">("todo");
  const [editId, setEditId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    authStateChanged((currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        showNotification(`Selamat datang, ${currentUser.email}!`);
      } else if (currentUser && !currentUser.emailVerified) {
        showNotification("Silakan verifikasi email Anda terlebih dahulu.", "error");
        logoutUser();
      }
    });

    const unsubscribe = getNotes((data: Record<string, Note>) => {
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
      showNotification("Email dan password harus diisi!", "error");
      return;
    }
    loginUser(email, password)
      .then((userCredential) => {
        const currentUser = userCredential.user;
        if (!currentUser.emailVerified) {
          showNotification("Email belum diverifikasi. Silakan cek email Anda.", "error");
          logoutUser();
        } else {
          setUser(currentUser);
          setEmail("");
          setPassword("");
        }
      })
      .catch((error) => {
        if (error.code === "auth/user-not-found") {
          showNotification("Akun tidak ditemukan!", "error");
        } else if (error.code === "auth/wrong-password") {
          showNotification("Password salah!", "error");
        } else {
          showNotification(`Gagal login: ${error.message}`, "error");
        }
      });
  };

  const handleRegister = () => {
    if (!email || !password) {
      showNotification("Email dan password harus diisi!", "error");
      return;
    }
    registerUser(email, password)
      .then((userCredential) => {
        const newUser = userCredential.user;
        sendVerificationEmail(newUser)
          .then(() => {
            showNotification("Email verifikasi telah dikirim. Silakan cek inbox Anda.");
            setEmail("");
            setPassword("");
            setIsRegistering(false);
            logoutUser();
          })
          .catch((error) => showNotification(`Gagal mengirim email verifikasi: ${error.message}`, "error"));
      })
      .catch((error) => showNotification(`Gagal registrasi: ${error.message}`, "error"));
  };

  const handleLogout = () => {
    logoutUser()
      .then(() => {
        setUser(null);
        showNotification("Berhasil logout!");
      })
      .catch((error) => showNotification(`Gagal logout: ${error.message}`, "error"));
  };

  const handleAddNote = () => {
    if (!title || !content) {
      showNotification("Judul dan isi harus diisi!", "error");
      return;
    }
    if (user) {
      addNote({
        title,
        content,
        author: user.email || "",
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
        .catch((error) => showNotification(`Gagal menambah: ${error.message}`, "error"));
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
      showNotification("Judul dan isi harus diisi!", "error");
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
      .catch((error) => showNotification(`Gagal memperbarui: ${error.message}`, "error"));
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id)
      .then(() => showNotification("Catatan dihapus!"))
      .catch((error) => showNotification(`Gagal menghapus: ${error.message}`, "error"));
  };

  const columns = [
    { id: "todo", title: "To Do", color: "#f8d7da" },
    { id: "inprogress", title: "In Progress", color: "#fff3cd" },
    { id: "done", title: "Done", color: "#d4edda" },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Simple Notes</h1>
        {user && (
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        )}
      </header>

      {notification && (
        <div
          className={`alert alert-${notification.type === "success" ? "success" : "danger"} alert-dismissible fade show notification`}
          role="alert"
        >
          {notification.message}
          <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
        </div>
      )}

      {!user ? (
        <div className="auth-container">
          <div className="auth-card">
            <h2 className="auth-title">{isRegistering ? "Daftar Akun" : "Masuk"}</h2>
            <div className="mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="form-control shadow-sm"
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="form-control shadow-sm"
              />
            </div>
            <button
              className="btn btn-primary w-100 mb-2 shadow-sm"
              onClick={isRegistering ? handleRegister : handleLogin}
            >
              {isRegistering ? "Daftar" : "Masuk"}
            </button>
            <button className="btn btn-link w-100" onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="notes-container">
          <div className="card note-form shadow-lg">
            <div className="card-body">
              <h5 className="card-title">{editId ? "Edit Catatan" : "Tambah Catatan"}</h5>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul"
                className="form-control mb-3 shadow-sm"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Isi catatan"
                className="form-control mb-3 shadow-sm"
                rows={3}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "todo" | "inprogress" | "done")}
                className="form-select mb-3 shadow-sm"
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <button
                className="btn btn-success w-100 shadow-sm"
                onClick={editId ? handleUpdateNote : handleAddNote}
              >
                {editId ? "Update" : "Tambah"}
              </button>
            </div>
          </div>

          <div className="row g-4 mt-4">
            {columns.map((column) => {
              const columnNotes = Object.entries(notes).filter(([, note]) => note.status === column.id);
              return (
                <div key={column.id} className="col-md-4 col-sm-12">
                  <div className="card shadow-sm column-card" style={{ backgroundColor: column.color }}>
                    <div className="card-header">
                      <h5>
                        {column.title} ({columnNotes.length})
                      </h5>
                    </div>
                    <div className="card-body note-list">
                      {columnNotes.length > 0 ? (
                        columnNotes.map(([id, note]) => (
                          <div key={id} className="card mb-3 note-card shadow-sm animate__animated animate__fadeIn">
                            <div className="card-body">
                              <h6 className="card-title">{note.title}</h6>
                              <p className="card-text">{note.content}</p>
                              <p className="card-text text-muted small">
                                {note.author} • {new Date(note.timestamp).toLocaleDateString()}
                              </p>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-warning btn-sm shadow-sm"
                                  onClick={() => handleEditNote(id, note)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-danger btn-sm shadow-sm"
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