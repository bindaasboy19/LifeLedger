import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { firestore } from '../../lib/firebase.js';
import { listSOSRequests } from './sosApi.js';

const OFFER_COLLECTION = 'sos_dispatch_offers';
const TRACKING_COLLECTION = 'sos_tracking';

const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  return normalized === 'created' ? 'open' : normalized;
};

export const useRealtimeSOS = (profile, { enabled = true } = {}) => {
  const [items, setItems] = useState([]);
  const [offers, setOffers] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setOffers([]);
      setTracking([]);
      setLoading(false);
      return undefined;
    }

    let active = true;

    const loadFromApi = async () => {
      try {
        const rows = await listSOSRequests();
        if (active) {
          setItems((rows || []).map((item) => ({ ...item, status: normalizeStatus(item.status) })));
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

    const sosQuery = query(collection(firestore, 'sos_requests'), orderBy('createdAt', 'desc'));
    const unsubSOS = onSnapshot(
      sosQuery,
      (snapshot) => {
        if (!active) return;
        setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), status: normalizeStatus(doc.data().status) })));
        setLoading(false);
      },
      async () => {
        await loadFromApi();
      }
    );

    const unsubOffers = profile?.uid
      ? onSnapshot(
          query(collection(firestore, OFFER_COLLECTION), where('donorId', '==', profile.uid)),
          (snapshot) => {
            if (!active) return;
            setOffers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          },
          () => {
            if (active) {
              setOffers([]);
            }
          }
        )
      : () => {};

    const unsubTracking = onSnapshot(
      collection(firestore, TRACKING_COLLECTION),
      (snapshot) => {
        if (!active) return;
        setTracking(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      () => {
        if (active) {
          setTracking([]);
        }
      }
    );

    return () => {
      active = false;
      unsubSOS();
      unsubOffers();
      unsubTracking();
    };
  }, [enabled, profile?.uid]);

  const offersBySosId = useMemo(
    () =>
      offers.reduce((acc, offer) => {
        if (['pending', 'accepted'].includes(String(offer.offerStatus || '').toLowerCase())) {
          acc[offer.sosId] = offer;
        }
        return acc;
      }, {}),
    [offers]
  );

  const trackingBySosId = useMemo(
    () =>
      tracking.reduce((acc, item) => {
        acc[item.sosId || item.id] = item;
        return acc;
      }, {}),
    [tracking]
  );

  return {
    items,
    offersBySosId,
    trackingBySosId,
    loading
  };
};
