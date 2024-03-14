import { DEFAULT_VOLUME, immediateUxState } from "../App"
import { Action, GameMessage, GameMessageId, HouseId, Point } from "../api/types"
import { monitor } from "../api/ws-api"
import { Sound } from "./utils"
import { screenPointToGamePoint } from "../utils"

export type SoundEffect = 'NEW-MESSAGE' |
    'WOODCUTTER_CUTTING' |
    'HAMMERING' |
    'FORESTER_PLANTING' |
    'STONEMASON_HACKING' |
    'FIRE' |
    'GEOLOGIST_FINDING' |
    'GEOLOGIST_DIGGING' |
    'FALLING_TREE'

interface Sfx {
    play: ((name: SoundEffect, loop: boolean) => Sound | undefined)
    startEffects: (() => void)
    setSoundEffectsVolume: ((volume: number) => void)
}

const sfx: Sfx = {
    play: play,
    startEffects: startEffects,
    setSoundEffectsVolume: setSoundEffectsVolume
}

interface Visibility {
    left: number
    right: number
    top: number
    bottom: number
}

let visibility: Visibility = { left: 0, right: 0, top: 0, bottom: 0 }

const soundInstances = new Map<SoundEffect, Sound>()

soundInstances.set("NEW-MESSAGE", new Sound("assets/audio/new-message.wave"))
soundInstances.set("WOODCUTTER_CUTTING", new Sound("assets/audio/woodcutter-cutting.wave"))
soundInstances.set("FORESTER_PLANTING", new Sound("assets/audio/forester-0.wave"))
soundInstances.set('STONEMASON_HACKING', new Sound("assets/audio/stonemason-hacking.wave"))
soundInstances.set('FIRE', new Sound("assets/audio/fire.wave"))
soundInstances.set('GEOLOGIST_FINDING', new Sound("assets/audio/geologist-finding.wave"))
soundInstances.set('GEOLOGIST_DIGGING', new Sound("assets/audio/geologist-digging-1.wave"))
soundInstances.set('FALLING_TREE', new Sound('assets/audio/falling-tree.wave'))

soundInstances.forEach(sound => sound.load())

let soundEffectsState: 'NOT_SUBSCRIBED' | 'RUNNING' | 'STOPPED' = 'NOT_SUBSCRIBED'

let volume = 0

function play(soundName: SoundEffect, loop = false): Sound | undefined {
    const sound = soundInstances.get(soundName)

    if (sound) {
        sound.play(volume, 0, loop)
    }

    return sound
}

interface OngoingEffect {
    id: string
    point: Point
    action: Action
    index: number
    playing?: Sound
}

const ongoingEffects: Map<string, OngoingEffect> = new Map()

interface SoundEffectInformation {
    start: number
    animationLength: number
    audio: SoundEffect
    type: 'ONCE' | 'PERIODIC' | 'LOOPING'
}

const SOUND_EFFECTS = new Map<Action, SoundEffectInformation>()

SOUND_EFFECTS.set("HAMMERING_HOUSE_HIGH_AND_LOW", { start: 0, animationLength: 8, audio: "HAMMERING", type: 'PERIODIC' })
SOUND_EFFECTS.set("CUTTING", { start: 4, animationLength: 8, audio: "WOODCUTTER_CUTTING", type: 'PERIODIC' })
SOUND_EFFECTS.set('PLANTING_TREE', { start: 36, animationLength: 36, audio: "FORESTER_PLANTING", type: 'ONCE' })
SOUND_EFFECTS.set('HACKING_STONE', { start: 4, animationLength: 8, audio: 'STONEMASON_HACKING', type: 'PERIODIC' })
SOUND_EFFECTS.set('HOUSE_BURNING', { start: 0, animationLength: 2, audio: 'FIRE', type: 'LOOPING' })
SOUND_EFFECTS.set('INVESTIGATING', { start: 10, animationLength: 16, audio: 'GEOLOGIST_DIGGING', type: 'PERIODIC' })
SOUND_EFFECTS.set('FALLING_TREE', { start: 0, animationLength: 4, audio: 'FALLING_TREE', type: 'ONCE' })

function startEffects() {
    if (soundEffectsState === 'RUNNING') {
        return
    }

    volume = DEFAULT_VOLUME

    // Load each sound
    // eslint-disable-next-line
    soundInstances.forEach((sound, title) => {
        sound.load()
    })

    // Listen to events to start/stop sound effects
    monitor.listenToActions({
        actionStarted: (id: string, point: Point, action: Action) => {
            ongoingEffects.set(id, { id, point, action, index: 0 })
        },

        // eslint-disable-next-line
        actionEnded: (id: string, point: Point, action: string) => {

            const ongoingEffect = ongoingEffects.get(id)

            if (ongoingEffect) {
                const soundEffect = SOUND_EFFECTS.get(ongoingEffect.action)

                if (ongoingEffect.playing && soundEffect?.type === 'LOOPING') {
                    ongoingEffects.get(id)?.playing?.stop()
                }
            }

            ongoingEffects.delete(id)
        }
    })

    monitor.listenToBurningHouses({
        houseStartedToBurn: (id: HouseId, point: Point) => {
            ongoingEffects.set(id, { id, point, action: 'HOUSE_BURNING', index: 0 })
        },

        // eslint-disable-next-line
        houseStoppedBurning: (id: HouseId, point: Point) => {
            ongoingEffects.get(id)?.playing?.stop()

            ongoingEffects.delete(id)
        },
    })

    // eslint-disable-next-line
    monitor.listenToMessages((newMessages: GameMessage[], removedMessages: GameMessageId[]) => {
        soundInstances.get('NEW-MESSAGE')?.play()
    })

    soundEffectsState = 'RUNNING'

    setInterval(
        () => {

            // Keep track of what's visible on the screen
            const upperLeftGamePoint = screenPointToGamePoint({ x: 0, y: 0 }, immediateUxState.translate.x, immediateUxState.translate.y, immediateUxState.scale, immediateUxState.height)
            const lowerRightGamePoint = screenPointToGamePoint({ x: immediateUxState.width, y: immediateUxState.height }, immediateUxState.translate.x, immediateUxState.translate.y, immediateUxState.scale, immediateUxState.height)

            visibility = {
                left: upperLeftGamePoint.x,
                right: lowerRightGamePoint.x,
                top: upperLeftGamePoint.y,
                bottom: lowerRightGamePoint.y
            }

            // 1) Go through each ongoing actions
            ongoingEffects.forEach((ongoingEffect, id) => {
                const soundEffect = SOUND_EFFECTS.get(ongoingEffect.action)

                // 2) Determine based on the timing of the action if it's time to make the sound
                if (soundEffect &&
                    ongoingEffect.index === soundEffect.start &&
                    ongoingEffect.point.x > visibility.left &&
                    ongoingEffect.point.x < visibility.right &&
                    ongoingEffect.point.y < visibility.top &&
                    ongoingEffect.point.y > visibility.bottom) {
                    ongoingEffect.playing = play(soundEffect.audio, soundEffect.type === 'LOOPING')
                }

                // 3) Step index
                ongoingEffect.index += 1

                if (soundEffect && ongoingEffect.index === soundEffect.animationLength) {
                    if (soundEffect.type === 'ONCE') {
                        ongoingEffects.delete(id)
                    } else {
                        ongoingEffect.index = 0
                    }
                }
            })
        }, 300)
}

function setSoundEffectsVolume(newVolume: number) {
    volume = newVolume

    soundInstances.forEach(soundInstance => soundInstance.setVolume(newVolume))
}

export { sfx }