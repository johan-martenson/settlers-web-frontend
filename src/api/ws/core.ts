/**
 * RPC Core: contains handling of the websocket connection to the backend and
 * messaging functions to send one-way and request-reply messages.
 *
 * Provides listener interfaces to follow the connection status and received messages.
 */


import { delay } from "../../utils"

// Constants
export const MAX_WAIT_FOR_CONNECTION = 10_000 // milliseconds

const MAX_WAIT_FOR_REPLY = 1000 // milliseconds

// Types
export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'NOT_CONNECTED'

type RequestId = number
type ReplyMessage = { requestId: RequestId, error?: string }
type ConnectionListener = (connectionState: ConnectionStatus) => void
type MessageListener = (message: unknown) => void

// Type functions
/**
 * Determines if a given message is a valid reply message based on its structure.
 * @param message The message to check.
 * @returns {boolean} True if the message is a reply message, false otherwise.
 */
function isReplyMessage(message: unknown): message is ReplyMessage {
    return message !== undefined &&
        message !== null &&
        typeof message === 'object' &&
        'requestId' in message
}

// Configuration
export const wsApiCoreDebugSettings = {
    receive: false,
    send: false,
    connectionHandling: true
}

// State
const pendingReplies: Map<RequestId, ReplyMessage> = new Map()
const connectionListeners: Set<ConnectionListener> = new Set()
const messageListeners: Set<MessageListener> = new Set()

let websocket: WebSocket | undefined
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

/**
 * Adds a listener function that will be called whenever a new message is received.
 * @param {MessageListener} listener The function to be called when a new message arrives.
 */
function addMessageListener(listener: MessageListener): void {
    messageListeners.add(listener)
}

/**
 * Removes a previously added message listener so that it no longer receives message updates.
 * @param {MessageListener} listener The listener function to remove.
 */
// eslint-disable-next-line
function removeMessageListener(listener: MessageListener): void {
    messageListeners.delete(listener)
}

/**
 * Waits for a connection to get established to the WS backend. Will not initiate any connection on its own.
 * @returns {Promise<void>}
 */
async function waitForConnection(): Promise<void> {
    const startTime = Date.now()
    let elapsed = 0

    while (elapsed < MAX_WAIT_FOR_CONNECTION) {
        if (connectionStatus === 'CONNECTED') {
            if (wsApiCoreDebugSettings.connectionHandling) {
                console.log('Connection is established')
            }

            return
        }

        // Wait a bit before checking again to reduce CPU usage
        await delay(100) // Wait 100 milliseconds before the next check

        elapsed = Date.now() - startTime
    }

    // If we exit the loop, it means we've timed out
    console.error('Failed to connect to websocket backend')

    throw new Error('Timed out waiting for connection')
}

/**
 * Starts a connection to the WS backend and waits for it to finish. If the connection is already established
 * it will simply return.
 * @returns {Promise<void>}
 */
async function connectAndWaitForConnection(): Promise<void> {
    if (wsApiCoreDebugSettings.connectionHandling) {
        console.log(`Connect and wait until the connection is ready. Connection status: ${connectionStatus}, websocket ready state: ${websocket?.readyState}`)
    }

    // Re-use the existing connection if possible
    if (connectionStatus === 'CONNECTED') {
        if (wsApiCoreDebugSettings.connectionHandling) {
            console.log('Already connected')
        }

        return
    }

    try {
        const websocketUrl = makeWsConnectUrl()

        if (wsApiCoreDebugSettings.connectionHandling) {
            console.info(`Websocket url: ${websocketUrl}`)
        }

        websocket = new WebSocket(websocketUrl)

        connectionStatus = 'CONNECTING'
        notifyConnectionListeners(connectionStatus)

        websocket.onopen = handleOpen
        websocket.onclose = handleClose
        websocket.onerror = handleError
        websocket.onmessage = handleMessage

        // Wait for the connection to be established
        await waitForConnection()

        if (wsApiCoreDebugSettings.connectionHandling) {
            console.log(`Connected. ${connectionStatus}`)
        }
    } catch (error) {
        console.error('Failed to establish a connection:', error)

        connectionStatus = 'NOT_CONNECTED'
    }
}

/**
 * Closes the connection to the WS backend. Used to test the error case when the connection is broken.
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

    if (wsApiCoreDebugSettings.send) {
        console.log(message)
    }

    websocket?.send(JSON.stringify(message))

    if (wsApiCoreDebugSettings.send) {
        console.log(`Send request: ${command} with id: ${requestId}`)
    }

    const startTime = Date.now()
    let elapsed = 0

    while (elapsed < MAX_WAIT_FOR_REPLY) {
        await delay(5)
        elapsed = Date.now() - startTime

        const reply = pendingReplies.get(requestId)

        if (reply) {
            pendingReplies.delete(requestId)

            if (wsApiCoreDebugSettings.send) {
                console.log(`Got reply: ${JSON.stringify(reply)} in ${elapsed} ms`)
            }

            if (reply?.error) {
                throw new Error(reply.error)
            } else {
                return reply as ReplyType
            }
        }
    }

    throw new Error(`Timeout waiting for reply to command: ${command}`)
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

    if (wsApiCoreDebugSettings.send) {
        console.log(`Send request: ${command} with id: ${requestId}`)
    }

    websocket?.send(JSON.stringify({ command, requestId }))

    const startTime = Date.now()
    let elapsed = 0

    while (elapsed < MAX_WAIT_FOR_REPLY) {
        await delay(5)
        elapsed = Date.now() - startTime

        const reply = pendingReplies.get(requestId)

        if (reply) {
            pendingReplies.delete(requestId)

            if (wsApiCoreDebugSettings.send) {
                console.log(`Got reply: ${JSON.stringify(reply)} in ${elapsed} ms`)
            }

            if (reply?.error) {
                throw new Error(reply.error)
            } else {
                return reply as ReplyType
            }
        }
    }

    throw new Error(`Timeout waiting for reply to command: ${command}`)
}

/**
 * Sends a command over the WebSocket connection without additional options.
 * @param {string} command The command to send.
 */
function send(command: string): void {
    const message = JSON.stringify({ command })

    if (wsApiCoreDebugSettings.send) {
        console.log(`SEND: ${message}`)
    }

    websocket?.send(message)
}

/**
 * Sends a command with additional options over the WebSocket connection.
 * @param {string} command The command to send.
 * @param {Options} options The additional options to include with the command.
 */
function sendWithOptions<Options>(command: string, options: Options): void {
    const message = JSON.stringify({ command, ...options })

    if (wsApiCoreDebugSettings.send) {
        console.log(`SEND: ${message}`)
    }

    websocket?.send(message)
}

/**
 * Handles incoming messages from the WebSocket server.
 * @param {MessageEvent<any>} messageFromServer The message event received from the server.
 */
// eslint-disable-next-line
function handleMessage(messageFromServer: MessageEvent<any>): void {
    try {
        const message = JSON.parse(messageFromServer.data)

        if (wsApiCoreDebugSettings.receive) {
            console.log(`Received message: ${JSON.stringify(message)}`)
        }

        if (isReplyMessage(message)) {
            if (wsApiCoreDebugSettings.receive) {
                console.log('Handling reply message')
            }

            pendingReplies.set(message.requestId, message)
        } else {
            if (wsApiCoreDebugSettings.receive) {
                console.log('Notifying listeners')
            }

            messageListeners.forEach(listener => listener(message))
        }
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e))
        console.info(messageFromServer.data)
    }
}

// Functions used within RPC Core
/**
 * Constructs the WebSocket connection URL based on the current window location.
 * @returns {string} The WebSocket URL to connect to.
 */
function makeWsConnectUrl(): string {
    return `ws://${window.location.hostname}:8080/ws/monitor/games`
}

/**
 * Generates a new request ID for WebSocket communications.
 * @returns {number} A new unique request ID.
 */
function makeRequestId(): number {
    nextRequestId += 1

    return nextRequestId - 1
}

/**
 * Handles the open event for the WebSocket connection, setting the connection status to 'CONNECTED'.
 */
function handleOpen(): void {
    if (wsApiCoreDebugSettings.connectionHandling) {
        console.info('Websocket for subscription is open')
    }

    connectionStatus = 'CONNECTED'
    notifyConnectionListeners('CONNECTED')
}

/**
 * Handles the close event for the WebSocket connection, setting the connection status to 'NOT_CONNECTED' and attempting to reconnect.
 * @param {CloseEvent} event The close event object.
 */
function handleClose(event: CloseEvent): void {
    if (wsApiCoreDebugSettings.connectionHandling) {
        console.error('Websocket was closed')
    }

    connectionStatus = 'NOT_CONNECTED'
    notifyConnectionListeners('NOT_CONNECTED');

    (async () => attemptReconnect)().then()
}

/**
 * Tries to reconnet to the backend when the connection has been lost.
 */
async function attemptReconnect(): Promise<void> {
    for (let i = 0; i < 100; i++) {
        try {
            if (wsApiCoreDebugSettings.connectionHandling) {
                console.log('Attempting to reconnect')
            }

            await connectAndWaitForConnection()

            if (wsApiCoreDebugSettings.connectionHandling) {
                console.log('Succeeded to reconnect')
            }

            break
        } catch (error) {
            console.error(`Failed to reconnect: ${error}`)
        }
    }
}

/**
 * Handles errors that occur during WebSocket communication.
 * @param {Event} event The error event object.
 */
function handleError(event: Event): void {
    if (wsApiCoreDebugSettings.connectionHandling) {
        console.error('Websocket encountered an error')
    }

    connectionStatus = 'NOT_CONNECTED'
    notifyConnectionListeners('NOT_CONNECTED');

    (async () => attemptReconnect)().then()
}

/**
 * Notifies all registered connection listeners about a change in connection status.
 * @param {ConnectionStatus} connectionStatus The new connection status.
 */
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