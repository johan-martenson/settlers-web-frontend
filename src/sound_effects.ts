export type SoundEffect = 'NEW-MESSAGE' | 'WOODCUTTER_CUTTING'

const soundInstances = new Map<SoundEffect, HTMLAudioElement>()

soundInstances.set("NEW-MESSAGE", new Audio("assets/audio/new-message.wave"))
soundInstances.set("WOODCUTTER_CUTTING", new Audio("assets/audio/woodcutter-cutting.wave"))

function play(soundName: SoundEffect): void {
    const sound = soundInstances.get(soundName)

    if (sound) {
        sound.play()
    }
}

export {
    play
}