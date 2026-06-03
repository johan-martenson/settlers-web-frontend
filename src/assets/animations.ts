import { Nation, PlayerColor, FlagType, Direction, Material, WorkerAction, WorkerType, TreeType, FireSize, WildAnimalType, AnyBuilding, HouseInformation, FallingTreeInformation, WorkerInformation, FlagInformation, WildAnimalInformation } from '../api/types'
import { WorkerImageAtlasHandler, AnimalImageAtlasHandler, fireImageAtlasHandler, treeImageAtlasHandler, flagImageAtlasHandler } from './image_atlas_handlers'
import { Dimension, DrawingInformation } from './types'

// Animation handlers
class TreeAnimation {
    private speedAdjust: number

    constructor(speedAdjust: number) {
        this.speedAdjust = speedAdjust

        if (speedAdjust === 0) {
            throw new Error('Speed adjust cannot be 0')
        }
    }

    async load(): Promise<void> {
        await treeImageAtlasHandler.load()
    }

    getImage(): HTMLImageElement | undefined {
        return treeImageAtlasHandler.getSourceImage()
    }

    getAnimationFrame(treeType: TreeType, animationIndex: number, offset: number): DrawingInformation[] | undefined {
        return treeImageAtlasHandler.getDrawingInformationForGrownTree(treeType, Math.floor((animationIndex / this.speedAdjust) + offset))
    }

    getFallingTree(fallingTree: FallingTreeInformation): DrawingInformation[] | undefined {
        return treeImageAtlasHandler.getDrawingInformationForFallingTree(fallingTree.type, fallingTree.animation)
    }
}

class FireAnimation {
    private speedAdjust: number

    constructor(speedAdjust: number) {
        this.speedAdjust = speedAdjust

        if (speedAdjust === 0) {
            throw new Error('Speed adjust cannot be 0')
        }
    }

    async load(): Promise<void> {
        await fireImageAtlasHandler.load()
    }

    getImage(): HTMLImageElement | undefined {
        return fireImageAtlasHandler.getSourceImage()
    }

    getAnimationFrame(size: FireSize, animationIndex: number): DrawingInformation[] | undefined {
        return fireImageAtlasHandler.getFireDrawingInformation(size, Math.floor(animationIndex / this.speedAdjust))
    }

    getSmokeFrameForHouse(house: HouseInformation, animationIndex: number): DrawingInformation | undefined {
        return fireImageAtlasHandler.getSmokeDrawingInformation(house, Math.floor(animationIndex / this.speedAdjust))
    }
}

class AnimalAnimation {
    private imageAtlasHandler: AnimalImageAtlasHandler
    private speedAdjust: number

    constructor(prefix: string, name: string, speedAdjust: number) {
        this.imageAtlasHandler = new AnimalImageAtlasHandler(prefix, name)
        this.speedAdjust = speedAdjust

        if (speedAdjust === 0) {
            throw new Error('Speed adjust cannot be 0')
        }
    }

    async load(): Promise<void> {
        await this.imageAtlasHandler.load()
    }

    getImage(): HTMLImageElement | undefined {
        return this.imageAtlasHandler.getSourceImage()
    }

    getAnimationFrame(direction: Direction, animationIndex: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getDrawingInformationFor(direction, Math.floor((animationIndex / this.speedAdjust)))
    }

    getImageAtlasHandler(): AnimalImageAtlasHandler {
        return this.imageAtlasHandler
    }
}

type PartialFlag = {
    nation: Nation
    type: FlagType
    color: PlayerColor
}


class FlagAnimation {
    private speedAdjust: number

    constructor(speedAdjust: number) {
        this.speedAdjust = speedAdjust

        if (speedAdjust === 0) {
            throw new Error('Speed adjust cannot be 0')
        }
    }

    async load(): Promise<void> {
        await flagImageAtlasHandler.load()
    }

    getImage(): HTMLImageElement | undefined {
        return flagImageAtlasHandler.getSourceImage()
    }

    getAnimationFrame(flag: PartialFlag, animationIndex: number, offset: number): DrawingInformation[] | undefined {
        return flagImageAtlasHandler.getDrawingInformationFor(flag, Math.floor((animationIndex / this.speedAdjust) + offset))
    }

    getSizeWithShadow(flag: PartialFlag): Dimension | undefined {
        return flagImageAtlasHandler.getSizeWithShadow(flag)
    }

    getSize(flag: PartialFlag): Dimension | undefined {
        return flagImageAtlasHandler.getSize(flag)
    }
}

type PartialWorker = {
    nation: Nation
    direction: Direction
    color: PlayerColor
}


export class WorkerAnimation {
    private imageAtlasHandler: WorkerImageAtlasHandler
    private speedAdjust: number

    constructor(prefix: string, postfix: string, speedAdjust: number) {
        this.imageAtlasHandler = new WorkerImageAtlasHandler(prefix, postfix)

        this.speedAdjust = speedAdjust

        if (speedAdjust === 0) {
            throw new Error('Speed adjust cannot be 0')
        }
    }

    async load(): Promise<void> {
        await this.imageAtlasHandler.load()
    }

    getImage(): HTMLImageElement | undefined {
        return this.imageAtlasHandler.getSourceImage()
    }

    getAnimationFrame(worker: PartialWorker, animationIndex: number, percentageTraveled: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getDrawingInformationForWorker(worker.nation, worker.direction, worker.color, Math.floor(animationIndex / this.speedAdjust), percentageTraveled)
    }

    getActionAnimation(worker: WorkerInformation): DrawingInformation | undefined {
        if (worker.action === undefined || worker.actionAnimationIndex === undefined) {
            console.warn('Worker does not have action or action animation index', worker)

            return undefined
        }

        return this.imageAtlasHandler.getDrawingInformationForAction(
            {
                ...worker,
                action: worker.action,
                actionAnimationIndex: worker.actionAnimationIndex
            },
            Math.floor(worker.actionAnimationIndex / this.speedAdjust)
        )
    }

    getDrawingInformationForCargo(worker: WorkerInformation, animationIndex: number, offset: number): DrawingInformation | undefined {
        if (worker.cargo === undefined) {
            console.warn('Worker does not have cargo', worker)

            return undefined
        }

        return this.imageAtlasHandler.getDrawingInformationForCargo(worker.nation, worker.direction, worker.cargo, Math.floor(animationIndex / this.speedAdjust), Math.floor(offset))
    }

    getImageAtlasHandler(): WorkerImageAtlasHandler {
        return this.imageAtlasHandler
    }

    getSize(nation: Nation, direction: Direction, color: PlayerColor): Dimension | undefined {
        return this.imageAtlasHandler.getSize(nation, direction, color)
    }
}

// Animation instances
const FLAG_ANIMATIONS = new FlagAnimation(2)

const helperAnimation = new WorkerAnimation('assets/', 'helper', 10)

const WORKER_ANIMATIONS: Partial<Record<WorkerType, WorkerAnimation>> = {
    Armorer: new WorkerAnimation('assets/', 'armorer', 10),
    Baker: new WorkerAnimation('assets/', 'baker', 10),
    Brewer: new WorkerAnimation('assets/', 'brewer', 10),
    Butcher: new WorkerAnimation('assets/', 'butcher', 10),
    Builder: new WorkerAnimation('assets/', 'builder', 10),
    Carpenter: new WorkerAnimation('assets/', 'carpenter', 10),
    Courier: helperAnimation,
    DonkeyBreeder: new WorkerAnimation('assets/', 'donkey_breeder', 10),
    Farmer: new WorkerAnimation('assets/', 'farmer', 10),
    Fisherman: new WorkerAnimation('assets/', 'fisher', 10),
    Forester: new WorkerAnimation('assets/', 'forester', 10),
    General: new WorkerAnimation('assets/', 'general', 10),
    Geologist: new WorkerAnimation('assets/', 'geologist', 10),
    Hunter: new WorkerAnimation('assets/', 'hunter', 10),
    IronFounder: new WorkerAnimation('assets/', 'iron_founder', 10),
    Metalworker: new WorkerAnimation('assets/', 'metalworker', 10),
    Miller: new WorkerAnimation('assets/', 'miller', 10),
    Miner: new WorkerAnimation('assets/', 'miner', 10),
    Minter: new WorkerAnimation('assets/', 'minter', 10),
    Officer: new WorkerAnimation('assets/', 'officer', 10),
    PigBreeder: new WorkerAnimation('assets/', 'pig_breeder', 10),
    Planer: new WorkerAnimation('assets/', 'planer', 10),
    Private: new WorkerAnimation('assets/', 'private', 10),
    PrivateFirstClass: new WorkerAnimation('assets/', 'private_first_class', 10),
    Scout: new WorkerAnimation('assets/', 'scout', 10),
    Sergeant: new WorkerAnimation('assets/', 'sergeant', 10),
    Shipwright: new WorkerAnimation('assets/', 'ship_wright', 10),
    Stonemason: new WorkerAnimation('assets/', 'stonemason', 10),
    StorehouseWorker: new WorkerAnimation('assets/', 'helper', 10),
    WellWorker: helperAnimation,
    WoodcutterWorker: new WorkerAnimation('assets/', 'woodcutter', 10)
}

const thinCarrierWithCargo = new WorkerAnimation('assets/', 'thin-carrier-with-cargo', 10)
const fatCarrierWithCargo = new WorkerAnimation('assets/', 'fat-carrier-with-cargo', 10)
const thinCarrierNoCargo = new WorkerAnimation('assets/', 'thin-carrier-no-cargo', 10)
const fatCarrierNoCargo = new WorkerAnimation('assets/', 'fat-carrier-no-cargo', 10)

const TREE_ANIMATIONS = new TreeAnimation(2)

const ANIMAL_ANIMATIONS = new Map<WildAnimalType, AnimalAnimation>()

ANIMAL_ANIMATIONS.set('DEER', new AnimalAnimation('assets/nature/animals/', 'deer', 10))
ANIMAL_ANIMATIONS.set('DEER_2', new AnimalAnimation('assets/nature/animals/', 'deer2', 10))
ANIMAL_ANIMATIONS.set('DUCK', new AnimalAnimation('assets/nature/animals/', 'duck', 10))
ANIMAL_ANIMATIONS.set('DUCK_2', new AnimalAnimation('assets/nature/animals/', 'duck', 10))
ANIMAL_ANIMATIONS.set('FOX', new AnimalAnimation('assets/nature/animals/', 'fox', 10))
ANIMAL_ANIMATIONS.set('RABBIT', new AnimalAnimation('assets/nature/animals/', 'rabbit', 10))
ANIMAL_ANIMATIONS.set('SHEEP', new AnimalAnimation('assets/nature/animals/', 'sheep', 10))
ANIMAL_ANIMATIONS.set('STAG', new AnimalAnimation('assets/nature/animals/', 'stag', 10))

const donkeyAnimation = new AnimalAnimation('assets/nature/animals/', 'donkey', 10)

const fireAnimations = new FireAnimation(2)

export {
    FLAG_ANIMATIONS,
    WORKER_ANIMATIONS,
    thinCarrierWithCargo,
    fatCarrierWithCargo,
    thinCarrierNoCargo,
    fatCarrierNoCargo,
    TREE_ANIMATIONS,
    ANIMAL_ANIMATIONS,
    donkeyAnimation,
    fireAnimations
}
