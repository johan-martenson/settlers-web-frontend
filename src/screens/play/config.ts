
export const PlayLogConfig = {
    lifecycle: true,        // mounting, effects, start/stop listeners
    connection: true,       // connecting, following game state
    commands: true,         // command setup, typing commands
    camera: true,           // centering, view control
    roads: true,            // road building, placement logic
    flags: true,            // flag placement & interaction
    houses: true,           // house interaction
    selection: true,        // point / object selection
    input: true,            // mouse, touch, click, double-click
    touch: false,           // verbose touch-move diagnostics
    sound: true,            // sound effects lifecycle
    windows: true,          // opening UI windows
    data: false,            // raw data dumps (JSON.stringify)
    errors: true,           // error situations
    gameState: true,       // game state changes, monitoring lifecycle
    preventContextMenu: true,  // prevent context menu from appearing
    ...(JSON.parse(localStorage.getItem('config.play.log') ?? '{}'))  // override log settings from local storage if it exists
}
