import React, { Component } from 'react';

class Player extends Component {

    constructor(props) {

        console.log("4 -- Player props.player: " + JSON.stringify(props.player));
        
        let isSelf = true;
        
        if (typeof(props.isSelf) === "undefined") {
            isSelf = false;
        }
        
        super(props);

        this.state = {
            type: props.player.type,
            name: props.player.name,
            isSelf: isSelf
        };
    }
    
    render() {

        console.log("5 -- Player render, state: " + JSON.stringify(this.state));

        return (
                <div>
                <div>Name: {this.state.name}</div>

                {this.state.type === "COMPUTER" &&
                    <input type="text" placeholder="Name" ref={(selfName) => {this.nameField = selfName;}} />
                }

                <div>Type: {this.state.type}</div>
            
            </div>
                
        );
    }
}

export default Player;
