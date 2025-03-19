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
  const [isRegistering, setIsRegistering] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"todo" | "inprogress" | "done">("todo");
  const [category, setCategory] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "todo" | "inprogress" | "done">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [darkMode, setDarkMode] = useState(false);
  const [deletedNote, setDeletedNote] = useState<{ id: string; note: Note } | null>(null);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    authStateChanged((currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        showNotification(`Welcome, ${currentUser.email}!`);
      } else if (currentUser && !currentUser.emailVerified) {
        showNotification("Please verify your email first.", "error");
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
      showNotification("Email and password are required!", "error");
      return;
    }
    loginUser(email, password)
      .then((userCredential) => {
        const currentUser = userCredential.user;
        if (!currentUser.emailVerified) {
          showNotification("Email not verified. Check your inbox.", "error");
          logoutUser();
        } else {
          setUser(currentUser);
          setEmail("");
          setPassword("");
        }
      })
      .catch((error) => {
        if (error.code === "auth/user-not-found") showNotification("Account not found!", "error");
        else if (error.code === "auth/wrong-password") showNotification("Wrong password!", "error");
        else showNotification(`Login failed: ${error.message}`, "error");
      });
  };

  const handleRegister = () => {
    if (!email || !password) {
      showNotification("Email and password are required!", "error");
      return;
    }
    registerUser(email, password)
      .then((userCredential) => {
        const newUser = userCredential.user;
        sendVerificationEmail(newUser)
          .then(() => {
            showNotification("Verification email sent. Check your inbox.");
            setEmail("");
            setPassword("");
            setIsRegistering(false);
            logoutUser();
          })
          .catch((error) => showNotification(`Failed to send verification: ${error.message}`, "error"));
      })
      .catch((error) => showNotification(`Registration failed: ${error.message}`, "error"));
  };

  const handleResetPassword = () => {
    if (!resetEmail) {
      showNotification("Please enter your email!", "error");
      return;
    }
    sendResetPasswordEmail(resetEmail)
      .then(() => {
        showNotification("Password reset email sent. Check your inbox.");
        setResetEmail("");
      })
      .catch((error) => showNotification(`Reset failed: ${error.message}`, "error"));
  };

  const handleResendVerification = () => {
    if (user) {
      sendVerificationEmail(user)
        .then(() => showNotification("Verification email resent. Check your inbox."))
        .catch((error) => showNotification(`Failed to resend: ${error.message}`, "error"));
    }
  };

  const handleLogout = () => {
    logoutUser()
      .then(() => {
        setUser(null);
        showNotification("Logged out successfully!");
      })
      .catch((error) => showNotification(`Logout failed: ${error.message}`, "error"));
  };

  const handleAddNote = () => {
    if (!title || !content) {
      showNotification("Title and content are required!", "error");
      return;
    }
    if (user) {
      addNote({
        title,
        content,
        author: user.email!,
        timestamp: new Date().toISOString(),
        uid: user.uid,
        status,
        category: category || undefined,
        pinned: false,
      })
        .then(() => {
          setTitle("");
          setContent("");
          setStatus("todo");
          setCategory("");
          showNotification("Note added!");
        })
        .catch((error) => showNotification(`Failed to add: ${error.message}`, "error"));
    }
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
      showNotification("Title and content are required!", "error");
      return;
    }
    updateNote(editId, { title, content, status, category: category || undefined })
      .then(() => {
        setEditId(null);
        setTitle("");
        setContent("");
        setStatus("todo");
        setCategory("");
        showNotification("Note updated!");
      })
      .catch((error) => showNotification(`Failed to update: ${error.message}`, "error"));
  };

  const handleDeleteNote = (id: string) => {
    const noteToDelete = notes[id];
    deleteNote(id)
      .then(() => {
        setDeletedNote({ id, note: noteToDelete });
        showNotification("Note deleted! Click to undo.", "success");
        setTimeout(() => setDeletedNote(null), 5000);
      })
      .catch((error) => showNotification(`Failed to delete: ${error.message}`, "error"));
  };

  const handleUndoDelete = () => {
    if (deletedNote) {
      const { id, ...noteWithoutId } = deletedNote.note; // Destructure to exclude id
      addNote(noteWithoutId)
        .then(() => {
          setDeletedNote(null);
          showNotification("Note restored!");
        })
        .catch((error) => showNotification(`Undo failed: ${error.message}`, "error"));
    }
  };
  const handlePinNote = (id: string) => {
    updateNote(id, { pinned: !notes[id].pinned })
      .then(() => showNotification(`Note ${notes[id].pinned ? "unpinned" : "pinned"}!`))
      .catch((error) => showNotification(`Pin failed: ${error.message}`, "error"));
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
    showNotification("Notes exported!");
  };

  const handleImportNotes = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedNotes = JSON.parse(event.target?.result as string);
          Object.entries(importedNotes).forEach(([id, note]: [string, any]) => {
            if (user && note.uid === user.uid) {
              addNote({ ...note, id: undefined });
            }
          });
          showNotification("Notes imported!");
        } catch (error) {
          showNotification("Invalid JSON file!", "error");
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredNotes = Object.entries(notes)
    .filter(([, note]) => note.uid === user?.uid)
    .filter(([, note]) => filterStatus === "all" || note.status === filterStatus)
    .filter(([, note]) => note.title.toLowerCase().includes(searchQuery.toLowerCase()) || note.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort(([, a], [, b]) => sortBy === "newest" ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const columns = [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "done", title: "Done" },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} transition-colors duration-300`}>
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === "success" ? "bg-green-500" : "bg-red-500"} text-white animate-slide-in`}
          onClick={notification.message.includes("undo") ? handleUndoDelete : undefined}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="container mx-auto p-6 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Notes</h1>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <button
                className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 transition"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        {!user ? (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg transform transition-all hover:scale-105">
            <h2 className="text-2xl font-bold mb-6 text-center">{isRegistering ? "Sign Up" : "Sign In"}</h2>
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
              {isRegistering ? "Sign Up" : "Sign In"}
            </button>
            <div className="mt-4 text-center">
              <button
                className="text-blue-500 hover:underline"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? "Already have an account? Sign In" : "Need an account? Sign Up"}
              </button>
            </div>
            {!isRegistering && (
              <div className="mt-4">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter email for reset"
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
                <p className="text-yellow-800 dark:text-yellow-200">Your email is not verified.</p>
                <button
                  className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                  onClick={handleResendVerification}
                >
                  Resend Verification Email
                </button>
              </div>
            )}

            {/* Note Creation */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6 transform transition-all hover:scale-105">
              <h3 className="text-xl font-semibold mb-4">{editId ? "Edit Note" : "Add Note"}</h3>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full p-3 mb-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Content"
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
                  placeholder="Category (optional)"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <button
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                onClick={editId ? handleUpdateNote : handleAddNote}
              >
                {editId ? "Update" : "Add"}
              </button>
            </div>

            {/* Tools */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="flex-1 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "todo" | "inprogress" | "done")}
                className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="all">All</option>
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
              <button
                className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                onClick={handleExportNotes}
              >
                Export
              </button>
              <label className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer">
                Import
                <input type="file" accept=".json" onChange={handleImportNotes} className="hidden" />
              </label>
            </div>

            {/* Notes */}
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
                              View
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
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center">No notes</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
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
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;