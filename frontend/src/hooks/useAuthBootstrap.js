import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseAuth } from '../lib/firebase.js';
import { firestore } from '../lib/firebase.js';
import { useAppDispatch } from './useStore.js';
import {
  clearSession,
  setAuthError,
  setInitialized,
  setProfile,
  setSession
} from '../features/auth/authSlice.js';
import { getAuthErrorMessage } from '../features/auth/authErrorMessage.js';
import { fetchMyProfile } from '../features/auth/authService.js';

export const useAuthBootstrap = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let profileUnsub;

    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = undefined;
      }

      try {
        if (!user) {
          dispatch(clearSession());
          dispatch(setInitialized(true));
          return;
        }

        const token = await user.getIdToken();
        dispatch(setSession({ user, token }));

        profileUnsub = onSnapshot(
          doc(firestore, 'users', user.uid),
          (snapshot) => {
            if (!snapshot.exists()) {
              dispatch(setProfile(null));
            } else {
              dispatch(
                setProfile({
                  uid: user.uid,
                  ...snapshot.data()
                })
              );
            }

            dispatch(setInitialized(true));
          },
          () => {
            fetchMyProfile()
              .then((profile) => {
                dispatch(setProfile(profile));
              })
              .catch((fetchError) => {
                if (fetchError?.response?.status === 404) {
                  dispatch(setProfile(null));
                } else {
                  dispatch(
                    setAuthError(
                      getAuthErrorMessage(
                        fetchError,
                        'Authenticated, but profile stream failed. Check Firestore rules and connectivity.'
                      )
                    )
                  );
                }
              })
              .finally(() => {
                dispatch(setInitialized(true));
              });
          }
        );
      } catch (error) {
        dispatch(setAuthError(getAuthErrorMessage(error)));
        dispatch(setInitialized(true));
      } finally {
        // Initialization completes when either no user exists or the profile stream responds.
      }
    });

    return () => {
      if (profileUnsub) {
        profileUnsub();
      }
      unsub();
    };
  }, [dispatch]);
};
