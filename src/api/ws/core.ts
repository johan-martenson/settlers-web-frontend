/**
 * RPC Core: contains handling of the websocket connection to the backend and
 * messaging functions to send one-way and request-reply messages.
 *
 * Provides listener interfaces to follow the connection status and received messages.
 */


import { delay } from "../../utils/utils"

// Constants
export const MAX_WAIT_FOR_CONNECTION = 10_000 // milliseconds
const MAX_WAIT_FOR_REPLY = 5_000 // milliseconds
const RECONNECT_DELAY = 1_000 // milliseconds

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
    return message !== null &&
        typeof message === 'object' &&
        'requestId' in message
}

// Configuration
export const WsCoreLogConfig = {
    receive: false,
    send: false,
    connectionHandling: true,
    ...(JSON.parse(localStorage.getItem('config.wscore.log') ?? '{}'))  // override log settings from local storage if it exists
}

// State
type PendingRequest<T> = {
    resolve: (value: T) => void
    reject: (reason?: unknown) => void
    timeoutId: ReturnType<typeof setTimeout>
}

// eslint-disable-next-line
const pendingRequests = new Map<RequestId, PendingRequest<any>>()
const connectionListeners = new Set<ConnectionListener>()
const messageListeners = new Set<MessageListener>()

let websocket: WebSocket | undefined
let nextRequestId = 0
let connectionStatus: ConnectionStatus = 'NOT_CONNECTED'
let reconnecting = false

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

    while (Date.now() - startTime < MAX_WAIT_FOR_CONNECTION) {
        if (connectionStatus === 'CONNECTED') {
            if (WsCoreLogConfig.connectionHandling) {
                console.log('WS core (connection): Connection is established')
                console.log('WS core (connection): Connection status: CONNECTED')
            }

            return
        }

        // Wait a bit before checking again to reduce CPU usage
        await delay(100) // Wait 100 milliseconds before the next check
    }

    // If we exit the loop, it means we've timed out
    console.error('WS core (connection): Failed to connect to websocket backend')

    throw new Error('Timed out waiting for connection')
}

/**
 * Starts a connection to the WS backend and waits for it to finish. If the connection is already established
 * it will simply return.
 * @returns {Promise<void>}
 */
async function connectAndWaitForConnection(): Promise<void> {
    if (WsCoreLogConfig.connectionHandling) {
        console.log(`WS core (connection): Connect and wait until the connection is ready. Connection status: ${connectionStatus}, websocket ready state: ${websocket?.readyState}`)
    }

    // Re-use the existing connection if possible
    if (connectionStatus === 'CONNECTED') {
        if (WsCoreLogConfig.connectionHandling) {
            console.log('WS core (connection): Already connected')
        }

        return
    }

    if (connectionStatus === 'CONNECTING') {
        if (WsCoreLogConfig.connectionHandling) {
            console.log('WS core (connection): Already connecting, just wait for it to finish')
        }

        await waitForConnection()

        return
    }

    try {
        const websocketUrl = makeWsConnectUrl()

        if (WsCoreLogConfig.connectionHandling) {
            console.info(`WS core (connection): Websocket url: ${websocketUrl}`)
        }

        const socket = new WebSocket(websocketUrl)
        websocket = socket

        connectionStatus = 'CONNECTING'

        if (WsCoreLogConfig.connectionHandling) {
            console.log('WS core (connection): Connection status: CONNECTING')
        }

        notifyConnectionListeners(connectionStatus)

        websocket.onopen = () => handleOpen(socket)
        websocket.onclose = event => handleClose(socket, event)
        websocket.onerror = event => handleError(socket, event)
        websocket.onmessage = handleMessage

        // Wait for the connection to be established
        if (WsCoreLogConfig.connectionHandling) {
            console.log('WS core (connection): Waiting for connection')
        }

        await waitForConnection()

        if (WsCoreLogConfig.connectionHandling) {
            console.log(`WS core (connection): Connected. ${connectionStatus}`)
        }
    } catch (error) {
        console.error('WS core (connection): Failed to establish a connection: ', error)

        connectionStatus = 'NOT_CONNECTED'

        console.log('WS core (connection): Connection status: NOT_CONNECTED')

        notifyConnectionListeners(connectionStatus)

        throw error
    }
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

    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected')
    }

    const requestId = makeRequestId()
    const message = { command, requestId, ...options }

    if (WsCoreLogConfig.send) {
        console.log(`WS core (send): Send request: ${JSON.stringify(message)} with id: ${requestId}`)
    }

    return new Promise<ReplyType>((resolve, reject) => {
        if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket not connected'))
            return
        }

        const timeoutId = setTimeout(() => {
            pendingRequests.delete(requestId)
            reject(new Error(`Timeout waiting for reply to command: ${command}`))
        }, MAX_WAIT_FOR_REPLY)

        pendingRequests.set(requestId, {
            resolve: resolve as (value: unknown) => void,
            reject,
            timeoutId
        })

        websocket.send(JSON.stringify(message))
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
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected')
    }

    const requestId = makeRequestId()

    const message = { command, requestId }

    if (WsCoreLogConfig.send) {
        console.log(`WS core (send): Send request: ${JSON.stringify(message)} with id: ${requestId}`)
    }

    return new Promise<ReplyType>((resolve, reject) => {
        if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket not connected'))
            return
        }

        const timeoutId = setTimeout(() => {
            pendingRequests.delete(requestId)
            reject(new Error(`Timeout waiting for reply to command: ${command}`))
        }, MAX_WAIT_FOR_REPLY)

        pendingRequests.set(requestId, {
            resolve,
            reject,
            timeoutId
        })

        websocket.send(JSON.stringify(message))
    })
}

/**
 * Sends a command over the WebSocket connection without additional options.
 * @param {string} command The command to send.
 */
function send(command: string): void {
    const message = JSON.stringify({ command })

    if (WsCoreLogConfig.send) {
        console.log(`WS core (send): SEND: ${message}`)
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

    if (WsCoreLogConfig.send) {
        console.log(`WS core (send): SEND: ${message}`)
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

        if (WsCoreLogConfig.receive) {
            console.log(`WS core (receive): Received message: ${JSON.stringify(message)}`)
        }

        if (isReplyMessage(message)) {
            if (WsCoreLogConfig.receive) {
                console.log('WS core (receive): Handling reply message')
            }

            const pending = pendingRequests.get(message.requestId)

            if (!pending) {
                if (WsCoreLogConfig.receive) {
                    console.warn(`WS core (receive): Received reply for unknown requestId ${message.requestId}`)
                }

                return
            }

            pendingRequests.delete(message.requestId)
            clearTimeout(pending.timeoutId)

            if (message.error) {
                pending.reject(new Error(message.error))
            } else {
                pending.resolve(message)
            }
        } else {
            if (WsCoreLogConfig.receive) {
                console.log('WS core (receive): Notifying listeners')
            }

            messageListeners.forEach(listener => {
                try {
                    listener(message)
                } catch (e) {
                    console.error('WS core (receive): Error handling message', e)
                    console.error('WS core (receive): Message:', JSON.stringify(message))
                }
            })
        }
    } catch (e) {
        console.error('WS core (receive): Error handling message', e)
        console.error('WS core (receive): Message:', JSON.stringify(e))
        console.info('WS core (receive): Message data:', messageFromServer.data)
    }
}

// Functions used within RPC Core
/**
 * Constructs the WebSocket connection URL based on the current window location.
 * @returns {string} The WebSocket URL to connect to.
 */
function makeWsConnectUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${window.location.hostname}:8080/ws/api`
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
function handleOpen(socket: WebSocket): void {
    if (WsCoreLogConfig.connectionHandling) {
        console.info('WS core (connection): Websocket for subscription is open')
    }

    if (socket !== websocket) {
        if (WsCoreLogConfig.connectionHandling) {
            console.info('WS core (connection): other socket was opened.')
        }

        return
    }

    connectionStatus = 'CONNECTED'

    if (WsCoreLogConfig.connectionHandling) {
        console.log('WS core (connection): Connection status: CONNECTED')
    }

    notifyConnectionListeners('CONNECTED')
}

/**
 * Handles the close event for the WebSocket connection, setting the connection status to 'NOT_CONNECTED' and attempting to reconnect.
 * @param {CloseEvent} event The close event object.
 */
function handleClose(socket: WebSocket, event: CloseEvent): void {
    if (WsCoreLogConfig.connectionHandling) {
        console.error(`WS core (connection): Websocket was closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`)
    }

    if (socket !== websocket) {
        if (WsCoreLogConfig.connectionHandling) {
            console.info('WS core (connection): other socket was closed.')
        }
        return
    }

    connectionStatus = 'NOT_CONNECTED'

    if (WsCoreLogConfig.connectionHandling) {
        console.log('WS core (connection): Notifying connection listeners')
        console.log('WS core (connection): Connection status: NOT_CONNECTED')
    }

    rejectAllPendingRequests('WebSocket connection closed')

    notifyConnectionListeners('NOT_CONNECTED')

    attemptReconnect()
}

/**
 * Tries to reconnect to the backend when the connection has been lost.
 */
async function attemptReconnect(): Promise<void> {
    if (reconnecting) {
        if (WsCoreLogConfig.connectionHandling) {
            console.log('WS core (connection): Already trying to reconnect, just wait for it to finish')
        }

        return
    }

    reconnecting = true

    try {
        if (WsCoreLogConfig.connectionHandling) {
            console.log('WS core (connection): Attempting to reconnect')
        }

        for (let i = 0; i < 100; i++) {
            try {
                if (WsCoreLogConfig.connectionHandling) {
                    console.log('WS core (connection): Attempting to reconnect')
                }

                await connectAndWaitForConnection()

                if (connectionStatus === 'CONNECTED') {
                    if (WsCoreLogConfig.connectionHandling) {
                        console.log('WS core (connection): Succeeded to reconnect')
                    }

                    return
                } else {
                    console.error(`WS core (connection): Failed to reconnect`)
                }
            } catch (error) {
                console.error('WS core (connection): Failed to reconnect', error)
            }

            await delay(RECONNECT_DELAY)
        }
    } finally {
        reconnecting = false
    }
}

/**
 * Handles errors that occur during WebSocket communication.
 * @param {Event} event The error event object.
 */
function handleError(socket: WebSocket, event: Event): void {
    if (WsCoreLogConfig.connectionHandling) {
        console.error('WS core (connection): WebSocket encountered an error', event)
    }

    if (socket !== websocket) {
        if (WsCoreLogConfig.connectionHandling) {
            console.info('WS core (connection): other socket had an error.')
        }
    }

    // Rely on handleClose to perform reconnection attempts
}

function rejectAllPendingRequests(reason: string): void {

    // eslint-disable-next-line
    for (const [_, pending] of pendingRequests) {
        clearTimeout(pending.timeoutId)
        pending.reject(new Error(reason))
    }

    pendingRequests.clear()
}

/**
 * Notifies all registered connection listeners about a change in connection status.
 * @param {ConnectionStatus} connectionStatus The new connection status.
 */
function notifyConnectionListeners(connectionStatus: ConnectionStatus): void {
    connectionListeners.forEach(listener => {
        try {
            listener(connectionStatus)
        } catch (e) {
            console.error('WS core (connection): Error notifying connection listener', e)
        }
    })
}

export {
    addConnectionStatusListener,
    removeConnectionStatusListener,
    addMessageListener,
    removeMessageListener,
    sendRequestAndWaitForReply,
    sendRequestAndWaitForReplyWithOptions,
    send,
    sendWithOptions,
    connectAndWaitForConnection,
    waitForConnection
}
