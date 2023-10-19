import React, { Component } from 'react'
import { AnyBuilding } from './api/types'
import Button from './button'
import { Dialog } from './dialog'
import { HELP_PAGES, PageType } from './help_pages'
import { houseImageMap } from './images'
import './guide.css'

interface GuideProps {
    onClose: (() => void)
}
interface GuideState {
    page: number
}

function isBuildingString(imageString: AnyBuilding | string): imageString is AnyBuilding {
    return imageString.indexOf('.') > -1
}

class Guide extends Component<GuideProps, GuideState> {

    constructor(props: GuideProps) {
        super(props)

        this.state = { page: 0 }
    }

    render(): JSX.Element {
        console.log("Rendering guide")

        const page: PageType = HELP_PAGES[this.state.page]

        return (
            <Dialog className="Guide" onCloseDialog={this.props.onClose} floating>

                <Page page={page} />

                <div>
                    {this.state.page > 0 &&
                        <Button label="Previous" className="GuidePrevious"
                            onButtonClicked={
                                () => {
                                    this.setState({ page: this.state.page - 1 })
                                }
                            }
                        />
                    }

                    {this.state.page < HELP_PAGES.length - 1 &&
                        <Button label="Next" className="GuideNext"
                            onButtonClicked={
                                () => {
                                    this.setState({ page: this.state.page + 1 })
                                }
                            }
                        />
                    }
                </div>

            </Dialog>
        )
    }
}

interface PageProps {
    page: PageType
}

interface PageState { }

class Page extends Component<PageProps, PageState> {

    render(): JSX.Element {

        return (
            <div className="Page">

                <h1 className="PageTitle">{this.props.page.title}</h1>

                <div className="DialogSection PageIllustrations">

                    {this.props.page.pictures.map(
                        (image, index) => {
                            return (
                                <div key={index} className="ConstructionItem PageIllustration">

                                    {isBuildingString(image) ?
                                        <img src={houseImageMap.get(image)} className="SmallIcon" alt="" /> :
                                        <img src={image} className="SmallIcon" alt="" />
                                    }

                                </div>
                            )
                        }
                    )
                    }

                </div>

                <div className="PageDescription">
                    {this.props.page.description.map(
                        (text, index) => {
                            return (
                                <p key={index} className="PageParagraph">{text}</p>
                            )
                        }
                    )
                    }
                </div>
            </div>
        )
    }
}

export default Guide
