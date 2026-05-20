import React, { useCallback, useMemo, useState } from 'react'
import { HELP_PAGES, PageType } from './help_pages'
import './guide.css'
import { Button } from '@fluentui/react-components'
import { WindowWithTyping } from '../../components/dialog'
import { GenericCommand } from '../../utils/typing_command_utils'

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

    // State
    const [pageNumber, setPageNumber] = useState<number>(0)

    // Functions
    const nextPage = useCallback(() => {
        setPageNumber(prev => prev + 1)
    }, [])

    const prevPage = useCallback(() => {
        setPageNumber(prev => prev - 1)
    }, [])

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<string>>()

        cmds.set('Next page', {
            action: () => nextPage()
        })

        cmds.set('Previous page', {
            action: () => prevPage()
        })

        cmds.set('Close window', {
            action: () => onClose()
        })

        return cmds
    }, [onClose])

    // Rendering
    const currentPage: PageType = HELP_PAGES[pageNumber]

    return (
        <WindowWithTyping<'guide'>
            commands={commands}
            className='guide'
            heading={currentPage.title}
            onClose={onClose}
            onRaise={onRaise}
        >
            <Page page={currentPage} />

            <div>
                {pageNumber > 0 &&
                    <Button onClick={prevPage} >
                        Previous
                    </Button>
                }

                {pageNumber < HELP_PAGES.length - 1 &&
                    <Button onClick={nextPage} >
                        Next
                    </Button>
                }
            </div>
        </WindowWithTyping>
    )
}

const Page = ({ page }: PageProps) => {

    // Rendering
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
