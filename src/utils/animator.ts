type AnimationTarget = 'ZOOM' | 'TRANSLATE'
type AnimatorState = 'RUNNING' | 'STOPPED'
type OneOrMany = 'ONE' | 'MANY'

type OngoingAnimation = {
    current: number[]
    target: number[]
    oneOrMany: OneOrMany
    onUpdatedValue: ((value: number) => void) | undefined
    onUpdatedValues: ((value: number[]) => void) | undefined
}

const CLOSE_ENOUGH = 0.01
const SPEED = 0.5
const DT = 1

const ongoingAnimations = new Map<String, OngoingAnimation>()

let timer: NodeJS.Timeout | undefined
let state: AnimatorState = 'STOPPED'

function step() {
    ongoingAnimations.forEach((animation, variable) => {

        let allReachedTarget = true

        for (let i = 0; i < animation.target.length; i++) {
            let current = animation.current[i]
            let target = animation.target[i]

            if (Math.abs(target - current) >= CLOSE_ENOUGH) {
                current += (target - current) * (1 - Math.exp(- SPEED * DT))
    
                animation.current[i] = current
    
                allReachedTarget = false
            }
        }

        if (allReachedTarget) {
            ongoingAnimations.delete(variable)

            if (ongoingAnimations.size === 0) {
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

function animate(animationTarget: AnimationTarget, onUpdatedValue: ((value: number) => void), current: number, target: number): void {
    ongoingAnimations.set(animationTarget,
        {
            current: [current],
            target: [target],
            oneOrMany: 'ONE',
            onUpdatedValue,
            onUpdatedValues: undefined
        })

    if (state === 'STOPPED') {
        timer = setInterval(
            () => step(),
            30)

        state = 'RUNNING'
    }
}

function animateSeveral(animationTarget: AnimationTarget, onUpdatedValues: ((values: number[]) => void), current: number[], targets: number[]): void {
    ongoingAnimations.set(animationTarget,
        {
            current,
            target: targets,
            oneOrMany: 'MANY',
            onUpdatedValue: undefined,
            onUpdatedValues
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

    if (ongoingAnimations.size == 0 && timer) {
        clearInterval(timer)

        state = 'STOPPED'
    }
}

const animator = {
    animate,
    animateSeveral,
    stopAnimation
}

export {
    animator
}