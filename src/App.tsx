import { GameFlow } from './game/GameFlow';
import { GameProvider } from './game/state/GameProvider';
import { RouterProvider } from './shared/router';

function App() {
  return (
    <RouterProvider>
      <GameProvider>
        <GameFlow />
        <footer className="app-footer" data-testid="app-footer">
          v{__APP_VERSION__}
        </footer>
      </GameProvider>
    </RouterProvider>
  );
}

export default App;
