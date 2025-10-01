"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Post = {
  id: number;
  name: string | null;
  message: string | null;
  created_at: string;
};

export default function ThreadView({ threadId }: { threadId: number }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [username, setUsername] = useState("名無しさん");
  const [message, setMessage] = useState("");

  // 初回ロード時に localStorage から名前を取得
  useEffect(() => {
    const storedName = localStorage.getItem("bbs-username");
    if (storedName) {
      setUsername(storedName);
    }
  }, []);

  // 投稿一覧を取得
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (!error && data) setPosts(data);
  };

  // 初回 & threadIdが変わるたびに取得 + Realtime購読
  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  // 投稿処理
  const handleSubmit = async () => {
    if (!message.trim()) return;
    await supabase.from("posts").insert([
      { thread_id: threadId, name: username, message },
    ]);
    setMessage("");
    // RealtimeがOFFでも確実に更新
    fetchPosts();
  };

  // 削除処理
  const handleDeletePost = async (id: number, author: string | null) => {
    if (author !== username) {
      alert("これはあなたの投稿ではありません。");
      return;
    }
    if (!confirm("この投稿を削除しますか？")) return;

    // DB削除
    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("削除に失敗しました");
    }

    // Realtime未設定でも即反映
    fetchPosts();
  };

  return (
    <div>
      {/* 投稿フォーム */}
      <div className="mb-6 bg-white shadow-md rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">✏️ 投稿フォーム</h3>
        <p className="mb-2 text-sm text-gray-600">
          あなたの名前: <span className="font-bold">{username}</span>
        </p>
        <textarea
          placeholder="本文を入力してください"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full border rounded px-3 py-2 mb-2 text-sm"
        />
        <button
          onClick={handleSubmit}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          投稿
        </button>
      </div>

      {/* 投稿一覧 */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="text-gray-500">まだ投稿はありません。</p>
        )}
        {posts.map((p) => (
          <div
            key={p.id}
            className="bg-white shadow-sm border rounded-lg p-3"
          >
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span className="font-semibold">{p.name}</span>
              <span>{new Date(p.created_at).toLocaleString()}</span>
            </div>
            <p className="text-gray-800">{p.message}</p>
            {p.name === username && (
              <button
                onClick={() => handleDeletePost(p.id, p.name)}
                className="text-xs text-red-500 mt-2"
              >
                削除
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
