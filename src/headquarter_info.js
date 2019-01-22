import React, { Component } from 'react';
import { getHouseInformation } from './api.js';

class HeadquarterInfo extends Component {

    constructor(props) {
        super(props);

        let itemsPerPage = 10;

        if (this.props.itemsPerPage) {
            itemsPerPage = this.props.itemsPerPage;
        }

        this.state = {
            inventory: {},
            page: 0,
            itemsPerPage: itemsPerPage
        };
    }

    componentDidMount() {

        getHouseInformation(this.props.house.houseId, this.props.player, this.props.gameId).then(
            (data) => {
                console.info("Got house information " + JSON.stringify(data));

                this.props.onCanReachServer("get house information");

                this.setState({
                    inventory: data.inventory
                });
            }).catch(
                (a, b, c) => {
                    this.props.onCannotReachServer("get house information");
                }
            );
    };
    
    render() {

        return (
            <div>
              <div className="InventoryList">
                {Object.keys(this.state.inventory).map(
                    (key, index) => {

                        if (this.state.page * this.state.itemsPerPage <= index &&
                            index < (this.state.page + 1) * this.state.itemsPerPage) {
                            return (
                                <span className="InventoryLabelValuePair" key={index} >
                                  <div className="InventoryLabel">{key.replace(/_/g, ' ')}</div>
                                  <div className="InventoryValue">{this.state.inventory[key]}</div>
                                </span>
                            );
                        } else {
                            return null;
                        }
                    }
                )
                }
            </div>

            {this.state.page > 0 &&
                <div className="Previous Button" onClick={
                    () => {
                        if (this.state.page > 0) {
                            this.setState({
                                page: this.state.page - 1
                            });
                        }
                    }
                }
             >Prev</div>
            }

            {(this.state.page + 1) * this.state.itemsPerPage < Object.keys(this.state.inventory).length &&
                <div className="Next Button" onClick={() => {
                    if ((this.state.page + 1) * this.state.itemsPerPage <
                        Object.keys(this.state.inventory).length) {
                        this.setState({
                            page: this.state.page + 1
                        });
                    }
                }
            }
            >Next</div>}
            </div>
        );
    }
}

export default HeadquarterInfo;
