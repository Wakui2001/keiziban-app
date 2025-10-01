"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ThreadList({
  threads,
  selectedThread,
  onSelect,
  onCreated,
}: {
  threads: any[];
  selectedThread: number | null;
  onSelect: (id: number) => void;
  onCreated: () => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [username, setUsername] = useState("名無しさん");

  // 初回ロード時にlocalStorageから名前を取得
  useEffect(() => {
    const storedName = localStorage.getItem("bbs-username");
    if (storedName) setUsername(storedName);
  }, []);

  // スレッド作成
  const handleCreateThread = async () => {
    if (!newTitle.trim()) return;
    await supabase.from("threads").insert([{ title: newTitle, author: username }]);
    setNewTitle("");
    onCreated(); // 作成後に一覧を再取得
  };

  // スレッド削除
  const handleDeleteThread = async (id: number, author: string) => {
    if (author !== username) {
      alert("このスレッドはあなたが建てたものではありません。");
      return;
    }
    if (!confirm("このスレッドを削除しますか？")) return;

    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("削除に失敗しました");
    } else {
      onCreated(); // 削除後に一覧を再取得
    }
  };

  // Realtime購読（スレッド追加/削除を監視）
  useEffect(() => {
    const channel = supabase
      .channel("threads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "threads" }, () => {
        onCreated(); // 最新スレッドを取得
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onCreated]);

  return (
    <div>
      <ul className="space-y-2">
        {threads.map((t: any) => (
          <li
            key={t.id}
            className={`p-2 rounded flex justify-between items-center cursor-pointer ${
              t.id === selectedThread
                ? "bg-blue-500 text-white font-semibold"
                : "hover:bg-gray-100"
            }`}
          >
            {/* スレッドタイトル */}
            <span onClick={() => onSelect(t.id)}>{t.title}</span>

            {/* 削除ボタン（自分のスレッドのみ表示） */}
            {t.author === username && (
              <button
                onClick={() => handleDeleteThread(t.id, t.author)}
                className="text-xs text-red-500 ml-2"
              >
                削除
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* 新しいスレッド作成フォーム */}
      <div className="mt-6">
        <input
          placeholder="新しいスレッド名"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-2 text-sm"
        />
        <button
          onClick={handleCreateThread}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          ➕ スレッドを建てる
        </button>
      </div>
    </div>
  );
}
