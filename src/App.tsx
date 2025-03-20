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
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [deletedNote, setDeletedNote] = useState<{ id: string; note: Note } | null>(null);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const unsubscribe = authStateChanged((currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        showNotification(`Selamat datang, ${currentUser.email}!`);
      } else if (currentUser && !currentUser.emailVerified) {
        showNotification("Silakan verifikasi email Anda terlebih dahulu.", "error");
        logoutUser();
      }
    });

    const notesUnsubscribe = getNotes((data) => setNotes(data));
    return () => {
      unsubscribe();
      notesUnsubscribe();
    };
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
      ...(category && { category }),
      pinned: false,
    };
    addNote(noteData)
      .then(() => {
        setTitle("");
        setContent("");
        setStatus("todo");
        setCategory("");
        setIsAddingNote(false);
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
    setIsAddingNote(true);
  };

  const handleUpdateNote = () => {
    if (!editId || !title || !content) {
      showNotification("Judul dan isi harus diisi!", "error");
      return;
    }
    updateNote(editId, {
      title,
      content,
      status,
      ...(category && { category }),
    })
      .then(() => {
        setEditId(null);
        setTitle("");
        setContent("");
        setStatus("todo");
        setCategory("");
        setIsAddingNote(false);
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
    { id: "todo", title: "Today", color: "bg-orange-500" },
    { id: "inprogress", title: "This Week", color: "bg-green-500" },
    { id: "done", title: "This Month", color: "bg-gray-500" },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? "bg-[#1F2A44] text-gray-100" : "bg-gray-100 text-gray-900"} transition-colors duration-300`}>
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === "success" ? "bg-green-500" : "bg-red-500"} text-white animate-slide-in`}
          onClick={notification.message.includes("undo") ? handleUndoDelete : undefined}
        >
          {notification.message}
        </div>
      )}

      {!user ? (
        <div className={`min-h-screen flex flex-col ${darkMode ? "bg-[#1F2A44] text-gray-100" : "bg-white text-gray-900"}`}>
          <header className={`p-4 flex justify-between items-center border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className="text-2xl font-bold">Akademi Notes</div>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Home</a>
              <a href="#" className="hover:underline">Shop</a>
              <a href="#" className="hover:underline">Events</a>
              <a href="#" className="hover:underline">Blog</a>
              <a href="#" className="hover:underline">Help</a>
              <a href="#" className="hover:underline">Appointment</a>
              <a href="#" className="hover:underline">Jobs</a>
              <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-all">
                Sign in
              </button>
              <a href="#" className="hover:underline">Contact Us</a>
            </div>
          </header>

          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
              <h2 className="text-xl font-semibold mb-6 text-center">Login to Akademi Notes</h2>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={`w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${darkMode ? "bg-[#2A334F] border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
              />
              <label className="block text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${darkMode ? "bg-[#2A334F] border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
              />
              <div className="flex justify-between items-center mb-6">
                <button
                  className="text-purple-600 hover:underline"
                  onClick={() => setIsRegistering(!isRegistering)}
                >
                  {isRegistering ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
                </button>
                {!isRegistering && (
                  <button
                    className="text-purple-600 hover:underline"
                    onClick={() => setResetEmail(email)}
                  >
                    Reset Password
                  </button>
                )}
              </div>
              {resetEmail && !isRegistering && (
                <div className="mb-4">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Email untuk reset"
                    className={`w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all ${darkMode ? "bg-[#2A334F] border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                  />
                  <button
                    className="w-full p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-all"
                    onClick={handleResetPassword}
                  >
                    Kirim Email Reset
                  </button>
                </div>
              )}
              <button
                className="w-full p-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition-all"
                onClick={isRegistering ? handleRegister : handleLogin}
              >
                {isRegistering ? "Daftar" : "Log in"}
              </button>
            </div>
          </div>

          <footer className={`p-6 ${darkMode ? "bg-[#1A2238] text-gray-300" : "bg-gray-900 text-white"}`}>
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Useful Links</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:underline">Home</a></li>
                  <li><a href="#" className="hover:underline">About us</a></li>
                  <li><a href="#" className="hover:underline">Products</a></li>
                  <li><a href="#" className="hover:underline">Services</a></li>
                  <li><a href="#" className="hover:underline">Legal</a></li>
                  <li><a href="#" className="hover:underline">Contact us</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">About us</h3>
                <p>
                  We are a team of passionate people whose goal is to improve everyone's life through disruptive products. We build great products to solve your business problems.
                </p>
                <p className="mt-2">
                  Our products are designed for small to medium size companies willing to optimize their performance.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Connect with us</h3>
                <ul className="space-y-2">
                  <li>Contact us</li>
                  <li>info@yourcompany.example.com</li>
                  <li>+1 555-555-5556</li>
                </ul>
                <div className="flex gap-4 mt-4">
                  <a href="#" className="text-2xl">📞</a>
                  <a href="#" className="text-2xl">📧</a>
                  <a href="#" className="text-2xl">📘</a>
                  <a href="#" className="text-2xl">🐦</a>
                  <a href="#" className="text-2xl">🔗</a>
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-6 flex justify-between text-sm">
              <p>Copyright © Akademi Notes</p>
              <p>Powered by FAD - The #1 Open Source eCommerce</p>
            </div>
          </footer>
        </div>
      ) : (
        <div className="flex min-h-screen">
          <aside className={`w-64 ${darkMode ? "bg-[#1A2238] border-gray-700" : "bg-gray-50 border-gray-200"} border-r p-4`}>
            <h2 className="text-lg font-semibold mb-4 text-purple-600 dark:text-purple-400">To-do</h2>
            <ul>
              <li className={`p-2 rounded-lg mb-2 ${darkMode ? "bg-purple-900 text-purple-300" : "bg-purple-100 text-purple-600"}`}>
                <span>Inbox</span>
              </li>
            </ul>
          </aside>

          <div className="flex-1 flex flex-col">
            <header className={`shadow-md p-4 flex justify-between items-center ${darkMode ? "bg-[#1A2238] text-gray-100" : "bg-white text-gray-900"}`}>
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">To-do</h1>
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">NEW</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${darkMode ? "bg-[#2A334F] border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900"} border`}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                  className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${darkMode ? "bg-[#2A334F] border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900"} border`}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                  onClick={handleExportNotes}
                >
                  Export
                </button>
                <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all cursor-pointer">
                  Import
                  <input type="file" accept=".json" onChange={handleImportNotes} className="hidden" />
                </label>
                <button
                  className={`p-2 rounded-full transition-all ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? "☀️" : "🌙"}
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </header>

            <div className="flex-1 p-6 overflow-x-auto">
              {!user.emailVerified && (
                <div className={`mb-6 p-4 rounded-lg text-center ${darkMode ? "bg-yellow-900 text-yellow-200" : "bg-yellow-100 text-yellow-800"}`}>
                  <p>Email Anda belum diverifikasi.</p>
                  <button
                    className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all"
                    onClick={handleResendVerification}
                  >
                    Kirim Ulang Email Verifikasi
                  </button>
                </div>
              )}

              <div className="flex gap-4">
                {columns.map((column) => {
                  const columnNotes = filteredNotes.filter(([, note]) => note.status === column.id);
                  return (
                    <div
                      key={column.id}
                      className={`w-80 p-4 rounded-lg ${darkMode ? "bg-[#2A334F]" : "bg-gray-50"} shadow-sm`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                          {column.title} ({columnNotes.length})
                        </h3>
                        <button className="text-gray-500 hover:text-gray-300">+</button>
                      </div>
                      <div className={`h-1 ${column.color} mb-4`}></div>
                      {columnNotes.length > 0 ? (
                        columnNotes.map(([id, note]) => (
                          <div
                            key={id}
                            className={`p-4 mb-4 rounded-lg shadow-sm transition-all hover:shadow-md ${darkMode ? "bg-[#3A4565] text-gray-100" : "bg-white text-gray-900"}`}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="text-md font-medium truncate">{note.title}</h4>
                              <button
                                className="text-xl hover:text-yellow-500 transition-colors"
                                onClick={() => handlePinNote(id)}
                              >
                                {note.pinned ? "⭐" : "☆"}
                              </button>
                            </div>
                            <p className="text-sm truncate">{note.content}</p>
                            <p className="text-xs mt-1">
                              {new Date(note.timestamp).toLocaleString()}
                            </p>
                            {note.category && (
                              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${darkMode ? "bg-blue-800 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                                {note.category}
                              </span>
                            )}
                            <div className="flex gap-2 mt-3">
                              <button
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all"
                                onClick={() => setPreviewNote(note)}
                              >
                                View
                              </button>
                              <button
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-all"
                                onClick={() => handleEditNote(id, note)}
                              >
                                Edit
                              </button>
                              <button
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
                                onClick={() => handleDeleteNote(id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center">No notes</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              className="fixed bottom-6 right-6 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all transform hover:scale-110"
              onClick={() => setIsAddingNote(true)}
            >
              +
            </button>
          </div>
        </div>
      )}

      {isAddingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-2xl max-w-md w-full transform transition-all animate-modal-in ${darkMode ? "bg-[#2A334F] text-gray-100" : "bg-white text-gray-900"}`}>
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Note" : "Add Note"}
            </h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className={`w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${darkMode ? "bg-[#3A4565] border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900"}`}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Content"
              className={`w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${darkMode ? "bg-[#3A4565] border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900"}`}
              rows={4}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "todo" | "inprogress" | "done")}
              className={`w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${darkMode ? "bg-[#3A4565] border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900"}`}
            >
              <option value="todo">Today</option>
              <option value="inprogress">This Week</option>
              <option value="done">This Month</option>
            </select>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (optional)"
              className={`w-full p-3 mb-6 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${darkMode ? "bg-[#3A4565] border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900"}`}
            />
            <div className="flex gap-4">
              <button
                className="flex-1 p-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition-all"
                onClick={editId ? handleUpdateNote : handleAddNote}
              >
                {editId ? "Update" : "Add"}
              </button>
              <button
                className={`flex-1 p-3 rounded transition-all ${darkMode ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-300 text-gray-800 hover:bg-gray-400"}`}
                onClick={() => {
                  setIsAddingNote(false);
                  setEditId(null);
                  setTitle("");
                  setContent("");
                  setStatus("todo");
                  setCategory("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {previewNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-2xl max-w-lg w-full transform transition-all animate-modal-in ${darkMode ? "bg-[#2A334F] text-gray-100" : "bg-white text-gray-900"}`}>
            <h3 className="text-xl font-semibold mb-4">{previewNote.title}</h3>
            <p className="mb-4">{previewNote.content}</p>
            <p className="text-sm">
              {previewNote.author} • {new Date(previewNote.timestamp).toLocaleString()}
            </p>
            {previewNote.category && (
              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${darkMode ? "bg-blue-800 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                {previewNote.category}
              </span>
            )}
            <button
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-all"
              onClick={() => setPreviewNote(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;