import React, { Component } from 'react'
import { canBeEvacuated, canBeUpgraded, cancelEvacuationForHouse, disablePromotionsForHouse, enablePromotionsForHouse, evacuateHouse, GameId, getHouseInformation, getSoldierDisplayName, HouseInformation, houseIsReady, HouseResources, isEvacuated, isMaterial, isMilitaryBuilding, PlayerId, removeHouse, SoldierType, upgradeMilitaryBuilding } from './api'
import Button from './button'
import { Dialog, DialogSection } from './dialog'
import './friendly_house_info.css'
import HeadquarterInfo from './headquarter_info'
import houseImageMap from './images'
import { forceUpdateOfHouse, listenToHouse } from './monitor'
import ProgressBar from './progress_bar'

interface FriendlyHouseInfoProps {
    house: HouseInformation
    gameId: GameId
    playerId: PlayerId
    closeDialog: (() => void)
}

interface FriendlyHouseInfoState {
    updatedHouse?: HouseInformation
}

class FriendlyHouseInfo extends Component<FriendlyHouseInfoProps, FriendlyHouseInfoState> {

    private periodicUpdates: NodeJS.Timeout | null = null

    constructor(props: FriendlyHouseInfoProps) {
        super(props)

        this.state = {}
    }

    async componentDidMount() {

        listenToHouse(this.props.house.id, this.onHouseUpdated.bind(this))

        await forceUpdateOfHouse(this.props.house.id)

        this.periodicUpdates = setInterval(async () => {
            await forceUpdateOfHouse(this.props.house.id)
        }, 1000)
    }

    onHouseUpdated(house: HouseInformation): void {
        this.setState({ updatedHouse: house })
    }

    componentWillUnmount() {

        if (this.periodicUpdates) {
            clearInterval(this.periodicUpdates)
        }
    }

    render() {

        let soldiers: (SoldierType | null)[] = []

        if (this.props.house.soldiers && this.props.house.maxSoldiers) {
            soldiers.push(...this.props.house.soldiers)

            for (let i = 0; i < this.props.house.maxSoldiers - this.props.house.soldiers.length; i++) {
                soldiers.push(null)
            }
        }

        const house = this.state.updatedHouse ? this.state.updatedHouse : this.props.house

        let needs: HouseResources = {}
        let has: HouseResources = {}

        Object.entries(house.resources).forEach(
            ([material, hasAndNeeds]) => {

                if (!isMaterial(material)) {
                    throw new Error("Not a material: " + material)
                }

                if (hasAndNeeds.needs || hasAndNeeds.needs === 0) {
                    needs[material] = hasAndNeeds.needs
                }

                has[material] = hasAndNeeds.has
            }
        )

        let hasAmountCoin: number = 0
        let needsAmountCoin: number = 0

        let coinResources = house.resources.coin

        if (coinResources) {
            hasAmountCoin = coinResources.has

            if (coinResources.totalNeeded) {
                needsAmountCoin = coinResources.totalNeeded
            }
        }

        return (
            <Dialog heading={this.props.house.type} floating onCloseDialog={this.props.closeDialog}>

                <img src={houseImageMap.get(this.props.house.type)} className="MediumIcon" alt="House" />

                {(house.type === "Headquarter") &&
                    <DialogSection label="Inventory">
                        <HeadquarterInfo house={house} gameId={this.props.gameId} playerId={this.props.playerId} itemsPerPage={20} />
                    </DialogSection>
                }

                <div className="HouseInformation">

                    {house.state === "UNFINISHED" && house.constructionProgress !== null && house.constructionProgress !== undefined &&
                        <>
                            <div>Under construction</div>
                            <ProgressBar progress={house.constructionProgress} />

                            <div>Resources</div>
                            {Object.entries(house.resources).map(
                                ([material, hasAndNeeds], index) => {
                                    const hasAmount = hasAndNeeds.has
                                    const needsAmount = hasAndNeeds.totalNeeded

                                    return <div key={index} className="ResourceNeedItem">
                                        {material}s: {hasAmount} / {needsAmount}
                                    </div>
                                }
                            )}

                        </>
                    }

                    {houseIsReady(house) && !isMilitaryBuilding(house) && house.state === "UNOCCUPIED" && <div>Unoccupied</div>}

                    {houseIsReady(house) && !isMilitaryBuilding(house) && house.productivity !== undefined && house.productivity !== null &&
                        <div>Productivity: {house.productivity}</div>
                    }

                    {houseIsReady(house) && !isMilitaryBuilding(house) && Object.keys(needs).length > 0 &&
                        <>
                            <div>Needs: </div>
                            {Object.entries(needs).map(
                                ([material, needed], index) => {
                                    return <div key={index}>{material}: {needed}</div>
                                }
                            )}
                        </>
                    }

                    {houseIsReady(house) && !isMilitaryBuilding(house) && Object.keys(has).length > 0 &&
                        <>
                            <div>Has: </div>
                            {Object.entries(has).map(
                                ([material, hasNow], index) => {
                                    return <div key={index}>{material}: {hasNow}</div>
                                }
                            )}
                        </>
                    }

                    {house.produces && <div>Produces: {house.produces}</div>}

                    {isMilitaryBuilding(house) && houseIsReady(house) &&
                        <div>Soldiers: {soldiers.map(
                            (soldier, index) => {
                                if (soldier) {
                                    return <div key={index}>{getSoldierDisplayName(soldier)}</div>
                                } else {
                                    return <div key={index}>Empty</div>
                                }
                            }
                        )}
                        </div>
                    }

                    {isMilitaryBuilding(house) && houseIsReady(house) && needsAmountCoin !== 0 &&
                        <div>Gold:
                                {Array.from({ length: hasAmountCoin || 0 }, () => 1).map(
                            (value, index) => <span className="coin" key={index} />)
                            }
                            {Array.from({ length: needsAmountCoin }, () => 2).map(
                                (value, index) => <span className="coin-missing" key={index} />)
                            }
                        </div>
                    }

                    {canBeEvacuated(house) && isEvacuated(house) && <div>Evacuated</div>}

                </div>

                <div className="HouseActions">

                    {houseIsReady(house) && !isMilitaryBuilding(house) && house.produces &&
                        <Button label="Pause production" onButtonClicked={() => { }} />
                    }

                    {houseIsReady(house) && !isMilitaryBuilding(house) && !house.produces &&
                        <Button label="Resume production" onButtonClicked={() => { }} />
                    }

                    {isMilitaryBuilding(house) && houseIsReady(house) && house.promotionsEnabled &&
                        <Button label="Disable promotions"
                            onButtonClicked={
                                async () => {
                                    const updatedHouseInformation = await disablePromotionsForHouse(this.props.gameId, this.props.playerId, house.id)

                                    this.setState({ updatedHouse: updatedHouseInformation })
                                }
                            }
                        />
                    }

                    {isMilitaryBuilding(house) && houseIsReady(house) && !house.promotionsEnabled &&
                        <Button label="Enable promotions"
                            onButtonClicked={
                                async () => {
                                    const updatedHouseInformation = await enablePromotionsForHouse(this.props.gameId, this.props.playerId, house.id)

                                    this.setState({ updatedHouse: updatedHouseInformation })
                                }
                            }
                        />
                    }

                    {canBeEvacuated(house) && isEvacuated(house) &&
                        <Button label="Cancel evacuation" onButtonClicked={
                            async () => {
                                console.info("Canceling evacuation")
                                await cancelEvacuationForHouse(this.props.gameId, this.props.playerId, house.id)
                                console.info("Canceled evacuation")
                                const updatedHouseInformation = await getHouseInformation(house.id, this.props.gameId, this.props.playerId)
                                console.info("Disabled EVACUATED")
                                console.info(updatedHouseInformation)
                                this.setState({ updatedHouse: updatedHouseInformation })
                            }
                        }
                        />
                    }

                    {canBeEvacuated(house) && !isEvacuated(house) &&
                        <Button label="Evacuate" onButtonClicked={
                            async () => {
                                await evacuateHouse(this.props.gameId, this.props.playerId, house.id)

                                const updatedHouseInformation = await getHouseInformation(house.id, this.props.gameId, this.props.playerId)
                                console.info("EVACUATED")
                                console.info(updatedHouseInformation)

                                this.setState({ updatedHouse: updatedHouseInformation })
                            }
                        }
                        />
                    }

                    {canBeUpgraded(house) &&
                        <Button onButtonClicked={() => upgradeMilitaryBuilding(this.props.gameId, this.props.playerId, house.id)} label="Upgrade" />
                    }

                    {(house.type !== "Headquarter") &&
                        <Button label="Destroy" onButtonClicked={
                            async () => {
                                await removeHouse(house.id, this.props.playerId, this.props.gameId)

                                this.props.closeDialog()
                            }
                        }
                        />
                    }

                </div>

            </Dialog >
        )
    }
}

export default FriendlyHouseInfo
