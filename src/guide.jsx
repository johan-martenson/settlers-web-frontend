import React, { Component } from 'react';
import { houseImageMap } from './components.jsx';
import Button from './button.js';
import { Dialog } from './dialog.js';
import HELP_PAGES from './help_pages.js';

class Guide extends Component {

    constructor(props) {
        super(props);

        this.state = {page: 0};
    }

    render() {
        console.log("Rendering guide");

        let page = HELP_PAGES[this.state.page];
        
        return (
              <Dialog className="Guide" onCloseDialog={this.props.onClose}>

                  <Page page={page}/>

                  <div>
                      {this.state.page > 0 &&
                          <Button label="Previous" className="GuidePrevious"
                              onButtonClicked={
                                  () => {
                                      this.setState({page: this.state.page - 1});
                                  }
                              }
                          />
                      }

                      {this.state.page < HELP_PAGES.length - 1 &&
                          <Button label="Next" className="GuideNext"
                              onButtonClicked={
                                  () => {
                                      this.setState({page: this.state.page + 1});
                                  }
                              }
                          />
                      }
                  </div>

            </Dialog>
        );
    }
}

class Page extends Component {

    render() {

        return (
            <div className="Page">

              <h1 className="PageTitle">{this.props.page.title}</h1>

              <div className="DialogSection PageIllustrations">

                {this.props.page.pictures.map(
                    (image, index) => {
                        return (
                            <div key={index} className="ConstructionItem PageIllustration">

                              {(image.indexOf('.') > -1) ?
                                  <img src={image} className="SmallIcon" alt=""/> :
                                      <img src={houseImageMap[image]} className="SmallIcon" alt=""/>
                                      }

                            </div>
                        );
                    }
                )
                }

              </div>

              <div className="PageDescription">
                {this.props.page.description.map(
                    (text, index) => {
                        return (
                            <p key={index} className="PageParagraph">{text}</p>
                        );
                    }
                )
                }
              </div>
            </div>
        );
    };
}

export default Guide;
