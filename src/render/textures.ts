import { makeTextureFromImage } from "./utils"

type Texture = {
    texture: WebGLTexture
}

const textures: Map<WebGL2RenderingContext, Map<HTMLImageElement, Texture>> = new Map()

function registerTexture(gl: WebGL2RenderingContext, image: HTMLImageElement | undefined): void {
    if (image === undefined) {
        console.error('Image is undefined')

        return
    }

    if (!textures.has(gl)) {
        textures.set(gl, new Map())
    }

    const imageMap = textures.get(gl)

    if (!imageMap?.has(image)) {
        const texture = makeTextureFromImage(gl, image)

        if (texture !== null) {
            textures.get(gl)?.set(image, { texture })
        } else {
            console.error(`Failed to register texture`)
        }
    } else {
        console.error(`Already registered texture ${image.src} for ${gl}`)
    }
}

function activateTextureForRendering(gl: WebGL2RenderingContext, image: HTMLImageElement): number | undefined {
    const texture = textures.get(gl)?.get(image)?.texture

    if (texture !== undefined) {
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)

        return 0
    }

    console.error(`Failed to activate texture ${image.src}`)

    return undefined
}

const textureManager = {
    registerTexture,
    activateTextureForRendering
}

export { textureManager as textures }