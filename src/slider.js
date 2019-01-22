import React, { Component } from 'react';
import { MenuSection } from './menu.js';

let immediateState = {
    dragging: false,
    clickOffset: 0
};

class Slider extends Component {

    constructor(props) {
        super(props);

        this.state = ({
            step: (typeof(this.props.step) !== "undefined") ? this.props.step : 1,
            value: this.props.initialValue,
            scaleLength: 0
        });
    }

    componentDidMount() {

        this.setState({
            scaleLength: this.scale.clientWidth
        });

        this.indicator.focus();
    }
    
    render() {
        let percentage = (this.state.value - this.props.min) / (this.props.max - this.props.min);

        return (
            <MenuSection className="Slider">
              <div className="SliderLessLabel Button"
                   onClick={(event) => {
                       console.info("Decreasing");

                       let newValue = 0;
                       
                       if (this.state.value - this.state.step < this.props.min) {
                           newValue = this.props.min;
                       } else {
                           newValue = this.state.value - this.state.step;
                       }

                       this.setState({value: newValue});
                       this.props.onValue(newValue);

                       event.stopPropagation();
                   }
               }
                   >{this.props.less}</div>
              <div className="SliderScale"
                   ref={(selfName) => {this.scale = selfName;}}
                onMouseDown={
                    (event) => {
                        
                        if (event.target === this.indicator) {

                            /* Convert to game coordinates */
                            let dim = event.currentTarget.getBoundingClientRect();
                            let relativeX = event.clientX - dim.left;

                            event.stopPropagation();

                            immediateState.dragging = true;
                            immediateState.clickOffset = relativeX - this.indicator.offsetLeft;
                        }
                    }
                }

                onMouseMove={(event) => {
                    if (immediateState.dragging) {

                        /* Convert to game coordinates */
                        let dim = event.currentTarget.getBoundingClientRect();
                        let relativeX = event.clientX - dim.left;
                        
                        relativeX -= immediateState.clickOffset;

                        let newPercentage = relativeX / this.scale.clientWidth;
                        let newValue = (this.props.max - this.props.min) * newPercentage + this.props.min;

                        if (newValue >= this.props.min && newValue <= this.props.max) {
                            this.setState({value: newValue});

                            this.props.onValue(newValue);
                        }

                        event.stopPropagation();
                    }
                }}
                  
                onMouseUp={
                    (event) => {

                        if (immediateState.dragging) {
                            immediateState.dragging = false;

                            event.stopPropagation();
                        }
                    }
                  }

                  onMouseOut={
                      (event) => {
                          if (immediateState.dragging) {
                              immediateState.dragging = false;

                              event.stopPropagation();
                          }
                      }
                  }
                  
                >
                <div className="SliderIndicator"
                     tabIndex="0"
                     ref={(selfName) => this.indicator = selfName}
                     style={
                         {left: "" + (percentage * 100) + "%"}
                     }
                  
                     />
              </div>
              <div className="SliderMoreLabel Button"
                   onClick={() => {
                       console.info("Decreasing");

                       let newValue = 0;

                       if (this.state.value + this.state.step > this.props.max) {
                           newValue = this.props.max;
                       } else {
                           newValue = this.state.value + this.state.step;
                       }

                       this.setState({value: newValue});
                       this.props.onValue(newValue);
                    }
                }
                >{this.props.more}</div>
            </MenuSection>
        );
    }
}

export default Slider;
