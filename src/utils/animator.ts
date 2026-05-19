// Types
type AnimationTarget = 'ZOOM' | 'TRANSLATE' | 'MUSIC_VOLUME' | 'EFFECTS_VOLUME'
type AnimatorState = 'RUNNING' | 'STOPPED'
type OnUpdatedValue = (value: number) => void
type OnUpdatedValues = (values: number[]) => void

type OngoingAnimation = {
    current: number[]
    target: number[]
    speed: number
    onUpdatedValue?: OnUpdatedValue
    onUpdatedValues?: OnUpdatedValues
}

// Constants
const CLOSE_ENOUGH = 0.01
const SPEED = 0.5
const DT = 1
const TIMER_INTERVAL_MS = 30

// State
// Can be canceled by id
const ongoingAnimations = new Map<string, OngoingAnimation>()

// Can't be canceled (because they are without ids)
const ongoingAnimationsWithoutIds = new Set<OngoingAnimation>()

let timer: ReturnType<typeof setInterval> | undefined
let state: AnimatorState = 'STOPPED'

// Functions
/**
 * Executes a step in the animation process, updating ongoing animations.
 */
function step(): void {
    const animationVariablesToDelete: string[] = []

    ongoingAnimations.forEach((animation, variable) => {
        let allReachedTarget = true

        for (let i = 0; i < animation.target.length; i++) {
            let current = animation.current[i]
            const target = animation.target[i]

            if (Math.abs(target - current) >= CLOSE_ENOUGH) {
                current += (target - current) * (1 - Math.exp(- animation.speed * DT))
                animation.current[i] = current
                allReachedTarget = false
            } else {
                animation.current[i] = target
            }
        }

        if (allReachedTarget) {
            animationVariablesToDelete.push(variable)

            if (ongoingAnimations.size === 0 && ongoingAnimationsWithoutIds.size === 0) {
                clearInterval(timer)
                state = 'STOPPED'
            }
        }

        animationVariablesToDelete.forEach(variable => ongoingAnimations.delete(variable))

        if (animation.onUpdatedValue) {
            try {
                animation.onUpdatedValue(animation.current[0])
            } catch (err) {
                console.error('Animator: callback failed', err)
            }
        } else if (animation.onUpdatedValues) {
            try {
                animation.onUpdatedValues(animation.current)
            } catch (err) {
                console.error('Animator: callback failed', err)
            }
        }
    })

    const animationsToDelete: OngoingAnimation[] = []

    ongoingAnimationsWithoutIds.forEach(animation => {
        let allReachedTarget = true

        for (let i = 0; i < animation.target.length; i++) {
            let current = animation.current[i]
            const target = animation.target[i]

            if (Math.abs(target - current) >= CLOSE_ENOUGH) {
                current += (target - current) * (1 - Math.exp(- animation.speed * DT))
                animation.current[i] = current
                allReachedTarget = false
            } else {
                animation.current[i] = target
            }
        }

        if (allReachedTarget) {
            animationsToDelete.push(animation)

            if (ongoingAnimations.size === 0 && ongoingAnimationsWithoutIds.size === 0) {
                if (timer) {
                    clearInterval(timer)
                }

                state = 'STOPPED'
            }
        }

        animationsToDelete.forEach(animation => ongoingAnimationsWithoutIds.delete(animation))


        if (animation.onUpdatedValue) {
            animation.onUpdatedValue(animation.current[0])
        } else if (animation.onUpdatedValues) {
            animation.onUpdatedValues(animation.current)
        }
    })
}

/**
 * Starts an animation for multiple values without an ID.
 *
 * @param onUpdatedValues - Callback to update the values.
 * @param current - Array of current values.
 * @param target - Array of target values.
 * @param speed - Animation speed.
 */
function animateSeveralNoId(onUpdatedValues: OnUpdatedValues, current: number[], target: number[], speed = SPEED): void {
    ongoingAnimationsWithoutIds.add({
        current: current,
        target: target,
        onUpdatedValues,
        speed
    })

    if (state === 'STOPPED') {
        timer = setInterval(() => step(), TIMER_INTERVAL_MS)
        state = 'RUNNING'
    }
}

/**
 * Starts an animation for a single value without an ID.
 *
 * @param onUpdatedValue - Callback to update the value.
 * @param current - Current value.
 * @param target - Target value.
 * @param speed - Animation speed.
 */
function animateNoId(onUpdatedValue: OnUpdatedValue, current: number, target: number, speed = SPEED): void {
    ongoingAnimationsWithoutIds.add({
        current: [current],
        target: [target],
        onUpdatedValue,
        speed
    })

    if (state === 'STOPPED') {
        timer = setInterval(() => step(), TIMER_INTERVAL_MS)
        state = 'RUNNING'
    }
}

/**
 * Starts an animation for a single value with an ID.
 *
 * @param animationTarget - The animation target.
 * @param onUpdatedValue - Callback to update the value.
 * @param current - Current value.
 * @param target - Target value.
 * @param speed - Animation speed.
 */
function animate(animationTarget: AnimationTarget, onUpdatedValue: OnUpdatedValue, current: number, target: number, speed = SPEED): void {
    ongoingAnimations.set(animationTarget, {
        current: [current],
        target: [target],
        onUpdatedValue,
        speed
    })

    if (state === 'STOPPED') {
        timer = setInterval(() => step(), TIMER_INTERVAL_MS)
        state = 'RUNNING'
    }
}

/**
 * Starts an animation for multiple values with an ID.
 *
 * @param animationTarget - The animation target.
 * @param onUpdatedValues - Callback to update the values.
 * @param current - Array of current values.
 * @param targets - Array of target values.
 * @param speed - Animation speed.
 */
function animateSeveral(animationTarget: AnimationTarget, onUpdatedValues: OnUpdatedValues, current: number[], targets: number[], speed = SPEED): void {
    ongoingAnimations.set(animationTarget, {
        current,
        target: targets,
        onUpdatedValues,
        speed
    })

    if (state === 'STOPPED') {
        timer = setInterval(() => step(), TIMER_INTERVAL_MS)
        state = 'RUNNING'
    }
}

/**
 * Stops an ongoing animation by its ID.
 *
 * @param animationTarget - The animation target to stop.
 */
function stopAnimation(animationTarget: AnimationTarget): void {
    ongoingAnimations.delete(animationTarget)

    if (ongoingAnimations.size === 0 && ongoingAnimationsWithoutIds.size === 0) {
        if (timer) {
            clearInterval(timer)
        }

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