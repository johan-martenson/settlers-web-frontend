// Types
type AnimationTarget = 'ZOOM' | 'TRANSLATE' | 'MUSIC_VOLUME' | 'EFFECTS_VOLUME'
type AnimatorState = 'RUNNING' | 'STOPPED'
type OneOrMany = 'ONE' | 'MANY'

type OngoingAnimation = {
    current: number[]
    target: number[]
    oneOrMany: OneOrMany
    onUpdatedValue: ((value: number) => void) | undefined
    onUpdatedValues: ((value: number[]) => void) | undefined
    speed: number
}

// Constants
const CLOSE_ENOUGH = 0.01
const SPEED = 0.5
const DT = 1

// State
// Can be canceled by id
const ongoingAnimations = new Map<string, OngoingAnimation>()

// Can't be canceled (because they are without ids)
const ongoingAnimationsWithoutIds = new Set<OngoingAnimation>()

let timer: NodeJS.Timeout | undefined
let state: AnimatorState = 'STOPPED'

// Functions
function step() {
    ongoingAnimations.forEach((animation, variable) => {
        let allReachedTarget = true

        for (let i = 0; i < animation.target.length; i++) {
            let current = animation.current[i]
            const target = animation.target[i]

            if (Math.abs(target - current) >= CLOSE_ENOUGH) {
                current += (target - current) * (1 - Math.exp(- animation.speed * DT))
    
                animation.current[i] = current
    
                allReachedTarget = false
            }
        }

        if (allReachedTarget) {
            ongoingAnimations.delete(variable)

            if (ongoingAnimations.size === 0 && ongoingAnimationsWithoutIds.size === 0) {
                clearInterval(timer)

                state = 'STOPPED'
            }
        }

        if (animation.onUpdatedValue) {
            animation.onUpdatedValue(animation.current[0])
        } else if (animation.onUpdatedValues) {
            animation.onUpdatedValues(animation.current)
        }
    })

    ongoingAnimationsWithoutIds.forEach(animation => {
        let allReachedTarget = true

        for (let i = 0; i < animation.target.length; i++) {
            let current = animation.current[i]
            const target = animation.target[i]

            if (Math.abs(target - current) >= CLOSE_ENOUGH) {
                current += (target - current) * (1 - Math.exp(- animation.speed * DT))

                animation.current[i] = current

                allReachedTarget = false
            }
        }

        if (allReachedTarget) {
            ongoingAnimationsWithoutIds.delete(animation)

            if (ongoingAnimations.size === 0 && ongoingAnimationsWithoutIds.size === 0) {
                clearInterval(timer)

                state = 'STOPPED'
            }
        }

        if (animation.onUpdatedValue) {
            animation.onUpdatedValue(animation.current[0])
        } else if (animation.onUpdatedValues) {
            animation.onUpdatedValues(animation.current)
        }
    })
}

function animateSeveralNoId(onUpdatedValues: ((value: number[]) => void), current: number[], target: number[], speed = SPEED): void {
    ongoingAnimationsWithoutIds.add(
        {
            current: current,
            target: target,
            oneOrMany: 'MANY',
            onUpdatedValue: undefined,
            onUpdatedValues,
            speed
        })

    if (state === 'STOPPED') {
        timer = setInterval(
            () => step(),
            30)

        state = 'RUNNING'
    }
}


function animateNoId(onUpdatedValue: ((value: number) => void), current: number, target: number, speed = SPEED): void {
    ongoingAnimationsWithoutIds.add(
        {
            current: [current],
            target: [target],
            oneOrMany: 'ONE',
            onUpdatedValue,
            onUpdatedValues: undefined,
            speed
        })

    if (state === 'STOPPED') {
        timer = setInterval(
            () => step(),
            30)

        state = 'RUNNING'
    }
}

function animate(animationTarget: AnimationTarget, onUpdatedValue: ((value: number) => void), current: number, target: number, speed = SPEED): void {
    ongoingAnimations.set(animationTarget,
        {
            current: [current],
            target: [target],
            oneOrMany: 'ONE',
            onUpdatedValue,
            onUpdatedValues: undefined,
            speed
        })

    if (state === 'STOPPED') {
        timer = setInterval(
            () => step(),
            30)

        state = 'RUNNING'
    }
}

function animateSeveral(animationTarget: AnimationTarget, onUpdatedValues: ((values: number[]) => void), current: number[], targets: number[], speed = SPEED): void {
    ongoingAnimations.set(animationTarget,
        {
            current,
            target: targets,
            oneOrMany: 'MANY',
            onUpdatedValue: undefined,
            onUpdatedValues,
            speed
        })

    if (state === 'STOPPED') {
        timer = setInterval(
            () => step(),
            30)

        state = 'RUNNING'
    }
}

function stopAnimation(animationTarget: AnimationTarget) {
    ongoingAnimations.delete(animationTarget)

    if (ongoingAnimations.size === 0 && ongoingAnimationsWithoutIds.size === 0 && timer) {
        clearInterval(timer)

        state = 'STOPPED'
    }
}

const animator = {
    animate,
    animateSeveral,
    animateNoId,
    animateSeveralNoId,
    stopAnimation
}

export {
    animator
}