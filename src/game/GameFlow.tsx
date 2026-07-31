import { useEffect } from 'react';
import { CatalogManagementScreen } from '../catalog/screens/CatalogManagementScreen';
import { useRouter } from '../shared/router';
import { CountdownScreen } from './screens/CountdownScreen';
import { FeedbackScreen } from './screens/FeedbackScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MissingCatalogScreen } from './screens/MissingCatalogScreen';
import { MissingTaskScreen } from './screens/MissingTaskScreen';
import { PlayerSetupScreen } from './screens/PlayerSetupScreen';
import { TaskDetailsScreen } from './screens/TaskDetailsScreen';
import { TaskSelectionScreen } from './screens/TaskSelectionScreen';
import { useGame } from './state/useGame';

export function GameFlow() {
  const { route, navigate } = useRouter();
  const { persistenceReady, state } = useGame();

  useEffect(() => {
    if (!persistenceReady) {
      return;
    }

    if (state.missingCatalogId || state.missingTaskId) {
      return;
    }

    if (route === '/round' && !state.offeredTasks) {
      navigate('/new');
    }

    if (route === '/timer' && state.phase === 'feedback') {
      navigate('/feedback');
    }

    if ((route === '/task' || route === '/timer' || route === '/feedback') && !state.selectedTask) {
      navigate(state.offeredTasks ? '/round' : '/new');
    }
  }, [
    navigate,
    persistenceReady,
    route,
    state.missingCatalogId,
    state.missingTaskId,
    state.offeredTasks,
    state.phase,
    state.selectedTask,
  ]);

  if (route.startsWith('/catalog')) {
    return <CatalogManagementScreen />;
  }

  if (persistenceReady && state.missingCatalogId && isGameResumeRoute(route)) {
    return <MissingCatalogScreen />;
  }

  if (persistenceReady && state.missingTaskId && isGameResumeRoute(route)) {
    return <MissingTaskScreen />;
  }

  switch (route) {
    case '/new':
      return <PlayerSetupScreen />;
    case '/round':
      return state.phase === 'feedback' ? (
        <FeedbackScreen />
      ) : state.offeredTasks ? (
        <TaskSelectionScreen />
      ) : (
        <PlayerSetupScreen />
      );
    case '/task':
      return state.selectedTask ? <TaskDetailsScreen /> : <TaskSelectionScreen />;
    case '/timer':
      return state.phase === 'feedback' ? (
        <FeedbackScreen />
      ) : state.selectedTask ? (
        <CountdownScreen />
      ) : (
        <TaskSelectionScreen />
      );
    case '/feedback':
      return state.phase === 'feedback' ? <FeedbackScreen /> : <TaskSelectionScreen />;
    case '/':
      return <HomeScreen />;
  }
}

function isGameResumeRoute(route: string) {
  return (
    route === '/' ||
    route === '/round' ||
    route === '/task' ||
    route === '/timer' ||
    route === '/feedback'
  );
}
