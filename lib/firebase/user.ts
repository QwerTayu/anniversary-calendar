import { deleteField, doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "./client";

// ユーザーの代表記念日IDを取得する
export async function getMainMemoryId(userId: string): Promise<string | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().mainMemoryId || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting main memory ID:", error);
    return null;
  }
}

// ユーザーの代表記念日を更新する
export async function setMainMemoryId(userId: string, memoryId: string) {
  try {
    const userRef = doc(db, "users", userId);
    // ユーザーとドキュメントはログイン時に作られている前提ですが、
    // 万が一なければ setDoc で作るなどのケアが必要かもしれません（今回は簡易的にupdate）
    await updateDoc(userRef, {
      mainMemoryId: memoryId,
    });
  } catch (error) {
    console.error("Error setting main memory ID:", error);
    throw error;
  }
}

// ユーザーの代表記念日を削除（解除）する
export async function removeMainMemoryId(userId: string) {
  try {
    const userRef = doc(db, "users", userId);
    // フィールド自体を削除します
    await updateDoc(userRef, {
      mainMemoryId: deleteField(),
    });
  } catch (error) {
    console.error("Error removing main memory ID:", error);
    throw error;
  }
}

// ユーザー ドキュメントの存在を確認し、なければ作成する（Googleのプロフィールも保存）
export async function ensureUserDocument(user: User) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const base = {
    userId: user.uid,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) {
    await setDoc(userRef, {
      ...base,
      createdAt: serverTimestamp(),
      partnerId: null,
    });
  } else {
    await updateDoc(userRef, base);
  }
}

// ピン留めの競合チェックを行い、必要なら上書きする複合関数
// 戻り値: { success: boolean, cancelled: boolean }
export async function handlePinningLogic(
  userId: string,
  newMemoryId: string,
  currentPinnedId: string | null
): Promise<{ success: boolean; cancelled: boolean }> {
  
  // 1. すでに他の記念日がピン留めされているか確認
  if (currentPinnedId && currentPinnedId !== newMemoryId) {
    // 2. 競合する場合、確認ダイアログを出す
    // (window.confirm はブラウザ標準の簡易ダイアログです)
    const shouldOverwrite = window.confirm(
      "すでにホームにピン留めされた記念日があります。\nこの記念日に変更しますか？"
    );

    if (!shouldOverwrite) {
      // キャンセルした場合
      return { success: false, cancelled: true };
    }
  }

  // 3. 競合なしか、ユーザーが上書きを承認した場合 -> 保存
  await setMainMemoryId(userId, newMemoryId);
  return { success: true, cancelled: false };
}
