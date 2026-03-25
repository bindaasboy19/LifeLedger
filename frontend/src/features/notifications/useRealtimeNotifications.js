import { useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { firestore } from '../../lib/firebase.js';
import { useAppDispatch } from '../../hooks/useStore.js';
import { setNotifications } from './notificationsSlice.js';
import { api } from '../../lib/api.js';

export const useRealtimeNotifications = (uid) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!uid) return undefined;

    let active = true;

    const loadFromApi = async () => {
      try {
        const { data } = await api.get('/notifications');
        if (active) {
          dispatch(setNotifications(data.data || []));
        }
      } catch {
        if (active) {
          dispatch(setNotifications([]));
        }
      }
    };

    const q = query(
      collection(firestore, 'notifications'),
      where('userUid', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!active) return;
        const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        dispatch(setNotifications(rows));
      },
      async () => {
        await loadFromApi();
      }
    );

    return () => {
      active = false;
      unsub();
    };
  }, [dispatch, uid]);
};
