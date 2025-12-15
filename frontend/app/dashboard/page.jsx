"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { backendUrl } from "../utils/api";

export default function Dashboard() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // IMPORTANT

  // 🔐 Logout
  const handleLogout = () => {
    document.cookie = "token=; Max-Age=0; path=/";
    localStorage.removeItem("username");
    router.push("/login");
  };

  // 🔎 Auth check
  useEffect(() => {
    const username = localStorage.getItem("username");

    if (!username) {
      router.push("/login");
      return; // ⛔ STOP rendering
    }

    setCurrentUser(username);
  }, []);

  // 👥 Fetch users
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      const res = await fetch(`${backendUrl}/users`);
      const data = await res.json();
      setUsers(data);
    };

    fetchUsers();
  }, [currentUser]);

  // ⛔ DO NOT show loader forever
  if (currentUser === null) {
    return null; // 🔥 THIS FIXES STUCK "Checking login"
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-xl font-bold">Realtime Chat</h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-blue-400">{currentUser}</span>
          </p>
        </div>

        <div className="p-3 text-xs text-slate-400 uppercase">Users</div>

        <div className="flex-1 overflow-y-auto">
          {users.map((u) => (
            <button
              key={u.username}
              onClick={() => router.push(`/chat/${u.username}`)}
              className="w-full px-4 py-3 hover:bg-slate-800 flex items-center gap-3"
            >
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                {u.username[0].toUpperCase()}
              </div>
              <div>
                <div className="text-sm">{u.username}</div>
                <div className="text-xs text-slate-400">{u.email}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-1 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center">
        <h2 className="text-2xl">Welcome, {currentUser}</h2>
      </main>
    </div>
  );
}
