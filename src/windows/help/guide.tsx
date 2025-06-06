import React, { useState } from 'react'
import { HELP_PAGES, PageType } from './help_pages'
import './guide.css'
import { Button } from '@fluentui/react-components'
import { Window } from '../../components/dialog'

// Types
type GuideProps = {
    onRaise: () => void
    onClose: () => void
}


type PageProps = {
    page: PageType
}

// React components
const Guide = ({ onClose, onRaise }: GuideProps) => {
    const [pageNumber, setPageNumber] = useState<number>(0)

    const currentPage: PageType = HELP_PAGES[pageNumber]

    return (
        <Window className='guide' heading={currentPage.title} onClose={onClose} onRaise={onRaise}>
            <Page page={currentPage} />

            <div>
                {pageNumber > 0 &&
                    <Button onClick={() => { setPageNumber(pageNumber - 1) }} >
                        Previous
                    </Button>
                }

                {pageNumber < HELP_PAGES.length - 1 &&
                    <Button onClick={() => { setPageNumber(pageNumber + 1) }} >
                        Next
                    </Button>
                }
            </div>
        </Window>
    )
}

const Page = ({ page }: PageProps) => {
    return (
        <div className='page'>
            <div className='DialogSection PageIllustrations'>

                {page.pictures.map((image, index) => (
                    <div key={index} className='ConstructionItem PageIllustration'>
                        {image}
                    </div>
                ))}
            </div>

            <div className='PageDescription'>
                {page.description.map((text, index) => (
                    <p key={index} className='PageParagraph'>
                        {text}
                    </p>
                ))}
            </div>
        </div>
    )
}

export default Guide
