"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { backendUrl } from "../utils/api";
import { socket } from "../utils/socket";
import { ArrowLeft } from "lucide-react";

interface Message {
  sender: string;
  receiver: string;
  text: string;
  createdAt?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [chat, setChat] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = () => {
    document.cookie = "token=; Max-Age=0; path=/";
    localStorage.removeItem("username");
    router.push("/login");
  };

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) router.push("/login");
    else setCurrentUser(username);
  }, []);

  /* ---------------- FETCH USERS ---------------- */
  useEffect(() => {
    if (!currentUser) return;
    fetch(`${backendUrl}/users`)
      .then((res) => res.json())
      .then((data) =>
        setUsers(data.filter((u: any) => u.username !== currentUser))
      );
  }, [currentUser]);

  /* ---------------- JOIN ROOM ---------------- */
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    socket.emit("joinRoom", { sender: currentUser, receiver: selectedUser });

    const handleHistory = (data: { messages: Message[] }) => {
      setChat(data?.messages || []);
    };

    const handleMessage = (msg: Message) => {
      setChat((prev) => [...prev, msg]);
    };

    socket.on("chatHistory", handleHistory);
    socket.on("privateMessage", handleMessage);

    return () => {
      socket.off("chatHistory", handleHistory);
      socket.off("privateMessage", handleMessage);
    };
  }, [selectedUser, currentUser]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = () => {
    if (!message.trim() || !currentUser || !selectedUser) return;

    socket.emit("privateMessage", {
      sender: currentUser,
      receiver: selectedUser,
      text: message.trim(),
    });

    setMessage("");
  };

  if (!currentUser) return null;

  /* ---------------- SEARCH FILTER ---------------- */
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-[#0B141A] text-white">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-[360px] bg-[#111B21] border-r border-[#1F2C33] flex flex-col">
        {/* Profile */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1F2C33]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#005C4B] flex items-center justify-center font-bold">
              {currentUser[0].toUpperCase()}
            </div>
            <span className="text-sm">{currentUser}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-red-400 hover:text-red-500"
          >
            Logout
          </button>
        </div>

        {/* 🔍 SEARCH BAR */}
        <div className="p-3 border-b border-[#1F2C33]">
          <div className="flex items-center bg-[#202C33] rounded-lg px-3 py-2">
            <span className="text-[#8696A0] mr-2">🔍</span>
            <input
              className="bg-transparent text-sm text-white placeholder-[#8696A0] focus:outline-none w-full"
              placeholder="Search or start new chat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* USERS */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 && (
            <p className="text-center text-[#8696A0] text-sm mt-6">
              No users found
            </p>
          )}

          {filteredUsers.map((u) => (
            <div
              key={u.username}
              onClick={() => setSelectedUser(u.username)}
              className={`flex items-center gap-4 px-4 py-3 cursor-pointer border-b border-[#1F2C33]
              hover:bg-[#1F2C33] ${
                selectedUser === u.username ? "bg-[#1F2C33]" : ""
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-[#005C4B] flex items-center justify-center font-semibold">
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{u.username}</div>
                <div className="text-xs text-[#8696A0] truncate">{u.email}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ================= RIGHT CHAT ================= */}
      <div className="flex-1 flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-[#8696A0]">
            Select a chat to start messaging
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="h-16 flex items-center px-4 bg-[#202C33] border-b border-[#1F2C33]">
              <ArrowLeft
                size={22}
                className="mr-4 cursor-pointer text-gray-300"
                onClick={() => setSelectedUser(null)}
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#005C4B] flex items-center justify-center font-bold">
                  {selectedUser[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-medium">{selectedUser}</h3>
                  <p className="text-xs text-[#25D366]">Online</p>
                </div>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#0B141A]">
              <div className="space-y-2">
                {chat.map((msg, idx) => {
                  const isMine = msg.sender === currentUser;
                  return (
                    <div
                      key={idx}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm break-words ${
                          isMine
                            ? "bg-[#005C4B] text-white rounded-br-none"
                            : "bg-[#1F2C33] text-[#E9EDEF] rounded-bl-none"
                        }`}
                      >
                        {!isMine && (
                          <p className="text-xs text-[#25D366] mb-1">
                            {msg.sender}
                          </p>
                        )}
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div ref={chatEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-3 bg-[#202C33] border-t border-[#1F2C33]">
              <div className="flex items-center gap-3 bg-[#2A3942] rounded-full px-4 py-2">
                <input
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#8696A0] focus:outline-none"
                  placeholder="Type a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                />
                <button
                  onClick={sendMessage}
                  className="w-9 h-9 rounded-full bg-[#005C4B] hover:bg-[#0A7C66] flex items-center justify-center"
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
