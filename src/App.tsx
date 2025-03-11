import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from "react";
import { Button, Card, Form, Alert, Container, Row, Col } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
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
  priority: "low" | "medium" | "high";
}

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"todo" | "inprogress" | "done">("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [editId, setEditId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isAudioAllowed, setIsAudioAllowed] = useState(false); // State untuk izin audio

  const playSound = (type: "success" | "error" | "delete") => {
    if (!isAudioAllowed) return; // Hanya putar jika pengguna sudah berinteraksi
    const audio = new Audio(
      type === "success"
        ? "https://www.soundjay.com/buttons/beep-01a.mp3"
        : type === "error"
        ? "https://www.soundjay.com/buttons/beep-02.mp3"
        : "https://www.soundjay.com/buttons/beep-03.mp3"
    );
    audio.play().catch((err) => console.log("Audio play failed:", err));
  };

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification(message);
    playSound(type === "success" ? "success" : "error");
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    authStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setNotification(`Selamat datang, ${currentUser.email}!`); // Hanya notifikasi, tanpa suara
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    });
    const unsubscribe = getNotes((data) => {
      const notesData = data || {};
      Object.keys(notesData).forEach((key) => {
        if (!notesData[key].status) notesData[key].status = "todo";
        if (!notesData[key].priority) notesData[key].priority = "medium";
      });
      setNotes(notesData);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    setIsAudioAllowed(true); // Aktifkan audio setelah interaksi pertama
    if (!email || !password) {
      showNotification("Email dan password harus diisi!", "error");
      return;
    }
    loginUser(email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setEmail("");
        setPassword("");
        showNotification("Login berhasil!", "success"); // Suara diputar di sini
      })
      .catch((error) => showNotification(`Gagal login: ${error.message}`, "error"));
  };

  const handleLogout = () => {
    logoutUser()
      .then(() => {
        setUser(null);
        showNotification("Berhasil logout!", "success");
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
        author: user.email,
        timestamp: new Date().toISOString(),
        uid: user.uid,
        status,
        priority,
      })
        .then(() => {
          setTitle("");
          setContent("");
          setStatus("todo");
          setPriority("medium");
          showNotification("Catatan ditambahkan!", "success");
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        })
        .catch((error) => showNotification(`Gagal menambah: ${error.message}`, "error"));
    }
  };

  const handleEditNote = (id: string, note: Note) => {
    setEditId(id);
    setTitle(note.title);
    setContent(note.content);
    setStatus(note.status);
    setPriority(note.priority);
  };

  const handleUpdateNote = () => {
    if (!editId || !title || !content) {
      showNotification("Judul dan isi harus diisi!", "error");
      return;
    }
    updateNote(editId, { title, content, status, priority })
      .then(() => {
        setEditId(null);
        setTitle("");
        setContent("");
        setStatus("todo");
        setPriority("medium");
        showNotification("Catatan diperbarui!", "success");
      })
      .catch((error) => showNotification(`Gagal memperbarui: ${error.message}`, "error"));
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id)
      .then(() => {
        showNotification("Catatan dihapus!", "success");
        playSound("delete");
      })
      .catch((error) => showNotification(`Gagal menghapus: ${error.message}`, "error"));
  };

  const columns = [
    { id: "todo", title: "To Do", bg: "bg-info" },
    { id: "inprogress", title: "In Progress", bg: "bg-warning" },
    { id: "done", title: "Done", bg: "bg-success" },
  ];

  return (
    <div style={{ background: "linear-gradient(135deg, #1e90ff, #ff00ff)", minHeight: "100vh", margin: 0, padding: 0 }}>
      <Container className="my-4 text-light">
        {showConfetti && <Confetti />}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="d-flex justify-content-between align-items-center mb-4 p-3 rounded shadow"
          style={{ background: "rgba(0, 0, 0, 0.7)" }}
        >
          <h1 className="text-warning fw-bold">Simple Notes: Cyber Edition</h1>
          {user && (
            <Button variant="outline-danger" onClick={handleLogout} className="glow-on-hover">
              Logout
            </Button>
          )}
        </motion.header>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="position-fixed top-0 end-0 m-3"
              style={{ zIndex: 1000 }}
            >
              <Alert variant={notification.includes("Gagal") ? "danger" : "success"}>{notification}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {!user ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="card mx-auto shadow-lg"
            style={{ maxWidth: "400px", background: "rgba(255, 255, 255, 0.1)" }}
          >
            <Card.Body>
              <Card.Title className="text-light">Login Cyber Portal</Card.Title>
              <Form>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="mb-3 text-light"
                  style={{ background: "rgba(0, 0, 0, 0.5)", border: "none" }}
                />
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="mb-3 text-light"
                  style={{ background: "rgba(0, 0, 0, 0.5)", border: "none" }}
                />
                <Button variant="outline-primary" className="w-100 glow-on-hover" onClick={handleLogin}>
                  Login
                </Button>
              </Form>
            </Card.Body>
          </motion.div>
        ) : (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="card mb-4 shadow-lg"
              style={{ background: "rgba(255, 255, 255, 0.1)" }}
            >
              <Card.Body>
                <Card.Title className="text-light">{editId ? "Edit Cyber Note" : "Add Cyber Note"}</Card.Title>
                <Form>
                  <Form.Control
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    placeholder="Judul"
                    className="mb-3 text-light"
                    style={{ background: "rgba(0, 0, 0, 0.5)", border: "none" }}
                  />
                  <Form.Control
                    as="textarea"
                    value={content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                    placeholder="Isi catatan"
                    rows={3}
                    className="mb-3 text-light"
                    style={{ background: "rgba(0, 0, 0, 0.5)", border: "none" }}
                  />
                  <Form.Select
                    value={status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setStatus(e.target.value as "todo" | "inprogress" | "done")
                    }
                    className="mb-3 text-light"
                    style={{ background: "rgba(0, 0, 0, 0.5)", border: "none" }}
                  >
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                  </Form.Select>
                  <Form.Select
                    value={priority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setPriority(e.target.value as "low" | "medium" | "high")
                    }
                    className="mb-3 text-light"
                    style={{ background: "rgba(0, 0, 0, 0.5)", border: "none" }}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </Form.Select>
                  <Button
                    variant="outline-success"
                    className="w-100 glow-on-hover"
                    onClick={editId ? handleUpdateNote : handleAddNote}
                  >
                    {editId ? "Update" : "Tambah"}
                  </Button>
                </Form>
              </Card.Body>
            </motion.div>

            <Row>
              {columns.map((column) => {
                const columnNotes = Object.entries(notes).filter(([, note]) => note.status === column.id);
                return (
                  <Col md={4} key={column.id}>
                    <motion.div
                      initial={{ x: -100 }}
                      animate={{ x: 0 }}
                      transition={{ type: "spring", stiffness: 100 }}
                      className={`card shadow-lg ${column.bg}`}
                    >
                      <Card.Header>
                        <h5 className="text-dark">
                          {column.title} ({columnNotes.length})
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <AnimatePresence>
                          {columnNotes.length > 0 ? (
                            columnNotes.map(([id, note]) => (
                              <motion.div
                                key={id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="card mb-2 shadow-sm"
                                style={{
                                  background:
                                    note.priority === "high"
                                      ? "rgba(255, 0, 0, 0.2)"
                                      : note.priority === "medium"
                                      ? "rgba(255, 165, 0, 0.2)"
                                      : "rgba(0, 255, 0, 0.2)",
                                }}
                              >
                                <Card.Body>
                                  <Card.Title>{note.title}</Card.Title>
                                  <Card.Text>{note.content}</Card.Text>
                                  <Card.Text className="text-muted">
                                    {note.author} • {new Date(note.timestamp).toLocaleDateString()} •{" "}
                                    <strong>{note.priority.toUpperCase()}</strong>
                                  </Card.Text>
                                  <div className="d-flex gap-2">
                                    <Button
                                      variant="outline-warning"
                                      size="sm"
                                      className="glow-on-hover"
                                      onClick={() => handleEditNote(id, note)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="glow-on-hover"
                                      onClick={() => handleDeleteNote(id)}
                                    >
                                      Hapus
                                    </Button>
                                  </div>
                                </Card.Body>
                              </motion.div>
                            ))
                          ) : (
                            <p className="text-dark text-center">No Cyber Notes Yet!</p>
                          )}
                        </AnimatePresence>
                      </Card.Body>
                    </motion.div>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}
      </Container>
      <style>{`
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        .glow-on-hover {
          transition: all 0.3s ease-in-out;
        }
        .glow-on-hover:hover {
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default App;