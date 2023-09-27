import React, { Component } from 'react'
import { GameId, LARGE_HOUSES, MEDIUM_HOUSES, PlayerId, Point, PointInformation, SMALL_HOUSES } from './api'
import Button from './button'
import './construction_info.css'
import { Dialog, DialogSection } from './dialog'
import { houseImageMap } from './images'
import { monitor } from './monitor'
import SelectableButtonRow from './selectable_button_row'
import { camelCaseToWords } from './utils'

interface ConstructionInfoProps {
    selected?: "Buildings" | "FlagsAndRoads"
    point: PointInformation
    gameId: GameId
    playerId: PlayerId
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
        let houseInitialSelection

        if (this.canBuildSmallHouse()) {
            houseOptions.set("small", "Small")
            houseInitialSelection = "small"
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

                    <SelectableButtonRow values={constructionOptions}
                        initialValue={constructionInitialSelection}
                        onSelected={
                            (value) => {

                                if (value === "Buildings" || value === "FlagsAndRoads") {
                                    this.setState(
                                        {
                                            selected: value
                                        }
                                    )
                                }
                            }
                        }
                    />

                    {this.state.selected === "FlagsAndRoads" &&
                        <DialogSection>
                            <div className="DialogSection">

                                <Button className="ConstructionItem"
                                    label="Raise flag"
                                    image="flag.png"
                                    imageLabel="Flag"
                                    onButtonClicked={
                                        () => {
                                            console.info("Raising flag")
                                            monitor.placeFlag(this.props.point)
                                        }
                                    }
                                />
                                <Button className="ConstructionItem"
                                    label="Raise flag"
                                    image="flag.png"
                                    imageLabel="Flag"
                                    onButtonClicked={
                                        () => {
                                            console.info("Raising flag")
                                            monitor.placeFlag(this.props.point)

                                            this.props.closeDialog()
                                        }
                                    }
                                />

                                {this.canBuildRoad() &&
                                    <Button className="ConstructionItem"
                                        label="Build road"
                                        image="road-1.png"
                                        imageLabel="Road"
                                        onButtonClicked={
                                            () => {
                                                console.info("Starting to build road")

                                                this.props.startNewRoad(this.props.point)

                                                this.props.closeDialog()
                                            }
                                        }
                                    />
                                }

                                {this.canRemoveRoad() &&
                                    <Button className="ConstructionItem"
                                        label="Dig up road"
                                        image="scissor.png"
                                        imageLabel="Scissor"
                                        onButtonClicked={
                                            async () => {
                                                console.info("Starting to dig up road")

                                                if (!this.props.point.roadId) {
                                                    return
                                                }

                                                monitor.removeRoad(this.props.point.roadId)

                                                this.props.closeDialog()
                                            }
                                        }
                                    />
                                }
                            </div>
                        </DialogSection>
                    }

                    {this.state.selected === "Buildings" &&
                        <SelectableButtonRow values={houseOptions}
                            initialValue={houseInitialSelection}
                            onSelected={
                                (value) => {

                                    if (value === "small" || value === "medium" || value === "large") {
                                        this.setState(
                                            {
                                                buildingSizeSelected: value
                                            }
                                        )
                                    }
                                }
                            }
                        />
                    }

                    {this.state.selected === "Buildings" && this.state.buildingSizeSelected === "small" &&
                        <DialogSection>
                            {SMALL_HOUSES.map(
                                (house, index) => {

                                    return (
                                        <Button className="ConstructionItem"
                                            key={index}
                                            label={camelCaseToWords(house)}
                                            image={houseImageMap.get(house)}
                                            imageLabel="House"
                                            onButtonClicked={
                                                async () => {
                                                    console.info("Creating house")
                                                    monitor.placeHouse(house, this.props.point)

                                                    this.props.closeDialog()
                                                }
                                            }
                                        />
                                    )
                                })
                            }
                        </DialogSection>
                    }

                    {this.state.selected === "Buildings" &&
                        this.canBuildMediumHouse() &&
                        this.state.buildingSizeSelected === "medium" &&
                        <DialogSection>
                            {MEDIUM_HOUSES.map(
                                (house, index) => {

                                    return (
                                        <Button className="ConstructionItem"
                                            label={camelCaseToWords(house)}
                                            image={houseImageMap.get(house)}
                                            imageLabel="House"
                                            key={index}
                                            onButtonClicked={
                                                async () => {
                                                    console.info("Creating house")
                                                    monitor.placeHouse(house, this.props.point)

                                                    this.props.closeDialog()
                                                }
                                            }
                                        />
                                    )
                                })
                            }
                        </DialogSection>
                    }

                    {this.state.selected === "Buildings" &&
                        this.canBuildLargeHouse() &&
                        this.state.buildingSizeSelected === "large" &&
                        <DialogSection>
                            {LARGE_HOUSES.map(
                                (house, index) => {

                                    if (house === "Headquarter") {
                                        return <></>
                                    } else {

                                        return (
                                            <Button className="ConstructionItem"
                                                label={camelCaseToWords(house)}
                                                image={houseImageMap.get(house)}
                                                imageLabel={house}
                                                key={index}
                                                onButtonClicked={
                                                    async () => {
                                                        console.info("Creating house")
                                                        monitor.placeHouse(house, this.props.point)

                                                        this.props.closeDialog()
                                                    }
                                                }
                                            />
                                        )
                                    }
                                })
                            }
                        </DialogSection>
                    }
                </>
            </Dialog>
        )
    }
}

export { ConstructionInfo }

