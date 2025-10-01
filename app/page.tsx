"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ThreadList from "./components/ThreadList";
import ThreadView from "./components/ThreadView";

export default function Home() {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<number | null>(null);

  const fetchThreads = async () => {
    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setThreads(data);
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左側：スレッド一覧 */}
      <aside className="w-72 border-r bg-white shadow-md p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">📂 スレッド一覧</h2>
        <ThreadList
          threads={threads}
          selectedThread={selectedThread}
          onSelect={setSelectedThread}
          onCreated={fetchThreads}
        />
      </aside>

      {/* 右側：スレッド内容 */}
      <main className="flex-1 p-6 overflow-y-auto">
        {selectedThread ? (
          <ThreadView threadId={selectedThread} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            ← 左からスレッドを選んでください
          </div>
        )}
      </main>
    </div>
  );
}
