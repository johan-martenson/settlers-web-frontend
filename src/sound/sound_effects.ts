import { DEFAULT_VOLUME } from "../screens/play/play"
import { Action, HouseId, Point } from "../api/types"
import { api } from "../api/ws-api"
import { Sound } from "./utils"
import { screenPointToGamePointNoHeightAdjustment } from "../utils/utils"
import { View } from "../render/game_render"

// Types
export type SoundEffect =
    | 'NEW-MESSAGE'
    | 'WOODCUTTER_CUTTING'
    | 'HAMMERING'
    | 'FORESTER_PLANTING'
    | 'STONEMASON_HACKING'
    | 'FIRE'
    | 'GEOLOGIST_FINDING'
    | 'GEOLOGIST_DIGGING'
    | 'FALLING_TREE'

type SoundEffectsState = 'NOT_SUBSCRIBED' | 'RUNNING' | 'STOPPED'

type Visibility = {
    left: number
    right: number
    top: number
    bottom: number
}

type OngoingEffect = {
    id: string
    point: Point
    action: Action
    index: number
    playing?: Sound
}

type SoundEffectInformation = {
    start: number
    animationLength: number
    audio: SoundEffect
    type: 'ONCE' | 'PERIODIC' | 'LOOPING'
}

// Constants
const SOUND_INSTANCES = new Map<SoundEffect, Sound>()

SOUND_INSTANCES.set("NEW-MESSAGE", new Sound("assets/audio/new-message.wave"))
SOUND_INSTANCES.set("WOODCUTTER_CUTTING", new Sound("assets/audio/woodcutter-cutting.wave"))
SOUND_INSTANCES.set("FORESTER_PLANTING", new Sound("assets/audio/forester-0.wave"))
SOUND_INSTANCES.set('STONEMASON_HACKING', new Sound("assets/audio/stonemason-hacking.wave"))
SOUND_INSTANCES.set('FIRE', new Sound("assets/audio/fire.wave"))
SOUND_INSTANCES.set('GEOLOGIST_FINDING', new Sound("assets/audio/geologist-finding.wave"))
SOUND_INSTANCES.set('GEOLOGIST_DIGGING', new Sound("assets/audio/geologist-digging-1.wave"))
SOUND_INSTANCES.set('FALLING_TREE', new Sound('assets/audio/falling-tree.wave'))

const SOUND_EFFECTS = new Map<Action, SoundEffectInformation>()

SOUND_EFFECTS.set("HAMMERING_HOUSE_HIGH_AND_LOW", { start: 0, animationLength: 8, audio: "HAMMERING", type: 'PERIODIC' })
SOUND_EFFECTS.set("CUTTING", { start: 4, animationLength: 8, audio: "WOODCUTTER_CUTTING", type: 'PERIODIC' })
SOUND_EFFECTS.set('PLANTING_TREE', { start: 36, animationLength: 36, audio: "FORESTER_PLANTING", type: 'ONCE' })
SOUND_EFFECTS.set('HACKING_STONE', { start: 4, animationLength: 8, audio: 'STONEMASON_HACKING', type: 'PERIODIC' })
SOUND_EFFECTS.set('HOUSE_BURNING', { start: 0, animationLength: 2, audio: 'FIRE', type: 'LOOPING' })
SOUND_EFFECTS.set('INVESTIGATING', { start: 10, animationLength: 16, audio: 'GEOLOGIST_DIGGING', type: 'PERIODIC' })
SOUND_EFFECTS.set('FALLING_TREE', { start: 0, animationLength: 4, audio: 'FALLING_TREE', type: 'ONCE' })

const sfx = {
    play,
    startEffects,
    stopEffects,
    setSoundEffectsVolume
}

// Configuration

// State
let soundEffectsState: SoundEffectsState = 'NOT_SUBSCRIBED'
let visibility: Visibility = { left: 0, right: 0, top: 0, bottom: 0 }
let volume = 0
let soundEffectsTimer: NodeJS.Timeout | undefined
let view: View | undefined

const ongoingEffects = new Map<string, OngoingEffect>()

// Init
SOUND_INSTANCES.forEach(sound => sound.load())

// Functions
function play(soundName: SoundEffect, loop = false): Sound | undefined {
    const sound = SOUND_INSTANCES.get(soundName)

    sound?.play(volume, 0, loop)

    return sound
}

function stopEffects(): void {
    soundEffectsState = 'STOPPED'
    clearInterval(soundEffectsTimer)
}

function startEffects(viewToSet: View): void {
    if (soundEffectsState === 'RUNNING') {
        return
    }

    view = viewToSet

    volume = DEFAULT_VOLUME

    // Load each sound
    // eslint-disable-next-line
    SOUND_INSTANCES.forEach(sound => sound.load())

    // Listen to events to start/stop sound effects
    api.addActionsListener({
        actionStarted: (id: string, point: Point, action: Action) => {
            ongoingEffects.set(id, { id, point, action, index: 0 })
        },

        // eslint-disable-next-line
        actionEnded: id => {
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

    api.addBurningHousesListener({
        houseStartedToBurn: (id: HouseId, point: Point) => {
            ongoingEffects.set(id, { id, point, action: 'HOUSE_BURNING', index: 0 })
        },

        // eslint-disable-next-line
        houseStoppedBurning: id => {
            ongoingEffects.get(id)?.playing?.stop()
            ongoingEffects.delete(id)
        },
    })

    // eslint-disable-next-line
    api.addMessagesListener(() => {
        SOUND_INSTANCES.get('NEW-MESSAGE')?.play()
    })

    soundEffectsState = 'RUNNING'

    soundEffectsTimer = setInterval(() => {
        if (view === undefined) {
            console.error('View is undefined')

            return
        }


        // Keep track of what's visible on the screen
        const upperLeftGamePoint = screenPointToGamePointNoHeightAdjustment({ x: 0, y: 0 }, view)
        const lowerRightGamePoint = screenPointToGamePointNoHeightAdjustment({ x: view.screenSize.width, y: view.screenSize.height }, view)

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

function setSoundEffectsVolume(newVolume: number): void {
    volume = newVolume

    SOUND_INSTANCES.forEach(soundInstance => soundInstance.setVolume(newVolume))
}

export { sfx }