import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  Timestamp, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "./useAuth";
import { Memory } from "@/types";

export function useMemories(month: number) {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 検索用に月の文字列範囲を作成 (例: 1月 -> "0100" 〜 "0199")
    // これで "0101" から "0131" までのデータを一括取得
    const mm = month.toString().padStart(2, '0');
    const startMmdd = `${mm}00`;
    const endMmdd = `${mm}99`;

    const q = query(
      collection(db, "memories"),
      where("userId", "==", user.uid),
      where("mmdd", ">=", startMmdd),
      where("mmdd", "<=", endMmdd),
      // 同じ日のデータは古い順（過去→現在）で並べる // TODO: descの方が良いかも？
      orderBy("mmdd", "asc"),
      orderBy("eventDate", "asc") 
    );

    // リアルタイムリスナー (onSnapshot)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Memory[];
      
      setMemories(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, month]);

  // 新規追加関数
  const addMemory = async (title: string, detail: string, date: Date) => {
    if (!user) return;
    
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    
    await addDoc(collection(db, "memories"), {
      userId: user.uid,
      title,
      detail,
      eventDate: Timestamp.fromDate(date),
      mmdd: `${mm}${dd}`,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  };

  // 削除関数
  const deleteMemory = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "memories", id));
  };

  return { memories, loading, addMemory, deleteMemory };
}
