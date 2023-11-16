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

    soundInstances.forEach((sound, title) => {
        sound.load()
    })

    monitor.listenToActions({
        actionStarted: (id: string, point: Point, action: WorkerAction) => {
            console.log(action)

            ongoingEffects.set(id, { id, point, action, index: 0 })
        },
        actionEnded: (id: string, point: Point, action: string) => {
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
            // 2) Step index
            // 3) Determine based on the timing of the action if it's time to make the sound

            ongoingEffects.forEach((ongoingEffect) => {
                const soundEffect = SOUND_EFFECTS.get(ongoingEffect.action)

                if (soundEffect && ongoingEffect.index === soundEffect.start) {
                    console.log(soundEffect.audio)

                    ongoingEffect.playing = play(soundEffect.audio, soundEffect.type === 'LOOPING')
                }

                ongoingEffect.index += 1

                if (soundEffect && ongoingEffect.index === soundEffect.animationLength) {
                    ongoingEffect.index = 0
                }
            })
        }, 300)
}

function setSoundEffectsVolume(newVolume: number) {
    console.log("Set sound effects volume to " + newVolume)

    volume = newVolume

    soundInstances.forEach(soundInstance => soundInstance.setVolume(newVolume))
}

export {
    play,
    startEffects,
    setSoundEffectsVolume
}