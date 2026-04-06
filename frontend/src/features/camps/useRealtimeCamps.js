import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { firestore } from '../../lib/firebase.js';
import { listCamps } from './campApi.js';

export const useRealtimeCamps = ({ enabled = true } = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

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
  }, [enabled]);

  return { items, loading };
};
