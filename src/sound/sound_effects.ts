import { DEFAULT_VOLUME } from "../App"
import { GameMessage, GameMessageId, HouseId, Point, WorkerAction } from "../api/types"
import { monitor } from "../api/ws-api"
import { Sound } from "./utils"

export type SoundEffect = 'NEW-MESSAGE' |
    'WOODCUTTER_CUTTING' |
    'HAMMERING' |
    'FORESTER_PLANTING' |
    'STONEMASON_HACKING' |
    'FIRE' |
    'GEOLOGIST_FINDING' |
    'GEOLOGIST_DIGGING'

interface Sfx {
    play: ((name: SoundEffect, loop: boolean) => Sound | undefined)
    startEffects: (() => void)
    setSoundEffectsVolume: ((volume: number) => void)
    setVisibleOnScreen: ((left: number, right: number, top: number, bottom: number) => void)
}

const sfx: Sfx = {
    play: play,
    startEffects: startEffects,
    setSoundEffectsVolume: setSoundEffectsVolume,
    setVisibleOnScreen: setVisibleOnScreen
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

soundInstances.forEach(sound => sound.load())

let soundEffectsState: 'NOT_SUBSCRIBED' | 'RUNNING' | 'STOPPED' = 'NOT_SUBSCRIBED'

let volume = 0

function play(soundName: SoundEffect, loop = false): Sound | undefined {
    const sound = soundInstances.get(soundName)

    if (sound) {
        sound.play(volume)
    }

    return sound
}

interface OngoingEffect {
    id: string
    point: Point
    action: AnyAction
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

type AnyAction = WorkerAction | 'HOUSE_BURNING'

const SOUND_EFFECTS = new Map<AnyAction, SoundEffectInformation>()

SOUND_EFFECTS.set("HAMMERING_HOUSE_HIGH_AND_LOW", { start: 0, animationLength: 8, audio: "HAMMERING", type: 'PERIODIC' })
SOUND_EFFECTS.set("CUTTING", { start: 4, animationLength: 8, audio: "WOODCUTTER_CUTTING", type: 'PERIODIC' })
SOUND_EFFECTS.set('PLANTING_TREE', { start: 36, animationLength: 36, audio: "FORESTER_PLANTING", type: 'ONCE' })
SOUND_EFFECTS.set('HACKING_STONE', { start: 4, animationLength: 8, audio: 'STONEMASON_HACKING', type: 'PERIODIC' })
SOUND_EFFECTS.set('HOUSE_BURNING', { start: 0, animationLength: 2, audio: 'FIRE', type: 'LOOPING' })
SOUND_EFFECTS.set('INVESTIGATING', { start: 10, animationLength: 16, audio: 'GEOLOGIST_DIGGING', type: 'PERIODIC' })

function startEffects() {
    if (soundEffectsState === 'RUNNING') {
        return
    }

    volume = DEFAULT_VOLUME

    // Load each sound
    soundInstances.forEach((sound, title) => {
        sound.load()
    })

    // Listen to events to start/stop sound effects
    monitor.listenToActions({
        actionStarted: (id: string, point: Point, action: WorkerAction) => {
            ongoingEffects.set(id, { id, point, action, index: 0 })
        },
        actionEnded: (id: string, point: Point, action: string) => {
            ongoingEffects.get(id)?.playing?.stop()

            ongoingEffects.delete(id)
        }
    })

    monitor.listenToBurningHouses({
        houseStartedToBurn: (id: HouseId, point: Point) => {
            ongoingEffects.set(id, { id, point, action: 'HOUSE_BURNING', index: 0 })
        },
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

function setVisibleOnScreen(left: number, right: number, top: number, bottom: number): void {
    visibility = {
        left,
        right,
        top,
        bottom
    }
}

export { sfx }