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
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    authStateChanged((currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        showNotification(`Selamat datang, ${currentUser.email}!`);
      } else if (currentUser && !currentUser.emailVerified) {
        showNotification("Silakan verifikasi email Anda terlebih dahulu.");
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
      showNotification("Email dan password harus diisi!");
      return;
    }
    loginUser(email, password)
      .then((userCredential) => {
        const currentUser = userCredential.user;
        if (!currentUser.emailVerified) {
          showNotification("Email belum diverifikasi. Silakan cek email Anda.");
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
            showNotification("Akun tidak ditemukan!");
            break;
          case "auth/wrong-password":
            showNotification("Password salah!");
            break;
          default:
            showNotification(`Gagal login: ${error.message}`);
        }
      });
  };

  const handleRegister = () => {
    if (!email || !password) {
      showNotification("Email dan password harus diisi!");
      return;
    }
    registerUser(email, password)
      .then((userCredential) => {
        const newUser = userCredential.user;
        sendVerificationEmail(newUser)
          .then(() => {
            showNotification("Email verifikasi telah dikirim. Silakan cek inbox Anda untuk mengklik link verifikasi.");
            setEmail("");
            setPassword("");
            setIsRegistering(false);
            logoutUser();
          })
          .catch((error) => showNotification(`Gagal mengirim email verifikasi: ${error.message}`));
      })
      .catch((error) => showNotification(`Gagal registrasi: ${error.message}`));
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
    if (!user) {
      showNotification("Silakan login terlebih dahulu!");
      return;
    }
    addNote({
      title,
      content,
      author: user.email!,
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
    <div className="container mx-auto my-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Simple Notes</h1>
        {user && (
          <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" onClick={handleLogout}>
            Logout
          </button>
        )}
      </header>

      {notification && (
        <div className="fixed top-0 right-0 m-3 p-4 bg-green-500 text-white rounded shadow z-50">
          {notification}
        </div>
      )}

      {!user ? (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
          <h5 className="text-lg font-semibold mb-4">{isRegistering ? "Registrasi" : "Login"}</h5>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="w-full p-2 mb-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={isRegistering ? handleRegister : handleLogin}
          >
            {isRegistering ? "Daftar" : "Login"}
          </button>
          <button
            className="w-full text-blue-500 hover:underline"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-white p-6 rounded-lg shadow mb-4">
            <h5 className="text-lg font-semibold mb-4">{editId ? "Edit Catatan" : "Tambah Catatan"}</h5>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul"
              className="w-full p-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Isi catatan"
              className="w-full p-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "todo" | "inprogress" | "done")}
              className="w-full p-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button
              className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={editId ? handleUpdateNote : handleAddNote}
            >
              {editId ? "Update" : "Tambah"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((column) => {
              const columnNotes = Object.entries(notes).filter(([, note]) => note.status === column.id);
              return (
                <div key={column.id} className="bg-white p-4 rounded-lg shadow">
                  <h5 className="text-lg font-semibold mb-2">
                    {column.title} ({columnNotes.length})
                  </h5>
                  {columnNotes.length > 0 ? (
                    columnNotes.map(([id, note]) => (
                      <div key={id} className="p-4 mb-2 bg-gray-100 rounded-lg">
                        <h6 className="text-md font-medium">{note.title}</h6>
                        <p className="text-gray-700">{note.content}</p>
                        <p className="text-gray-500 text-sm">
                          {note.author} • {new Date(note.timestamp).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            onClick={() => handleEditNote(id, note)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => handleDeleteNote(id)}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center">Tidak ada catatan</p>
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