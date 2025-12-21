import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "./useAuth";
import { Memory } from "@/types";
import {
  setMainMemoryId,
  removeMainMemoryId,
  getMainMemoryId,
} from "@/lib/firebase/user";

export function useMemories(month: number) {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);

    // 検索用に月の文字列範囲を作成 (例: 1月 -> "0100" 〜 "0199")
    // これで "0101" から "0131" までのデータを一括取得
    const mm = month.toString().padStart(2, "0");
    const startMmdd = `${mm}00`;
    const endMmdd = `${mm}99`;
    const myQuery = query(
      collection(db, "memories"),
      where("userId", "==", user.uid),
      where("mmdd", ">=", startMmdd),
      where("mmdd", "<=", endMmdd),
      orderBy("mmdd", "asc"),
      orderBy("eventDate", "asc")
    );

    let unsubPartner: (() => void) | null = null;
    let unsubMine: (() => void) | null = null;

    const unsubUser = onSnapshot(userRef, (userSnap) => {
      const partnerId = userSnap.data()?.partnerId as string | null;

      // 2) 既存パートナー購読をクリア
      if (unsubPartner) {
        unsubPartner();
        unsubPartner = null;
      }
      if (unsubMine) {
        unsubMine();
        unsubMine = null;
      }

      // 3) パートナー共有クエリ（あるときだけ）
      const partnerQuery =
        partnerId &&
        query(
          collection(db, "memories"),
          where("userId", "==", partnerId),
          where("isShared", "==", true),
          where("mmdd", ">=", startMmdd),
          where("mmdd", "<=", endMmdd),
          orderBy("mmdd", "asc"),
          orderBy("eventDate", "asc")
        );

      unsubMine = onSnapshot(myQuery, (mySnap) => {
        const mine = mySnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Memory[];
        const mergeAndSet = (partner: Memory[] = []) => {
          const merged = [...mine, ...partner].sort((a, b) =>
            a.mmdd === b.mmdd
              ? a.eventDate.toMillis() - b.eventDate.toMillis()
              : a.mmdd.localeCompare(b.mmdd)
          );
          setMemories(merged);
          setLoading(false);
        };

        if (partnerQuery) {
          unsubPartner = onSnapshot(partnerQuery, (pSnap) => {
            const partner = pSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as Memory[];
            mergeAndSet(partner);
          });
        } else {
          mergeAndSet([]);
        }
      });
    });

    return () => {
      unsubUser();
      if (unsubMine) unsubMine();
      if (unsubPartner) unsubPartner();
    };
  }, [user, month]);

  // 新規追加関数
  const addMemory = async (
    title: string,
    detail: string,
    date: Date,
    isShared: boolean,
    isPinned: boolean
  ) => {
    if (!user) return;

    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");

    // ドキュメントを作成
    const docRef = await addDoc(collection(db, "memories"), {
      userId: user.uid,
      title,
      detail,
      eventDate: Timestamp.fromDate(date),
      mmdd: `${mm}${dd}`,
      isShared,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // ピン留めがONなら、ユーザー情報の mainMemoryId を更新
    if (isPinned) {
      await setMainMemoryId(user.uid, docRef.id);
    }
  };

  // 削除関数
  const deleteMemory = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "memories", id));

    // もし削除した記念日がピン留めされていたら、ピン留めを解除する
    const currentPinnedId = await getMainMemoryId(user.uid);
    if (currentPinnedId === id) {
      await removeMainMemoryId(user.uid);
    }
  };

  // 更新関数
  const updateMemory = async (
    id: string,
    title: string,
    detail: string,
    date: Date,
    isShared: boolean,
    isPinned: boolean
  ) => {
    if (!user) return;

    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");

    const ref = doc(db, "memories", id);
    await updateDoc(ref, {
      title,
      detail,
      eventDate: Timestamp.fromDate(date),
      mmdd: `${mm}${dd}`,
      isShared,
      updatedAt: Timestamp.now(),
    });

    if (isPinned) {
      // ONなら上書き設定
      await setMainMemoryId(user.uid, id);
    } else {
      // OFFなら、現在ピン留めされているのが「自分(id)」か確認して解除
      const currentPinnedId = await getMainMemoryId(user.uid);
      if (currentPinnedId === id) {
        await removeMainMemoryId(user.uid);
      }
    }
  };

  return { memories, loading, addMemory, deleteMemory, updateMemory };
}
