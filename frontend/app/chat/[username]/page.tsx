"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { socket } from "../../utils/socket";

interface Message {
  sender: string;
  receiver: string;
  text: string;
  createdAt?: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const receiver = params.username as string;

  const [sender, setSender] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [chat, setChat] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("username");
    if (!u) {
      router.push("/login");
      return;
    }
    setSender(u);
  }, [router]);

  useEffect(() => {
    if (!sender || !receiver) return;

    socket.emit("joinRoom", { sender, receiver });

    const handleHistory = (data: { messages: Message[] }) => {
      setChat(Array.isArray(data.messages) ? data.messages : []);
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
  }, [sender, receiver]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("privateMessage", {
      sender,
      receiver,
      text: message,
    });

    setMessage("");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      <aside className="w-64 border-r border-slate-800 bg-[#020617] flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-slate-400 hover:text-white"
          >
            ← Back to Users
          </button>
          <h2 className="mt-2 text-lg font-semibold">Private Chat</h2>
          <p className="text-xs text-slate-500 mt-1">
            Talking with <span className="text-blue-400">{receiver}</span>
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#020617]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-semibold">
              {receiver?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium capitalize">{receiver}</div>
              <div className="text-xs text-emerald-400">● Online</div>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 py-3 bg-[#020617] overflow-y-auto max-h-[calc(100vh-8rem)]">
          {chat.length === 0 && (
            <p className="text-center text-xs text-slate-500 mt-10">
              No messages yet. Say hi 👋
            </p>
          )}

          {chat.map((msg, idx) => {
            const isMine = msg.sender?.toLowerCase() === sender.toLowerCase();
            return (
              <div
                key={idx}
                className={`flex mb-2 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[60%] px-3 py-2 rounded-2xl text-sm shadow 
            ${
              isMine
                ? "bg-emerald-600 rounded-br-none"
                : "bg-slate-800 rounded-bl-none"
            }`}
                >
                  {!isMine && (
                    <p className="text-[10px] text-emerald-300 mb-1">
                      {msg.sender}
                    </p>
                  )}
                  <p>{msg.text}</p>
                  {msg.createdAt && (
                    <p className="text-[9px] mt-1 text-slate-400 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="h-16 border-t border-slate-800 px-4 flex items-center gap-3 bg-[#020617]">
          <input
            className="flex-1 px-3 py-2 rounded-lg bg-[#020617] border border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
            placeholder="Type a message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
