import { useEffect, useRef } from 'react'

// State
const imageCache = new WeakMap<HTMLImageElement, ImageBitmap>()

// Hooks
function useAnimatedSprite({
    loader,
    getFrame,
    animate,
    fps = 10,
    deps
}: {
    loader: () => Promise<{
        image: HTMLImageElement
    }>
    getFrame: (image: ImageBitmap, frameIndex: number) => void
    animate: boolean
    fps?: number
    deps?: React.DependencyList
}) {

    // References
    const frameRef = useRef(0)
    const bitmapRef = useRef<ImageBitmap | null>(null)
    const mountedRef = useRef(true)

    // Effects
    useEffect(() => {
        mountedRef.current = true
        let rafId: number
        let lastTime = 0

        const frameDuration = 1000 / fps

        const loop = (time: number) => {
            if (!mountedRef.current) return

            if (animate && time - lastTime >= frameDuration) {
                frameRef.current++
                lastTime = time
            }

            if (bitmapRef.current) {
                getFrame(bitmapRef.current, frameRef.current)
            }

            rafId = requestAnimationFrame(loop)
        }

        ;(async () => {
            const { image } = await loader()
            if (!mountedRef.current) return

            let bitmap = imageCache.get(image)
            if (!bitmap) {
                bitmap = await createImageBitmap(image)
                if (!mountedRef.current) return
                imageCache.set(image, bitmap)
            }

            bitmapRef.current = bitmap
            requestAnimationFrame(loop)

        })()

        return () => {
            mountedRef.current = false
            cancelAnimationFrame(rafId)
        }

    }, deps)
}

export { useAnimatedSprite }