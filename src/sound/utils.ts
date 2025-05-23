const context = new AudioContext()

type PlayingAudio = {
    source: AudioBufferSourceNode
    gainNode: GainNode
}

export class Sound {
    private url = ''
    private buffer: AudioBuffer | null = null
    private sources: PlayingAudio[] = []

    constructor(url: string) {
        this.url = url
    }

    async load(): Promise<AudioBuffer> {
        if (!this.url) {
            throw new Error(`Missing or invalid URL: ${this.url}`)
        }

        if (this.buffer) {
            return this.buffer
        }

        const request = new XMLHttpRequest()
        request.open('GET', this.url, true)
        request.responseType = 'arraybuffer'

        // Wrap the XMLHttpRequest in a promise to use with async/await
        const arrayBuffer: ArrayBuffer = await new Promise((resolve, reject) => {
            request.onload = () => {
                resolve(request.response)
            }

            request.onerror = error => {
                console.log(`Sound XMLHttpRequest error: ${error}`)
                reject(error)
            }

            request.send()
        })

        // Decode the array buffer into an AudioBuffer
        const buffer = await context.decodeAudioData(arrayBuffer)

        if (!buffer) {
            console.log(`Sound decoding error: ${this.url}`)
            throw new Error(`Sound decoding error: ${this.url}`)
        }

        this.buffer = buffer
        return buffer
    }

    play(volume = 1, time = 0, loop = false) {
        if (!this.buffer) {
            return
        }

        // Create a new sound source and assign it the loaded sound's buffer:
        const source = context.createBufferSource()
        source.buffer = this.buffer
        source.loop = loop

        // Create a gain node with the desired volume:
        const gainNode = context.createGain()
        gainNode.gain.value = volume

        // Connect nodes:
        source.connect(gainNode).connect(context.destination)

        // Keep track of all sources created, and stop tracking them once they finish playing:
        const insertedAt = this.sources.push({ source, gainNode }) - 1

        source.onended = () => {
            source.stop(0)
            this.sources.splice(insertedAt, 1)
        }

        // Start playing at the desired time:
        source.start(time)
    }

    stop() {
        // Stop any sources still playing:
        this.sources.forEach((source) => source.source.stop(0))
        this.sources = []
    }

    setVolume(volume: number) {
        this.sources.forEach(source => source.gainNode.gain.value = volume)
    }
}