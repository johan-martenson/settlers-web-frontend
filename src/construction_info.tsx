import React, { Component } from 'react';
import {
    Point,
    PlayerId,
    GameId,
    PointInformation,
    createBuilding,
    createFlag,
    SMALL_HOUSES,
    MEDIUM_HOUSES,
    LARGE_HOUSES
} from './api';
import { camelCaseToWords } from './utils';
import Button from './button';
import houseImageMap from './images';
import { Dialog, DialogSection } from './dialog';
import Row from './row'
import SelectableButtonRow from './selectable_button_row'

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
        super(props);

        /* Determine which panel to show - buildings or flags and roads */
        let selected: "Buildings" | "FlagsAndRoads";

        if (props.selected) {
            selected = props.selected;
        } else if (this.canBuildHouse() || this.canBuildMine()) {
            selected = "Buildings";
        } else {
            selected = "FlagsAndRoads";
        }

        /* In the case of buildings, start by showing small buildings */

        this.state = {
            selected: selected,
            buildingSizeSelected: "small"
        };
    }

    canRaiseFlag() {
        return this.props.point.canBuild.find((x) => x === "flag");
    }

    canBuildHouse() {
        return this.canBuildSmallHouse() || this.canBuildMediumHouse() || this.canBuildLargeHouse();
    }

    canBuildLargeHouse() {
        return this.props.point.canBuild.find((x) => x === "large");
    }

    canBuildMediumHouse() {
        return this.props.point.canBuild.find((x) => x === "medium");
    }

    canBuildSmallHouse() {
        return this.props.point.canBuild.find((x) => x === "small");
    }

    canBuildMine() {
        return this.props.point.canBuild.find((x) => x === "mine");
    }

    canBuildRoad() {
        return this.props.point.is === "flag";
    }

    shouldComponentUpdate(nextProps: ConstructionInfoProps, nextState: ConstructionInfoState) {
        return nextState.selected !== this.state.selected ||
            nextState.buildingSizeSelected !== this.state.buildingSizeSelected;
    }

    render() {

        let constructionOptions = new Map();
        let constructionInitialSelection = this.canBuildHouse() ? "Buildings" : "FlagsAndRoads";

        if (this.canBuildHouse()) {
            constructionOptions.set("Buildings", "Buildings");
        }

        if (this.canRaiseFlag()) {
            constructionOptions.set("FlagsAndRoads", "Flags and roads");
        }

        let houseOptions = new Map();
        let houseInitialSelection;

        if (this.canBuildSmallHouse()) {
            houseOptions.set("small", "Small");
            houseInitialSelection = "small";
        }

        if (this.canBuildMediumHouse()) {
            houseOptions.set("medium", "Medium");
        }

        if (this.canBuildLargeHouse()) {
            houseOptions.set("large", "Large");
        }

        return (
            <Dialog id="ConstructionInfo" heading="Construction" onCloseDialog={this.props.closeDialog}>

                <SelectableButtonRow values={constructionOptions}
                    initialValue={constructionInitialSelection}
                    onSelected={
                        (value) => {

                            if (value === "Buildings" || value === "FlagsAndRoads") {
                                this.setState(
                                    {
                                        selected: value
                                    }
                                );
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
                                    async () => {
                                        console.info("Raising flag");
                                        await createFlag(this.props.point,
                                            this.props.gameId,
                                            this.props.playerId);

                                        this.props.closeDialog();
                                    }
                                }
                            />

                            {this.canBuildRoad() &&
                                <Button className="ConstructionItem"
                                    label="Build road"
                                    image="road-1.png"
                                    imageLabel="Road"
                                    onButtonClicked={
                                        async () => {
                                            console.info("Starting to build road");

                                            await this.props.startNewRoad(this.props.point);

                                            this.props.closeDialog();
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
                                    );
                                }
                            }
                        }
                    />
                }

                {this.state.selected === "Buildings" && this.state.buildingSizeSelected === "small" &&
                    <DialogSection>
                        {SMALL_HOUSES.map((house, index) => {

                            return (
                                <Button className="ConstructionItem"
                                    key={index}
                                    label={camelCaseToWords(house)}
                                    image={houseImageMap.get(house)}
                                    imageLabel="House"
                                    onButtonClicked={
                                        async () => {
                                            console.info("Creating house");
                                            await createBuilding(house,
                                                this.props.point,
                                                this.props.gameId,
                                                this.props.playerId);

                                            this.props.closeDialog();
                                        }
                                    }
                                />
                            );
                        })
                        }
                    </DialogSection>
                }

                {this.state.selected === "Buildings" &&
                    this.canBuildMediumHouse() &&
                    this.state.buildingSizeSelected === "medium" &&
                    <DialogSection>
                        {MEDIUM_HOUSES.map((house, index) => {

                            return (
                                <Button className="ConstructionItem"
                                    label={camelCaseToWords(house)}
                                    image={houseImageMap.get(house)}
                                    imageLabel="House"
                                    key={index}
                                    onButtonClicked={
                                        async () => {
                                            console.info("Creating house");
                                            await createBuilding(house,
                                                this.props.point,
                                                this.props.gameId,
                                                this.props.playerId);

                                            this.props.closeDialog();
                                        }
                                    }
                                />
                            );
                        })
                        }
                    </DialogSection>
                }

                {this.state.selected === "Buildings" &&
                    this.canBuildLargeHouse() &&
                    this.state.buildingSizeSelected === "large" &&
                    <DialogSection>
                        {LARGE_HOUSES.map((house, index) => {

                            if (house === "Headquarter") {
                                return null;
                            } else {

                                return (
                                    <Button className="ConstructionItem"
                                        label={camelCaseToWords(house)}
                                        image={houseImageMap.get(house)}
                                        imageLabel={house}
                                        key={index}
                                        onButtonClicked={
                                            async () => {
                                                console.info("Creating house");
                                                await createBuilding(house,
                                                    this.props.point,
                                                    this.props.gameId,
                                                    this.props.playerId);

                                                this.props.closeDialog();
                                            }
                                        }
                                    />
                                );
                            }
                        })
                        }
                    </DialogSection>
                }

            </Dialog>
        );
    }
}

export { ConstructionInfo };
