import React, { useState, useEffect, ChangeEvent } from "react";
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
  sendResetPasswordEmail,
  Note,
} from "./firebase";
import { User } from "firebase/auth";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"todo" | "inprogress" | "done">("todo");
  const [category, setCategory] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [deletedNote, setDeletedNote] = useState<{ id: string; note: Note } | null>(null);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

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
        switch (error.code) {
          case "auth/user-not-found":
            showNotification("Akun tidak ditemukan!", "error");
            break;
          case "auth/wrong-password":
            showNotification("Password salah!", "error");
            break;
          default:
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

  const handleResetPassword = () => {
    if (!resetEmail) {
      showNotification("Masukkan email Anda!", "error");
      return;
    }
    sendResetPasswordEmail(resetEmail)
      .then(() => {
        showNotification("Email reset password telah dikirim. Cek inbox Anda.");
        setResetEmail("");
      })
      .catch((error) => showNotification(`Gagal mengirim email reset: ${error.message}`, "error"));
  };

  const handleResendVerification = () => {
    if (user) {
      sendVerificationEmail(user)
        .then(() => showNotification("Email verifikasi telah dikirim ulang. Cek inbox Anda."))
        .catch((error) => showNotification(`Gagal mengirim ulang: ${error.message}`, "error"));
    }
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
    if (!user) {
      showNotification("Silakan login terlebih dahulu!", "error");
      return;
    }
    const noteData: Omit<Note, "id"> = {
      title,
      content,
      author: user.email!,
      timestamp: new Date().toISOString(),
      uid: user.uid,
      status,
      category: category || undefined,
      pinned: false,
    };
    addNote(noteData)
      .then(() => {
        setTitle("");
        setContent("");
        setStatus("todo");
        setCategory("");
        showNotification("Catatan ditambahkan!");
      })
      .catch((error) => showNotification(`Gagal menambah: ${error.message}`, "error"));
  };

  const handleEditNote = (id: string, note: Note) => {
    setEditId(id);
    setTitle(note.title);
    setContent(note.content);
    setStatus(note.status);
    setCategory(note.category || "");
  };

  const handleUpdateNote = () => {
    if (!editId || !title || !content) {
      showNotification("Judul dan isi harus diisi!", "error");
      return;
    }
    updateNote(editId, { title, content, status, category: category || undefined })
      .then(() => {
        setEditId(null);
        setTitle("");
        setContent("");
        setStatus("todo");
        setCategory("");
        showNotification("Catatan diperbarui!");
      })
      .catch((error) => showNotification(`Gagal memperbarui: ${error.message}`, "error"));
  };

  const handleDeleteNote = (id: string) => {
    const noteToDelete = notes[id];
    deleteNote(id)
      .then(() => {
        setDeletedNote({ id, note: noteToDelete });
        showNotification("Catatan dihapus! Klik untuk undo.", "success");
        setTimeout(() => setDeletedNote(null), 5000);
      })
      .catch((error) => showNotification(`Gagal menghapus: ${error.message}`, "error"));
  };

  const handleUndoDelete = () => {
    if (deletedNote) {
      const { id, ...noteWithoutId } = deletedNote.note;
      addNote(noteWithoutId)
        .then(() => {
          setDeletedNote(null);
          showNotification("Catatan dikembalikan!");
        })
        .catch((error) => showNotification(`Undo gagal: ${error.message}`, "error"));
    }
  };

  const handlePinNote = (id: string) => {
    updateNote(id, { pinned: !notes[id].pinned })
      .then(() => showNotification(`Catatan ${notes[id].pinned ? "dilepas" : "disematkan"}!`))
      .catch((error) => showNotification(`Gagal menyematkan: ${error.message}`, "error"));
  };

  const handleExportNotes = () => {
    const json = JSON.stringify(notes, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.json";
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Catatan diekspor!");
  };

  const handleImportNotes = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedNotes = JSON.parse(event.target?.result as string);
          Object.entries(importedNotes).forEach(([id, note]: [string, any]) => {
            if (note.uid === user.uid) {
              addNote({ ...note, id: undefined });
            }
          });
          showNotification("Catatan diimpor!");
        } catch (error) {
          showNotification("File JSON tidak valid!", "error");
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredNotes = Object.entries(notes)
    .filter(([, note]) => note.uid === user?.uid)
    .filter(([, note]) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort(([, a], [, b]) =>
      sortBy === "newest"
        ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  const columns = [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "done", title: "Done" },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} transition-colors duration-300`}>
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === "success" ? "bg-green-500" : "bg-red-500"} text-white animate-slide-in`}
          onClick={notification.message.includes("undo") ? handleUndoDelete : undefined}
        >
          {notification.message}
        </div>
      )}

      <header className="container mx-auto p-6 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Simple Notes</h1>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm">{user.email}</span>
            <button
              className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 transition"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <div className="container mx-auto p-6">
        {!user ? (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg transform transition-all hover:scale-105">
            <h2 className="text-2xl font-bold mb-6 text-center">{isRegistering ? "Registrasi" : "Login"}</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 mb-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 mb-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              onClick={isRegistering ? handleRegister : handleLogin}
            >
              {isRegistering ? "Daftar" : "Login"}
            </button>
            <div className="mt-4 text-center">
              <button
                className="text-blue-500 hover:underline"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}
              </button>
            </div>
            {!isRegistering && (
              <div className="mt-4">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Masukkan email untuk reset"
                  className="w-full p-3 mb-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  className="w-full p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                  onClick={handleResetPassword}
                >
                  Reset Password
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {!user.emailVerified && (
              <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-center">
                <p className="text-yellow-800 dark:text-yellow-200">Email Anda belum diverifikasi.</p>
                <button
                  className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                  onClick={handleResendVerification}
                >
                  Kirim Ulang Email Verifikasi
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6 transform transition-all hover:scale-105">
              <h3 className="text-xl font-semibold mb-4">{editId ? "Edit Catatan" : "Tambah Catatan"}</h3>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul"
                className="w-full p-3 mb-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Isi catatan"
                className="w-full p-3 mb-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                rows={4}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "todo" | "inprogress" | "done")}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Kategori (opsional)"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <button
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                onClick={editId ? handleUpdateNote : handleAddNote}
              >
                {editId ? "Update" : "Tambah"}
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan..."
                className="flex-1 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
              <button
                className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                onClick={handleExportNotes}
              >
                Ekspor
              </button>
              <label className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer">
                Impor
                <input type="file" accept=".json" onChange={handleImportNotes} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((column) => {
                const columnNotes = filteredNotes.filter(([, note]) => note.status === column.id);
                return (
                  <div key={column.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transform transition-all hover:scale-105">
                    <h3 className="text-xl font-semibold mb-4">
                      {column.title} ({columnNotes.length})
                    </h3>
                    {columnNotes.length > 0 ? (
                      columnNotes.map(([id, note]) => (
                        <div
                          key={id}
                          className={`p-4 mb-4 rounded-lg ${note.pinned ? "bg-yellow-100 dark:bg-yellow-900" : "bg-gray-100 dark:bg-gray-700"} transition-all hover:shadow-md`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-medium">{note.title}</h4>
                            <button
                              className="text-xl"
                              onClick={() => handlePinNote(id)}
                            >
                              {note.pinned ? "📌" : "📍"}
                            </button>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 truncate">{note.content}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {note.author} • {new Date(note.timestamp).toLocaleString()}
                            {note.category && ` • ${note.category}`}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <button
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                              onClick={() => setPreviewNote(note)}
                            >
                              Lihat
                            </button>
                            <button
                              className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                              onClick={() => handleEditNote(id, note)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                              onClick={() => handleDeleteNote(id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center">Tidak ada catatan</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {previewNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-lg w-full transform transition-all scale-95 animate-modal-in">
            <h3 className="text-2xl font-bold mb-4">{previewNote.title}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{previewNote.content}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {previewNote.author} • {new Date(previewNote.timestamp).toLocaleString()}
              {previewNote.category && ` • ${previewNote.category}`}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              onClick={() => setPreviewNote(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;