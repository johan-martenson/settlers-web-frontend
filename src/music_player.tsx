import React, { useEffect, useState } from 'react'
import { Button } from '@fluentui/react-components'
import ExpandCollapseToggle from './expand_collapse_toggle'
import './music_player.css'
import { FastForward24Filled, Pause24Filled, Play24Filled } from '@fluentui/react-icons'

interface MusicPlayerProps { }

interface AudioAtlasSongs {
    path: string
    title: string
}

interface SongAndTitle {
    title: string
    song: HTMLAudioElement
}

const MusicPlayer = ({ }: MusicPlayerProps) => {

    const [expanded, setExpanded] = useState<boolean>(false)
    const [playing, setPlaying] = useState<boolean>(false)
    const [songs, setSongs] = useState<SongAndTitle[]>([])
    const [currentSong, setCurrentSong] = useState<number>(0)

    useEffect(() => {
        (async () => {
            const result = await fetch('assets/audio-atlas-music.json')

            const audioAtlasSongs: AudioAtlasSongs[] = await result.json()

            const newSongs = audioAtlasSongs?.map(newSong => { return { title: newSong.title, song: new Audio(newSong.path) } })

            setSongs(newSongs)
        })().then()

        return () => { }
    }, [])

    function pause() {
        if (songs) {
            songs[currentSong].song.pause()

            setPlaying(false)
        }
    }

    function resume() {
        if (songs) {
            songs[currentSong].song.onended = () => { next() }
            songs[currentSong].song.play()

            setPlaying(true)
        }
    }

    function next() {
        if (playing) {
            songs[currentSong].song.pause()
        }

        const newSong = (currentSong < songs.length - 1) ? currentSong + 1 : 0

        if (playing) {
            songs[newSong].song.currentTime = 0
            songs[newSong].song.onended = () => { next() }
            songs[newSong].song.play()
        }

        setCurrentSong(newSong)
    }

    function play(index: number): void {
        if (playing) {
            songs[currentSong].song.pause()
        }

        songs[index].song.currentTime = 0
        songs[index].song.onended = () => { next() }
        songs[index].song.play()

        setPlaying(true)
        setCurrentSong(index)
    }

    return (
        <div className="music-player">

            <ExpandCollapseToggle onExpand={() => setExpanded(true)} onCollapse={() => setExpanded(false)} inverted />
            <div> <b>Music</b></div>

            {playing && songs && expanded &&
                <div> Playing: {songs[currentSong].title} </div>
            }

            {expanded &&
                <>
                    <div>
                        {playing &&
                            <span><Button onClick={() => pause()} icon={<Pause24Filled />} appearance='transparent' /></span>
                        }

                        {!playing &&
                            <span><Button onClick={() => resume()} icon={<Play24Filled />} appearance='transparent' /></span>
                        }

                        <span><Button onClick={() => next()} icon={<FastForward24Filled />} appearance='transparent' /></span>
                    </div>

                    <div id="SongList">

                        {songs &&
                            songs.map(
                                (song, index) => {
                                    return (
                                        <div className={(index === currentSong) ? "PlayingSongItem" : "SongItem"}
                                            key={index}
                                            onClick={() => { play(index) }}
                                        >
                                            {song.title}
                                        </div>
                                    )
                                }
                            )
                        }
                    </div>
                </>
            }
        </div>
    )
}

export default MusicPlayer