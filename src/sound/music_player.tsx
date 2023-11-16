import React, { useEffect, useState } from 'react'
import { Button } from '@fluentui/react-components'
import ExpandCollapseToggle from '../expand_collapse_toggle'
import './music_player.css'
import { FastForward24Filled, Pause24Filled, Play24Filled } from '@fluentui/react-icons'

interface AudioAtlasSongs {
    path: string
    title: string
}

interface SongAndTitle {
    title: string
    song: HTMLAudioElement
}

interface MusicPlayerProps {
    volume: number
}

const MusicPlayer = ({ volume }: MusicPlayerProps) => {

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

    useEffect(() => {
        if (songs !== undefined && currentSong !== undefined && songs[currentSong] !== undefined) {
            songs[currentSong].song.volume = volume
        }

        return () => { }
    }, [songs, currentSong, volume])

    function pause() {
        if (songs) {
            songs[currentSong].song.pause()

            setPlaying(false)
        }
    }

    function resume() {
        if (songs) {
            songs[currentSong].song.volume = volume
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
            songs[currentSong].song.volume = volume
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

        console.log(songs[index].song.volume)

        songs[index].song.volume = volume
        songs[index].song.currentTime = 0
        songs[index].song.onended = () => { next() }
        songs[index].song.play()

        setPlaying(true)
        setCurrentSong(index)
    }

    return (
        <div className="music-player">
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
                                            <div>{song.title}</div><div>{secondsToString(song.song.duration)}</div>
                                        </div>
                                    )
                                }
                            )
                        }
                    </div>
                </>
            }

            <ExpandCollapseToggle onExpand={() => setExpanded(true)} onCollapse={() => setExpanded(false)} inverted />
        </div>
    )
}

function secondsToString(seconds: number): string {
    const minutes = Math.floor(seconds / 60.0)
    const secondsDisplay = (seconds - minutes * 60).toFixed(0)

    return `${minutes}:${secondsDisplay}`
}

export default MusicPlayer