// RPC Core

// Constants
export const MAX_WAIT_FOR_CONNECTION = 10_000; // milliseconds

const MAX_WAIT_FOR_REPLY = 1000; // milliseconds

// Types
export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'NOT_CONNECTED'

type RequestId = number
type ReplyMessage = { requestId: RequestId, error?: string }
type ConnectionListener = (connectionState: ConnectionStatus) => void
type MessageListener = (message: unknown) => void

// Type functions
function isReplyMessage(message: unknown): message is ReplyMessage {
    return message !== undefined &&
        message !== null &&
        typeof message === 'object' &&
        'requestId' in message
}

// Configuration
export const wsApiDebugSettings = {
    receive: true,
    send: true
}

// State
const pendingReplies: Map<RequestId, ReplyMessage> = new Map()
const connectionListeners: Set<ConnectionListener> = new Set()
const messageListeners: Set<MessageListener> = new Set()

let websocket: WebSocket | undefined = undefined
let nextRequestId = 0
let connectionStatus: ConnectionStatus = 'NOT_CONNECTED'

// Functions exposed as part of WS API
/**
 * Adds the given function as a listener for connection status changes.
 * @param {ConnectionListener} listener A function that will be called when the connection status changes
 */
function addConnectionStatusListener(listener: ConnectionListener): void {
    connectionListeners.add(listener)
}

/**
 * Removes the given function from the set of listeners so that it will no longer get called when the connection status changes
 * @param listener A function that is registered as a listener and should stop being called when the status changes
 */
// eslint-disable-next-line
function removeConnectionStatusListener(listener: ConnectionListener): void {
    connectionListeners.delete(listener)
}

function addMessageListener(listener: MessageListener): void {
    messageListeners.add(listener)
}

// eslint-disable-next-line
function removeMessageListener(listener: MessageListener): void {
    messageListeners.delete(listener)
}

/**
 * Waits for a connection to get established to the WS backend. Will not initiate any connection on its own.
 * @returns {Promise<void>}
 */
function waitForConnection(): Promise<void> {
    const timestampWaitStarted = (new Date()).getTime()

    return new Promise((result, reject) => {
        const timer = setInterval(() => {
            const timestampNow = (new Date()).getTime()

            if (timestampNow - timestampWaitStarted > MAX_WAIT_FOR_CONNECTION) {
                clearInterval(timer)

                console.error('Failed to connect to websocket backend')

                reject('Timed out')
            }

            if (connectionStatus === 'CONNECTED') {
                clearInterval(timer)

                console.log('Connection is established')

                result()
            }
        }, 5)
    })
}

/**
 * Starts a connection to the WS backend and waits for it to finish. If the connection is already established
 * it will simply return.
 * @returns {Promise<void>}
 */
async function connectAndWaitForConnection(): Promise<void> {
    console.log('Connect and wait until the connection is ready.')
    console.log(connectionStatus)
    console.log(websocket)

    // Re-use the existing connection if possible
    if (connectionStatus === 'CONNECTED') {
        console.log('Already connected')
        return
    }

    try {
        const websocketUrl = makeWsConnectUrl()

        console.info(`Websocket url: ${websocketUrl}`)

        websocket = new WebSocket(websocketUrl)

        connectionStatus = 'CONNECTING'
        notifyConnectionListeners(connectionStatus)

        websocket.onopen = handleOpen
        websocket.onclose = handleClose
        websocket.onerror = handleError
        websocket.onmessage = handleMessage

        // Wait for the connection to be established
        await waitForConnection()

        console.log(`Connected. ${connectionStatus}`)
    } catch (error) {
        console.error('Failed to establish a connection:', error)
        connectionStatus = 'NOT_CONNECTED'
    }
}

// Assuming the function `waitForConnection` is defined elsewhere
// It should ensure the connection status is 'CONNECTED' before resolving

/**
 * Closes the connection to the WS backend.
 */
function killWebsocket(): void {
    websocket?.close()
}


// Functions used within WS API
/**
 * Sends a command with specified options over a WebSocket and waits for a reply.
 * The function returns a promise that resolves with the reply of type `ReplyType`.
 * 
 * @template ReplyType - The expected type of the reply.
 * @template Options - The type of the options to be sent with the command.
 * @param {string} command - The command to be sent over the WebSocket.
 * @param {Options} options - The options to be included with the command.
 * @returns {Promise<ReplyType>} - A promise that resolves with the reply of type `ReplyType`.
 */
async function sendRequestAndWaitForReplyWithOptions<ReplyType, Options>(command: string, options: Options): Promise<ReplyType> {
    const requestId = makeRequestId()

    const message = {
        command,
        requestId,
        ...options
    }

    console.log(message)

    websocket?.send(JSON.stringify(message))

    wsApiDebugSettings.send && console.log(`Send request: ${command} with id: ${requestId}`)

    const timestampSent = Date.now()

    // eslint-disable-next-line
    return new Promise((resolve: (value: ReplyType) => void, reject: (reason?: any) => void) => {
        const timer = setInterval(() => {
            const timestampSawReply = Date.now()

            if (timestampSawReply - timestampSent > MAX_WAIT_FOR_REPLY) {
                clearInterval(timer)
                reject(new Error(`Timeout waiting for reply to command: ${command}`))

                return
            }

            const reply = pendingReplies.get(requestId)

            if (!reply) {
                return
            }

            pendingReplies.delete(requestId)

            clearInterval(timer)

            console.log(`Got reply: ${JSON.stringify(reply)} in ${timestampSawReply - timestampSent} ms`)

            resolve(reply as ReplyType)
        }, 5)
    })
}

/**
 * Sends a command over a WebSocket and waits for a reply.
 * The function returns a promise that resolves with the reply of type `ReplyType`.
 * 
 * @template ReplyType - The expected type of the reply.
 * @param {string} command - The command to be sent over the WebSocket.
 * @returns {Promise<ReplyType>} - A promise that resolves with the reply of type `ReplyType`.
 */
async function sendRequestAndWaitForReply<ReplyType>(command: string): Promise<ReplyType> {
    const requestId = makeRequestId()

    websocket?.send(JSON.stringify(
        {
            command,
            requestId
        }
    ))

    wsApiDebugSettings.send && console.log(`Send request: ${command} with id: ${requestId}`)

    const timestampSent = Date.now()

    // eslint-disable-next-line
    return new Promise((resolve: (value: ReplyType) => void, reject: (reason?: any) => void) => {
        const timer = setInterval(() => {
            const timestampSawReply = Date.now()

            if (timestampSawReply - timestampSent > MAX_WAIT_FOR_REPLY) {
                clearInterval(timer)
                reject(new Error(`Timeout waiting for reply to command: ${command}`))

                return
            }

            const reply = pendingReplies.get(requestId)

            if (reply) {
                pendingReplies.delete(requestId)

                clearInterval(timer)

                console.log(`Got reply: ${JSON.stringify(reply)} in ${timestampSawReply - timestampSent} ms`)

                if (reply?.error) {
                    reject(reply.error)
                } else {
                    resolve(reply as ReplyType)
                }
            }
        }, 5)

        // Cleanup function to clear the interval if the promise is settled
        // TODO: verify that this is correct
        return () => clearInterval(timer)
    })
}

function send(command: string): void {
    const message = JSON.stringify({ command })

    if (wsApiDebugSettings) {
        console.log(`SEND: ${message}`)
    }

    websocket?.send(message)
}

function sendWithOptions<Options>(command: string, options: Options): void {
    const message = JSON.stringify({ command, ...options })

    if (wsApiDebugSettings) {
        console.log(`SEND: ${message}`)
    }

    websocket?.send(message)
}

// eslint-disable-next-line
function websocketMessageReceived(messageFromServer: MessageEvent<any>): void {
    try {
        const message = JSON.parse(messageFromServer.data)

        if (wsApiDebugSettings.receive) {
            console.log(`Received message: ${JSON.stringify(message)}`)
        }

        if (isReplyMessage(message)) {
            wsApiDebugSettings.receive && console.log('Handling reply message')

            pendingReplies.set(message.requestId, message)
        } else {
            wsApiDebugSettings.receive && console.log('Notifying listeners')

            messageListeners.forEach(listener => listener(message))
        }
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e))
        console.info(messageFromServer.data)
    }
}

// Functions used within RPC Core
function makeWsConnectUrl(): string {
    return `ws://${window.location.hostname}:8080/ws/monitor/games`
}

function makeRequestId(): number {
    nextRequestId += 1

    return nextRequestId - 1
}

function handleOpen(): void {
    console.info('Websocket for subscription is open')

    connectionStatus = 'CONNECTED'
    notifyConnectionListeners('CONNECTED')
}

function handleClose(event: CloseEvent): void {
    console.error('Websocket was closed')

    connectionStatus = 'NOT_CONNECTED'
    notifyConnectionListeners('NOT_CONNECTED');

    (async () => attemptReconnect)().then()
}

async function attemptReconnect(): Promise<void> {
    for (let i = 0; i < 100; i++) {
        try {
            connectAndWaitForConnection()

            console.log('Succeeded to reconnect')
            
            break
        } catch (error) {
            console.error(`Failed to reconnect: ${error}`)
        }
    }
}

function handleError(event: Event): void {
    console.error('Websocket encountered an error')

    connectionStatus = 'NOT_CONNECTED'
    notifyConnectionListeners('NOT_CONNECTED');

    (async () => attemptReconnect)().then()
}

function handleMessage(message: MessageEvent): void {
    websocketMessageReceived(message)
}

function notifyConnectionListeners(connectionStatus: ConnectionStatus): void {
    connectionListeners.forEach(listener => listener(connectionStatus))
}

export {
    addConnectionStatusListener,
    addMessageListener,
    sendRequestAndWaitForReply,
    sendRequestAndWaitForReplyWithOptions,
    send,
    sendWithOptions,
    connectAndWaitForConnection,
    killWebsocket,
    waitForConnection
}