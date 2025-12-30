import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "./useAuth";
import { Memory } from "@/types";

export function useHomeMemories() {
  const { user } = useAuth();
  const [todayMemories, setTodayMemories] = useState<Memory[]>([]);
  const [upcomingMemories, setUpcomingMemories] = useState<
    { memory: Memory; daysLeft: number; nextDate: Date }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);

    let unsubPartner: (() => void) | null = null;

    const unsubUser = onSnapshot(userRef, (userSnap) => {
      const partnerId = userSnap.data()?.partnerId as string | null;

      if (unsubPartner) {
        unsubPartner();
        unsubPartner = null;
      }

      const baseQuery = (uid: string, sharedOnly: boolean) =>
        query(
          collection(db, "memories"),
          where("userId", "==", uid),
          ...(sharedOnly ? [where("isShared", "==", true)] : []),
          orderBy("mmdd", "asc")
        );

      const unsubMine = onSnapshot(baseQuery(user.uid, false), (mySnap) => {
        const mine = mySnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Memory[];
        const now = new Date();
        const currentMmdd = `${(now.getMonth() + 1)
          .toString()
          .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;

        const compute = (partner: Memory[] = []) => {
          const all = [...mine, ...partner];
          const todays = all.filter((m) => m.mmdd === currentMmdd);
          setTodayMemories(todays);

          const upcoming = all
            .map((memory) => {
              const eventDate = memory.eventDate?.toDate?.() as Date | undefined;
              const eventYear = eventDate?.getFullYear() ?? now.getFullYear();
              const memMonth = parseInt(memory.mmdd.slice(0, 2)) - 1;
              const memDay = parseInt(memory.mmdd.slice(2, 4));
              const todayZero = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
              );
              let nextOccurrence = new Date(now.getFullYear(), memMonth, memDay);
              if (nextOccurrence.getTime() < todayZero.getTime())
                nextOccurrence = new Date(now.getFullYear() + 1, memMonth, memDay);
              const daysLeft = Math.ceil(
                (nextOccurrence.getTime() - todayZero.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              // nextDateは表示用に実際の記念日の年を保持する
              const nextDate = new Date(eventYear, memMonth, memDay);
              return { memory, daysLeft, nextDate };
            })
            .filter((x) => x.daysLeft > 0)
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 5);

          setUpcomingMemories(upcoming);
          setLoading(false);
        };

        if (partnerId) {
          unsubPartner = onSnapshot(baseQuery(partnerId, true), (pSnap) => {
            const partner = pSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as Memory[];
            compute(partner);
          });
        } else {
          compute([]);
        }
      });

      return () => {
        unsubMine();
        if (unsubPartner) unsubPartner();
      };
    });

    return () => {
      unsubUser();
      if (unsubPartner) unsubPartner();
    };
  }, [user]);

  return { todayMemories, upcomingMemories, loading };
}
