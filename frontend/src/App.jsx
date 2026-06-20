import { useEffect } from 'react';
import { AppRoutes } from './routes/AppRoutes.jsx';
import PageFrame from './components/layout/PageFrame.jsx';
import { useAppDispatch } from './hooks/useStore.js';
import { hydrateTheme } from './features/dashboard/uiSlice.js';
import { useAuthBootstrap } from './hooks/useAuthBootstrap.js';

function App() {
  const dispatch = useAppDispatch();

  useAuthBootstrap();

  useEffect(() => {
    dispatch(hydrateTheme());
  }, [dispatch]);

  return (
    <PageFrame>
      <AppRoutes />
    </PageFrame>
  );
}

export default App;
