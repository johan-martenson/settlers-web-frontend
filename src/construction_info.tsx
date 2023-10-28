import React, { Component } from 'react'
import { GameId, LARGE_HOUSES, MEDIUM_HOUSES, Nation, PlayerId, Point, PointInformation, SMALL_HOUSES } from './api/types'
import './construction_info.css'
import { Dialog, DialogSection } from './dialog'
import { monitor } from './api/ws-api'
import { camelCaseToWords } from './utils'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { HouseIcon } from './icon'

interface ConstructionInfoProps {
    selected?: "Buildings" | "FlagsAndRoads"
    point: PointInformation
    gameId: GameId
    playerId: PlayerId
    nation: Nation
    closeDialog: (() => void)
    startNewRoad: ((point: Point) => void)
}

interface ConstructionInfoState {
    selected: "Buildings" | "FlagsAndRoads"
    buildingSizeSelected: "small" | "medium" | "large"
}

class ConstructionInfo extends Component<ConstructionInfoProps, ConstructionInfoState> {

    constructor(props: ConstructionInfoProps) {
        super(props)

        /* Determine which panel to show - buildings or flags and roads */
        let selected: "Buildings" | "FlagsAndRoads"

        if (props.selected) {
            selected = props.selected
        } else if (this.canBuildHouse() || this.canBuildMine()) {
            selected = "Buildings"
        } else {
            selected = "FlagsAndRoads"
        }

        /* In the case of buildings, start by showing small buildings */
        this.state = {
            selected: selected,
            buildingSizeSelected: "small"
        }
    }

    canRemoveRoad(): boolean {
        if (this.props.point.is === "road") {
            return true
        }

        return false
    }

    canRaiseFlag(): boolean {
        if (this.props.point.canBuild.find(x => x === "flag")) {
            return true
        }

        return false
    }

    canBuildHouse(): boolean {
        if (this.canBuildSmallHouse() || this.canBuildMediumHouse() || this.canBuildLargeHouse()) {
            return true
        }

        return false
    }

    canBuildLargeHouse(): boolean {
        if (this.props.point.canBuild.find(x => x === "large")) {
            return true
        }

        return false
    }

    canBuildMediumHouse(): boolean {
        if (this.props.point.canBuild.find(x => x === "medium")) {
            return true
        }

        return false
    }

    canBuildSmallHouse(): boolean {
        if (this.props.point.canBuild.find(x => x === "small")) {
            return true
        }

        return false
    }

    canBuildMine(): boolean {
        if (this.props.point.canBuild.find(x => x === "mine")) {
            return true
        }

        return false
    }

    canBuildRoad(): boolean {
        return this.props.point.is === "flag"
    }

    // eslint-disable-next-line
    shouldComponentUpdate(nextProps: ConstructionInfoProps, nextState: ConstructionInfoState): boolean {
        return nextState.selected !== this.state.selected ||
            nextState.buildingSizeSelected !== this.state.buildingSizeSelected
    }

    render(): JSX.Element {

        const constructionOptions = new Map()
        const constructionInitialSelection = this.canBuildHouse() ? "Buildings" : "FlagsAndRoads"

        if (this.canBuildHouse()) {
            constructionOptions.set("Buildings", "Buildings")
        }

        if (this.canRaiseFlag() || this.canRemoveRoad()) {
            constructionOptions.set("FlagsAndRoads", "Flags and roads")
        }

        const houseOptions = new Map()

        if (this.canBuildSmallHouse()) {
            houseOptions.set("small", "Small")
        }

        if (this.canBuildMediumHouse()) {
            houseOptions.set("medium", "Medium")
        }

        if (this.canBuildLargeHouse()) {
            houseOptions.set("large", "Large")
        }

        return (
            <Dialog id="ConstructionInfo" className="ConstructionInfoWindow" heading="Construction" onCloseDialog={this.props.closeDialog} floating={true}>

                <>
                    <TabList
                        defaultSelectedValue={constructionInitialSelection}
                        onTabSelect={
                            (event: SelectTabEvent, data: SelectTabData) => {
                                const value = data.value

                                if (value === "Buildings" || value === "FlagsAndRoads") {
                                    this.setState({ selected: value })
                                }
                            }
                        }
                    >
                        {Array.from(constructionOptions.entries(), ([key, value], index) => {
                            return <Tab value={key} key={index}>{value}</Tab>
                        }
                        )}
                    </TabList>

                    {this.state.selected === "FlagsAndRoads" &&
                        <DialogSection>
                            <div className="DialogSection">

                                <Button
                                    icon="flag.png"
                                    onClick={
                                        () => {
                                            console.info("Raising flag")
                                            monitor.placeFlag(this.props.point)
                                        }
                                    }
                                >Raise flag</Button>
                                <Button className="ConstructionItem"
                                    icon="flag.png"
                                    onClick={
                                        () => {
                                            console.info("Raising flag")
                                            monitor.placeFlag(this.props.point)

                                            this.props.closeDialog()
                                        }
                                    }
                                >Raise flag</Button>

                                {this.canBuildRoad() &&
                                    <Button
                                        icon="road-1.png"
                                        onClick={
                                            () => {
                                                console.info("Starting to build road")

                                                this.props.startNewRoad(this.props.point)

                                                this.props.closeDialog()
                                            }
                                        }
                                    >Build road</Button>
                                }

                                {this.canRemoveRoad() &&
                                    <Button
                                        icon="scissor.png"
                                        onClick={
                                            async () => {
                                                console.info("Starting to dig up road")

                                                if (!this.props.point.roadId) {
                                                    return
                                                }

                                                monitor.removeRoad(this.props.point.roadId)

                                                this.props.closeDialog()
                                            }
                                        }
                                    >Dig up road</Button>
                                }
                            </div>
                        </DialogSection>
                    }

                    {this.state.selected === "Buildings" &&
                        <TabList
                        defaultSelectedValue={"small"}
                        onTabSelect={
                            (event: SelectTabEvent, data: SelectTabData) => {
                                const value = data.value
                                if (value === "small" || value === "medium" || value === "large") {
                                    this.setState(
                                        {
                                            buildingSizeSelected: value
                                        }
                                    )
                                }
                            }
                        }>
                            {Array.from(houseOptions.entries(),
                                ([key, value], index) => {
                                    return <Tab value={key} key={index}>{value}</Tab>
                                }

                            )}
                        </TabList>
                    }

                    {this.state.selected === "Buildings" && this.state.buildingSizeSelected === "small" &&
                        <DialogSection>
                            <div className="house-construction-buttons">
                                {SMALL_HOUSES.map(
                                    (house, index) => {

                                        return (
                                            <Button className="ConstructionItem"
                                                key={index}
                                                onClick={
                                                    async () => {
                                                        console.info("Creating house")
                                                        monitor.placeHouse(house, this.props.point)

                                                        this.props.closeDialog()
                                                    }
                                                }
                                            >
                                                <div className='house-construction-button'>
                                                    <HouseIcon nation={this.props.nation} houseType={house} />
                                                    {camelCaseToWords(house)}
                                                </div>
                                            </Button>
                                        )
                                    })
                                }
                            </div>
                        </DialogSection>
                    }

                    {this.state.selected === "Buildings" &&
                        this.canBuildMediumHouse() &&
                        this.state.buildingSizeSelected === "medium" &&
                        <DialogSection>
                            <div className="house-construction-buttons">
                                {MEDIUM_HOUSES.map(
                                    (house, index) => {

                                        return (
                                            <Button className="ConstructionItem"
                                                key={index}
                                                onClick={
                                                    async () => {
                                                        console.info("Creating house")
                                                        monitor.placeHouse(house, this.props.point)

                                                        this.props.closeDialog()
                                                    }
                                                }
                                            >
                                                <div className='house-construction-button'>
                                                    <HouseIcon nation={this.props.nation} houseType={house} />
                                                    {camelCaseToWords(house)}
                                                </div>
                                            </Button>
                                        )
                                    })
                                }
                            </div>
                        </DialogSection>
                    }

                    {this.state.selected === "Buildings" &&
                        this.canBuildLargeHouse() &&
                        this.state.buildingSizeSelected === "large" &&
                        <DialogSection>
                            <div className="house-construction-buttons">
                                {LARGE_HOUSES.map(
                                    (house, index) => {

                                        if (house === "Headquarter") {
                                            return <></>
                                        } else {

                                            return (
                                                <Button className="ConstructionItem"
                                                    key={index}
                                                    onClick={
                                                        async () => {
                                                            console.info("Creating house")
                                                            monitor.placeHouse(house, this.props.point)

                                                            this.props.closeDialog()
                                                        }
                                                    }
                                                >
                                                    <div className='house-construction-button'>
                                                        <HouseIcon nation={this.props.nation} houseType={house} />
                                                        {camelCaseToWords(house)}
                                                    </div>
                                                </Button>
                                            )
                                        }
                                    })
                                }
                            </div>
                        </DialogSection>
                    }
                </>
            </Dialog>
        )
    }
}

export { ConstructionInfo }

