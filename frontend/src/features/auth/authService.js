import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword
} from 'firebase/auth';
import { firebaseAuth } from '../../lib/firebase.js';
import { api } from '../../lib/api.js';

export const registerUser = async ({ email, password }) => {
  const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  return result.user;
};

export const loginUser = async ({ email, password }) => {
  const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return result.user;
};

export const logoutUser = async () => {
  await signOut(firebaseAuth);
};

export const fetchMyProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data.data;
};

export const saveProfile = async (payload) => {
  const { data } = await api.post('/auth/profile', payload);
  return data.data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.patch('/auth/profile', payload);
  return data.data;
};

export const changeUserPassword = async ({ currentPassword, newPassword }) => {
  const user = firebaseAuth.currentUser;
  if (!user?.email) {
    throw new Error('No authenticated user session found');
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};
