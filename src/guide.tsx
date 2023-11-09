import React, { useState } from 'react'
import { HELP_PAGES, PageType } from './help_pages'
import './guide.css'
import { Button } from '@fluentui/react-components'

interface GuideProps {
    onClose: (() => void)
}

const Guide = ({ onClose }: GuideProps) => {

    const [pageNumber, setPageNumber] = useState<number>(0)

    const currentPage: PageType = HELP_PAGES[pageNumber]

    return (
        <div className="guide">

            <Page page={currentPage} />

            <div>
                {pageNumber > 0 &&
                    <Button onClick={() => { setPageNumber(pageNumber - 1) }} >Previous</Button>
                }

                {pageNumber < HELP_PAGES.length - 1 &&
                    <Button onClick={() => { setPageNumber(pageNumber + 1) }} >Next</Button>
                }
            </div>

            <Button onClick={() => onClose()}>Close</Button>
        </div>
    )
}

interface PageProps {
    page: PageType
}

const Page = ({ page }: PageProps) => {

    return (
        <div className="page">

            <h1 className="page-title">{page.title}</h1>

            <div className="DialogSection PageIllustrations">

                {page.pictures.map(
                    (image, index) => {
                        return (
                            <div key={index} className="ConstructionItem PageIllustration">

                                {image}

                            </div>
                        )
                    }
                )}

            </div>

            <div className="PageDescription">
                {page.description.map((text, index) => <p key={index} className="PageParagraph">{text}</p>)}
            </div>
        </div>
    )
}

export default Guide
