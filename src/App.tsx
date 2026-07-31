import { GameFlow } from './game/GameFlow';
import { GameProvider } from './game/state/GameProvider';
import { RouterProvider } from './shared/router';

function App() {
  return (
    <RouterProvider>
      <GameProvider>
        <GameFlow />
      </GameProvider>
    </RouterProvider>
  );
}

export default App;
