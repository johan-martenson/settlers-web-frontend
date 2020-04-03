import React, { Component } from 'react';
import { disablePromotionsForHouse, enablePromotionsForHouse, HouseResources, getSoldierDisplayName, houseIsReady, isMilitaryBuilding, cancelEvacuationForHouse, isEvacuated, evacuateHouse, canBeEvacuated, GameId, HouseInformation, PlayerId, removeHouse, SoldierType, getHouseInformation, isMaterial } from './api';
import Button from './button';
import { Dialog, DialogSection } from './dialog';
import HeadquarterInfo from './headquarter_info';
import houseImageMap from './images';
import ProgressBar from './progress_bar'
import './friendly_house_info.css'

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

        this.periodicUpdates = setInterval(async () => {
            const house = await getHouseInformation(this.props.house.id, this.props.playerId, this.props.gameId);
            console.info("UPDATING HOUSE")
            this.setState({ updatedHouse: house })
        }, 1000)
    };

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
                    console.info("NOT MATERIAL " + material)
                    return
                }

                if (hasAndNeeds.needs || hasAndNeeds.needs === 0) {
                    needs[material] = hasAndNeeds.needs
                }

                if (hasAndNeeds.has || hasAndNeeds.has === 0) {
                    has[material] = hasAndNeeds.has
                }
            }
        )

        let hasAmountCoin: number = 0
        let needsAmountCoin: number = 0

        let coinResources = house.resources.coin

        if (coinResources) {

            if (coinResources.has !== undefined && coinResources.has !== null) {
                hasAmountCoin = coinResources.has
            }

            if (coinResources.needs !== undefined && coinResources.needs !== null) {
                needsAmountCoin = coinResources.needs
            }
        }

        return (
            <Dialog heading={this.props.house.type} floating onCloseDialog={this.props.closeDialog}>

                <img src={houseImageMap.get(this.props.house.type)} className="MediumIcon" alt="House" />

                {house.state === "UNFINISHED" && house.constructionProgress !== null && house.constructionProgress !== undefined &&
                    <>
                        <div>Under construction</div>
                        <ProgressBar progress={house.constructionProgress} />

                        <div>Needs: </div>
                        {Object.entries(needs).map(
                            ([material, needed], index) => {
                                return <div key={index}>{material}: {needed}</div>
                            }
                        )}

                    </>
                }

                {houseIsReady(house) && !isMilitaryBuilding(house) &&
                    <>
                        {Object.keys(needs).length > 0 &&
                            <>
                                <div>Needs: </div>
                                {Object.entries(needs).map(
                                    ([material, needed], index) => {
                                        return <div key={index}>{material}: {needed}</div>
                                    }
                                )}
                            </>
                        }

                        {Object.keys(has).length > 0 &&
                            <>
                                <div>Has: </div>
                                {Object.entries(has).map(
                                    ([material, hasNow], index) => {
                                        return <div key={index}>{material}: {hasNow}</div>
                                    }
                                )}
                            </>
                        }

                        {house.produces &&
                            <div>Produces: {house.produces}</div>
                        }

                        <Button label="Pause production" onButtonClicked={() => { }} />

                    </>
                }

                {(house.type === "Headquarter") &&
                    <DialogSection label="Inventory">
                        <HeadquarterInfo house={house} gameId={this.props.gameId} playerId={this.props.playerId} />
                    </DialogSection>
                }

                {isMilitaryBuilding(house) && houseIsReady(house) &&
                    <>

                        <div>Soldiers: {soldiers.map(
                            (soldier, index) => {
                                if (soldier) {
                                    return <div key={index}>{getSoldierDisplayName(soldier)}</div>
                                } else {
                                    return <div key={index}>Empty</div>
                                }
                            }
                        )}</div>

                        {(hasAmountCoin !== 0 || needsAmountCoin !== 0) &&
                            <div>Gold:
                                {Array.from({ length: hasAmountCoin }, () => 1).map(
                                (value, index) => <span className="coin" key={index} />)
                                }
                                {Array.from({ length: needsAmountCoin }, () => 2).map(
                                    (value, index) => <span className="coin-missing" key={index} />)
                                }
                            </div>
                        }

                        {house.promotionsEnabled &&
                            <Button label="Disable promotions"
                                onButtonClicked={
                                    async () => {
                                        const updatedHouseInformation = await disablePromotionsForHouse(this.props.gameId, this.props.playerId, house.id)

                                        this.setState({ updatedHouse: updatedHouseInformation })
                                    }
                                }
                            />
                        }

                        {!house.promotionsEnabled &&
                            <Button label="Enable promotions"
                                onButtonClicked={
                                    async () => {
                                        const updatedHouseInformation = await enablePromotionsForHouse(this.props.gameId, this.props.playerId, house.id)

                                        this.setState({ updatedHouse: updatedHouseInformation })
                                    }
                                }
                            />
                        }

                    </>
                }

                {canBeEvacuated(house) &&
                    <>
                        {isEvacuated(house) &&
                            <>
                                <div>Evacuated</div>

                                <Button label="Cancel evacuation"
                                    onButtonClicked={
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
                            </>
                        }

                        {!isEvacuated(house) &&

                            <>
                                <Button label="Evacuate"
                                    onButtonClicked={
                                        async () => {
                                            await evacuateHouse(this.props.gameId, this.props.playerId, house.id)

                                            const updatedHouseInformation = await getHouseInformation(house.id, this.props.gameId, this.props.playerId)
                                            console.info("EVACUATED")
                                            console.info(updatedHouseInformation)

                                            this.setState({ updatedHouse: updatedHouseInformation })
                                        }
                                    }
                                />
                            </>
                        }
                    </>
                }

                {(house.type !== "Headquarter") &&
                    <Button label="Destroy"
                        onButtonClicked={
                            async () => {
                                await removeHouse(house.id, this.props.playerId, this.props.gameId);

                                this.props.closeDialog();
                            }
                        }
                    />
                }

            </Dialog>
        );
    }
}

export default FriendlyHouseInfo;
