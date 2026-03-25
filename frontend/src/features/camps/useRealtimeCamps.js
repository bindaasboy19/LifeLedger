import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { firestore } from '../../lib/firebase.js';
import { listCamps } from './campApi.js';

export const useRealtimeCamps = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadFromApi = async () => {
      try {
        const rows = await listCamps();
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

    const q = query(collection(firestore, 'donation_camps'), orderBy('startAt', 'asc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!active) return;
        const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
  }, []);

  return { items, loading };
};
