import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { firestore } from '../../lib/firebase.js';
import { listStockFlowEvents } from './stockApi.js';

export const useRealtimeStockFlow = (profile) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || !['hospital', 'blood_bank', 'admin'].includes(profile.role)) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let active = true;

    const loadFromApi = async () => {
      try {
        const rows = await listStockFlowEvents();
        if (active) {
          setItems(rows || []);
        }
      } catch {
        if (active) {
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const q = query(collection(firestore, 'stock_flow'), orderBy('at', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!active) return;
        let rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (profile.role !== 'admin') {
          rows = rows.filter((row) => row.sourceUid === profile.uid || row.actorUid === profile.uid);
        }
        setItems(rows);
        setLoading(false);
      },
      async () => {
        await loadFromApi();
      }
    );

    return () => {
      active = false;
      unsub();
    };
  }, [profile]);

  return { items, loading };
};
