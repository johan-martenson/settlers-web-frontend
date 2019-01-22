import React, { Component } from 'react';
import { createBuilding, createFlag, SMALL_HOUSES, MEDIUM_HOUSES, LARGE_HOUSES } from './api.js';
import { camelCaseToWords } from './utils.js';
import Button from './button.js';
import houseImageMap from './images.js';
import { Dialog, DialogSection } from './dialog.js';

class ConstructionInfo extends Component {

    constructor(props) {
        super(props);

        /* Determine which panel to show - buildings or flags and roads */
        let selected;

        if (typeof(props.selected) !== "undefined") {
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
        return this.props.point.isType === "flag";
    }
    
    shouldComponentUpdate(nextProps, nextState) {
        return nextState.selected !== this.state.selected ||
            nextState.buildingSizeSelected !== this.state.buildingSizeSelected;
    }

    render () {

        return (
            <Dialog id="ConstructionInfo" heading="Construction">

              <div className="PanelChoices">
                {this.canBuildHouse() &&
                    <Button label="Buildings" selected={this.state.selected === "Buildings"}
                                className="PanelChoice"
                                onButtonClicked={() => this.setState({selected: "Buildings"})}/>
                }
                {this.canRaiseFlag() &&
                    <Button label="Flags and roads" selected={this.state.selected === "FlagsAndRoads"}
                                className="PanelChoice"
                                onButtonClicked={() => this.setState({selected: "FlagsAndRoads"})}
                          />
                }
              </div>

              {this.state.selected === "FlagsAndRoads" &&
                  <DialogSection>
                            <div className="DialogSection">

                                  <Button className="ConstructionItem"
                                              label="Raise flag"
                                              image="flag.png"
                                              imageLabel="Flag"
                                              onButtonClicked={
                                                  () => {
                                                      console.info("Raising flag");
                                                      createFlag(this.props.point,
                                                                 this.props.gameId,
                                                                 this.props.player).then(
                                                                     () => this.props.onCanReachServer
                                                                 ).catch(
                                                                     () => this.props.onCannotReachServer
                                                                 );

                                                      this.props.closeDialog();
                                                  }
                                              }
                                        />

                                  {this.canBuildRoad() &&
                                        <button className="ConstructionItem"
                                                    label="Build road"
                                                    image="road-1.png"
                                                    imageLabel="Road"
                                                    onButtonClicked={
                                                        () =>{
                                                            console.info("Starting to build road");

                                                            this.props.startNewRoad(this.props.point);
                                                        }
                                                    }
                                              />
                                  }
                                </div>
                      </DialogSection>
                  }
              
                  {this.state.selected === "Buildings" &&
                      <div className="PanelChoices">
                            <Button label="Small" selected={this.state.buildingSizeSelected === "small"}
                                        className="Choice"
                                        onButtonClicked={() => this.setState({buildingSizeSelected: "small"})}
                                  />
                            <Button label="Medium" selected={this.state.buildingSizeSelected === "medium"}
                                        className="Choice"
                                        onButtonClicked={() => this.setState({buildingSizeSelected: "medium"})}
                                  />
                            <Button label="Large" selected={this.state.buildingSizeSelected === "large"}
                                        className="Choice"
                                        onButtonClicked={() => this.setState({buildingSizeSelected: "large"})}
                                  />

                          </div>
                      }

                      {this.state.selected === "Buildings" && this.state.buildingSizeSelected === "small" &&
                          <DialogSection>
                                    {SMALL_HOUSES.map((house, index) => {

                                        return (
                                            <Button className="ConstructionItem"
                                                    key={index}
                                                    label={camelCaseToWords(house)}
                                                    image={houseImageMap[house]}
                                                    imageLabel="House"
                                                    onButtonClicked={
                                                        () => {
                                                            console.info("Creating house");
                                                            createBuilding(house,
                                                                           this.props.point,
                                                                           this.props.gameId,
                                                                           this.props.player).then(
                                                                               this.props.onCanReachServer("create building")
                                                                           ).catch(
                                                                               this.props.onCannotReachServer("create building")
                                                                           );

                                                            this.props.closeDialog();
                                                        }
                                                    }
                                              />
                                        );
                                    })
                                    }
                       </DialogSection>
                      }

            {this.state.selected === "Buildings"          &&
             this.canBuildMediumHouse()                   &&
             this.state.buildingSizeSelected === "medium" &&
             <DialogSection>
             {MEDIUM_HOUSES.map((house, index) => {

                 return (
                     <Button className="ConstructionItem"
                             label={camelCaseToWords(house)}
                             image={houseImageMap[house]}
                             imageLabel="House"
                             key={index}
                             onButtonClicked={
                                 () => {
                                     console.info("Creating house");
                                     createBuilding(house,
                                                    this.props.point,
                                                    this.props.gameId,
                                                    this.props.player).then(
                                                        () => this.props.onCanReachServer("create building")
                                                    ).catch(
                                                        () => this.props.onCannotReachServer("create building")
                                                    );

                                     this.props.closeDialog();
                                 }
                       }
                       />
                 );
             })
             }
             </DialogSection>
            }

            {this.state.selected === "Buildings"         &&
             this.canBuildMediumHouse()                  &&
             this.state.buildingSizeSelected === "large" &&
             <DialogSection>
             {LARGE_HOUSES.map((house, index) => {

                 if (house === "Headquarter") {
                     return null;
                 } else {

                     return (
                         <Button className="ConstructionItem"
                                 label={camelCaseToWords(house)}
                                 image={houseImageMap[house]}
                                 imageLabel="House"
                                 key={index}
                                 onButtonClicked={
                                     () => {
                                         console.info("Creating house");
                                         createBuilding(house,
                                                        this.props.point,
                                                        this.props.gameId,
                                                        this.props.player).then(
                                                            () => this.props.onCanReachServer("create building")
                                                        ).catch(
                                                            () => this.props.onCannotReachServer("create building")
                                                        );
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
